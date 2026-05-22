-- Communauté & viralité — avant/après, tag défi Hydra
-- Exécuter dans Supabase → SQL Editor (après security-community-storage.sql).

alter table public.community_posts add column if not exists image_after text;
alter table public.community_posts add column if not exists challenge_slug text;

alter table public.community_posts drop constraint if exists community_posts_type_chk;
alter table public.community_posts add constraint community_posts_type_chk
  check (type in ('progres', 'question', 'astuce', 'avant_apres'));

drop policy if exists "Posts communauté insertion membre" on public.community_posts;
create policy "Posts communauté insertion membre"
  on public.community_posts for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and coalesce(trim(text), '') <> ''
    and status = 'published'
    and type in ('progres', 'question', 'astuce', 'avant_apres')
    and public.community_post_image_belongs_to_user(image, auth.uid())
    and (
      image_after is null
      or public.community_post_image_belongs_to_user(image_after, auth.uid())
    )
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
    and (
      image_after is null
      or public.community_post_image_belongs_to_user(image_after, auth.uid())
    )
  );
