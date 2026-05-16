-- ============================================================
-- Correctif sécurité #3 — Communauté + Storage (durci)
-- À exécuter dans Supabase → SQL Editor (base existante).
--
-- • Bucket community-posts : PRIVÉ (public: false)
-- • Lecture : membres authentifiés (URLs signées côté app)
-- • Upload : uniquement dans {auth.uid()}/… + limite 5 Mo + MIME images
-- • Posts : insert/update/delete limités à l’auteur
-- • Colonne image : path storage ou URL legacy (migration optionnelle)
-- ============================================================

-- ── community_posts : contraintes ───────────────────────────────────────────
alter table public.community_posts drop constraint if exists community_posts_status_chk;
update public.community_posts set status = 'published' where status = 'active';
alter table public.community_posts add constraint community_posts_status_chk
  check (status in ('draft', 'published', 'archived'));

alter table public.community_posts drop constraint if exists community_posts_type_chk;
alter table public.community_posts add constraint community_posts_type_chk
  check (type in ('progres', 'question', 'astuce'));

alter table public.community_posts drop constraint if exists community_posts_text_len_chk;
alter table public.community_posts add constraint community_posts_text_len_chk
  check (char_length(trim(text)) between 1 and 2000);

-- FK user_id → auth.users
alter table public.community_posts drop constraint if exists community_posts_user_id_fkey;
alter table public.community_posts
  add constraint community_posts_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- Trigger INSERT : impose toujours user_id = auth.uid() (anti-usurpation)
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

-- Trigger UPDATE : user_id immuable (évite transfert de posts)
create or replace function public.community_posts_guard_user_id()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'community_posts: user_id ne peut pas être modifié';
  end if;
  return new;
end;
$$;

drop trigger if exists community_posts_guard_user_id on public.community_posts;
create trigger community_posts_guard_user_id
  before update on public.community_posts
  for each row execute function public.community_posts_guard_user_id();

alter table public.community_posts enable row level security;

-- Validation image : path `{uuid}/fichier` ou URL legacy vers son dossier
create or replace function public.community_post_image_belongs_to_user(
  p_image text,
  p_user_id uuid
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    p_image is null
    or p_image ~ (
      '^' || p_user_id::text || '/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$'
    )
    or p_image like '%/storage/v1/object/public/community-posts/' || p_user_id::text || '/%'
    or p_image like '%/storage/v1/object/sign/community-posts/' || p_user_id::text || '/%';
$$;

-- Migration optionnelle : URLs publiques → paths storage (réexécutable)
update public.community_posts
set image = regexp_replace(
  image,
  '^.*/storage/v1/object/(?:public|sign)/community-posts/',
  ''
)
where image is not null
  and image ~ '/storage/v1/object/(?:public|sign)/community-posts/';

-- ── community_posts : RLS membres ───────────────────────────────────────────
drop policy if exists "Posts communauté insertion membre" on public.community_posts;
create policy "Posts communauté insertion membre"
  on public.community_posts for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and coalesce(trim(text), '') <> ''
    and status = 'published'
    and type in ('progres', 'question', 'astuce')
    and public.community_post_image_belongs_to_user(image, auth.uid())
  );

drop policy if exists "Posts communauté update own" on public.community_posts;
create policy "Posts communauté update own"
  on public.community_posts for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and status = 'published'
    and coalesce(trim(text), '') <> ''
    and public.community_post_image_belongs_to_user(image, auth.uid())
  );

drop policy if exists "Posts communauté delete own" on public.community_posts;
create policy "Posts communauté delete own"
  on public.community_posts for delete
  to authenticated
  using (user_id = auth.uid());

-- ── Storage bucket community-posts (privé) ────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-posts',
  'community-posts',
  false,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public               = false,
  file_size_limit      = excluded.file_size_limit,
  allowed_mime_types   = excluded.allowed_mime_types;

-- Anciennes policies (y compris version permissive fix-community-posts-rls-storage-only)
drop policy if exists "community-posts read public" on storage.objects;
drop policy if exists "community-posts read authenticated" on storage.objects;
create policy "community-posts read authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'community-posts');

drop policy if exists "community-posts insert authenticated" on storage.objects;
drop policy if exists "community-posts insert own folder" on storage.objects;
create policy "community-posts insert own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'community-posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "community-posts update own" on storage.objects;
drop policy if exists "community-posts update own folder" on storage.objects;
create policy "community-posts update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'community-posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'community-posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "community-posts delete own folder" on storage.objects;
create policy "community-posts delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'community-posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
