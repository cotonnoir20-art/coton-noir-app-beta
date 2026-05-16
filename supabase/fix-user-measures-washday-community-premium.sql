-- ============================================================
-- À exécuter sur une base Supabase déjà en prod (SQL Editor).
-- Corrige : date objectif profil, posts communauté (insert membre),
-- bucket optionnel pour photos de posts.
-- ============================================================

-- 1) Profil : date cible objectif longueur (YYYY-MM-DD)
alter table public.profiles
  add column if not exists target_goal_date text default '';

-- 2) Communauté : auteur lié au compte
alter table public.community_posts
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- 2b) S’assurer que la FK pointe bien vers auth.users (certaines bases avaient profiles → échec insert).
alter table public.community_posts drop constraint if exists community_posts_user_id_fkey;
alter table public.community_posts
  add constraint community_posts_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- Impose user_id = auth.uid() à chaque insert (anti-usurpation d’auteur).
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

-- Contrainte status alignée avec l’app (published) et le SELECT policy (status = published).
alter table public.community_posts drop constraint if exists community_posts_status_chk;
update public.community_posts set status = 'published' where status = 'active';
alter table public.community_posts add constraint community_posts_status_chk
  check (status in ('draft', 'published', 'archived'));

-- Insert membre : user_id doit correspondre au compte (le trigger force auth.uid() avant le check RLS).
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

-- 3) Stockage public pour les images de posts (optionnel)
insert into storage.buckets (id, name, public)
values ('community-posts', 'community-posts', true)
on conflict (id) do nothing;

drop policy if exists "community-posts read public" on storage.objects;
create policy "community-posts read public"
  on storage.objects for select
  to public
  using (bucket_id = 'community-posts');

-- Insert : politique large (le chemin reste userId/… côté app pour l’organisation).
drop policy if exists "community-posts insert own folder" on storage.objects;
drop policy if exists "community-posts insert authenticated" on storage.objects;
create policy "community-posts insert authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'community-posts');

-- Permet à l’utilisateur de remplacer sa propre image (même chemin / upsert).
drop policy if exists "community-posts update own" on storage.objects;
create policy "community-posts update own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'community-posts')
  with check (bucket_id = 'community-posts');
