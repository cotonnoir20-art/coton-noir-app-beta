-- À exécuter si tu as déjà la colonne user_id + trigger mais :
--   • erreur « violates row-level security » sur community_posts
--   • erreur « violates check constraint community_posts_status_chk » (status)
--   • erreur « violates foreign key community_posts_user_id_fkey » (FK vers auth.users)
--
-- ⚠️ Storage : n’utilise PAS ce fichier pour le bucket communauté.
--    Exécute « security-community-storage.sql » (bucket privé, dossier par user, signed URLs).
-- (réexécutable : drop + create des policies community_posts ci-dessous)

-- ── community_posts : contrainte status ──
alter table public.community_posts drop constraint if exists community_posts_status_chk;
update public.community_posts set status = 'published' where status = 'active';
alter table public.community_posts add constraint community_posts_status_chk
  check (status in ('draft', 'published', 'archived'));

-- ── community_posts : FK user_id → auth.users ──
alter table public.community_posts drop constraint if exists community_posts_user_id_fkey;
alter table public.community_posts
  add constraint community_posts_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- ── community_posts : trigger + policy insert (user_id lié au compte) ──
create or replace function public.community_posts_set_user_id()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'community_posts: authentification requise pour publier';
  end if;
  new.user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists community_posts_set_user_id on public.community_posts;
create trigger community_posts_set_user_id
  before insert on public.community_posts
  for each row execute function public.community_posts_set_user_id();

drop policy if exists "Posts communauté insertion membre" on public.community_posts;
create policy "Posts communauté insertion membre"
  on public.community_posts for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and coalesce(trim(text), '') <> ''
    and status = 'published'
  );
