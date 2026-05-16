-- ============================================================
-- Si tu as DÉJÀ créé la table `recipes` dans Supabase (admin / SQL)
-- mais que l'app affiche 0 recette : c'est presque toujours le RLS.
-- Colle ce script dans Supabase → SQL Editor → Run.
-- ============================================================

alter table public.recipes enable row level security;

drop policy if exists "Recettes — lecture pour l'app" on public.recipes;
drop policy if exists "Recettes lisibles par tous" on public.recipes;

create policy "Recettes — lecture pour l'app"
  on public.recipes for select
  to anon, authenticated
  using (true);
