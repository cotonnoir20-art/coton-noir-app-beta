-- Erreur : violates foreign key constraint "community_posts_user_id_fkey"
-- Cause fréquente : la FK pointe vers public.profiles(id) au lieu de auth.users(id).
--   → l’utilisatrice existe dans auth.users mais pas encore (ou plus) dans profiles.
-- Exécute ce fichier dans Supabase → SQL Editor (réexécutable).

alter table public.community_posts drop constraint if exists community_posts_user_id_fkey;

alter table public.community_posts
  add constraint community_posts_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
