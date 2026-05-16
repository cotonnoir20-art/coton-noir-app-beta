-- Erreur : new row violates check constraint "community_posts_status_chk"
-- Cause : la contrainte n’autorisait pas la valeur « published » (ex. seulement draft/active).
-- Exécute ce fichier dans Supabase → SQL Editor (réexécutable).

alter table public.community_posts drop constraint if exists community_posts_status_chk;
update public.community_posts set status = 'published' where status = 'active';
alter table public.community_posts add constraint community_posts_status_chk
  check (status in ('draft', 'published', 'archived'));
