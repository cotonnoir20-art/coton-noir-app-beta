-- Signaux anonymisés « produit testé » pour recommandations profils similaires.
-- Exécuter sur Supabase (Dashboard SQL) en plus de product-analytics.sql.

create table if not exists public.product_test_signals (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  hair_type     text,
  porosity      text,
  objective     text,
  product_brand text        not null,
  product_name  text        not null,
  product_id    text,
  created_at    timestamptz not null default now()
);

create index if not exists product_test_signals_profile_idx
  on public.product_test_signals(hair_type, porosity, created_at desc);

create index if not exists product_test_signals_user_idx
  on public.product_test_signals(user_id, created_at desc);

alter table public.product_test_signals enable row level security;

drop policy if exists "Product test signals - insert own" on public.product_test_signals;
create policy "Product test signals - insert own"
  on public.product_test_signals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Product test signals - read authenticated" on public.product_test_signals;
create policy "Product test signals - read authenticated"
  on public.product_test_signals for select
  using (auth.uid() is not null);

comment on table public.product_test_signals is
  'Signaux post-test produit (profil + marque) pour agrégats reco communauté. Pas de données santé détaillées.';
