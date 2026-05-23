-- Plans de routine personnalisés (daily / night / washday)
-- Sync cloud pour Black Cotton & recommandations par profil capillaire.
-- L’app persiste déjà en local (SecureStore) ; exécuter ce script pour activer la sync.

create table if not exists public.user_routine_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('daily', 'night', 'washday')),
  mode text not null default 'keep' check (mode in ('keep', 'try_new')),
  name text not null,
  items jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  hair_state_comment text not null default '',
  evolution_comment text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, kind)
);

create index if not exists user_routine_plans_user_id_idx
  on public.user_routine_plans (user_id);

alter table public.user_routine_plans enable row level security;

create policy "user_routine_plans_select_own"
  on public.user_routine_plans for select
  using (auth.uid() = user_id);

create policy "user_routine_plans_insert_own"
  on public.user_routine_plans for insert
  with check (auth.uid() = user_id);

create policy "user_routine_plans_update_own"
  on public.user_routine_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_routine_plans_delete_own"
  on public.user_routine_plans for delete
  using (auth.uid() = user_id);

comment on table public.user_routine_plans is
  'Routines personnalisées (produits, recettes, étapes, retours cheveux) pour le coach Black Cotton.';
