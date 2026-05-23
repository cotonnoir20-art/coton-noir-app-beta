-- ============================================================
-- Pré-déploiement — RLS manquant + WITH CHECK explicites
-- Exécuter dans Supabase → SQL Editor (base existante).
-- Idempotent : crée user_routine_plans / reward_* si absents.
-- ============================================================

-- ── 1. profiles : WITH CHECK explicite sur UPDATE ───────────────────────────
drop policy if exists "Modifier son propre profil" on public.profiles;
drop policy if exists "Modifier son propre profil" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;

create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── 2. user_routine_plans (table + RLS si pas encore déployée) ─────────────
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

drop policy if exists "user_routine_plans_select_own" on public.user_routine_plans;
create policy "user_routine_plans_select_own"
  on public.user_routine_plans for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_routine_plans_insert_own" on public.user_routine_plans;
create policy "user_routine_plans_insert_own"
  on public.user_routine_plans for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_routine_plans_update_own" on public.user_routine_plans;
create policy "user_routine_plans_update_own"
  on public.user_routine_plans for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_routine_plans_delete_own" on public.user_routine_plans;
create policy "user_routine_plans_delete_own"
  on public.user_routine_plans for delete
  to authenticated
  using (auth.uid() = user_id);

-- ── 3. reward_rules (catalogue gains CC — écran Récompenses) ─────────────────
create table if not exists public.reward_rules (
  id          uuid primary key default gen_random_uuid(),
  action      text,
  description text not null default '',
  emoji       text not null default '✅',
  freq        text not null default '—',
  amount_cc   int not null default 0 check (amount_cc >= 0),
  amount_pts  int check (amount_pts is null or amount_pts >= 0),
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists reward_rules_active_sort_idx
  on public.reward_rules (active, sort_order);

alter table public.reward_rules enable row level security;

drop policy if exists "reward_rules read active" on public.reward_rules;
create policy "reward_rules read active"
  on public.reward_rules for select
  to authenticated
  using (active = true);

drop policy if exists "reward_rules admin insert" on public.reward_rules;
create policy "reward_rules admin insert"
  on public.reward_rules for insert
  to authenticated
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

drop policy if exists "reward_rules admin update" on public.reward_rules;
create policy "reward_rules admin update"
  on public.reward_rules for update
  to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  )
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

drop policy if exists "reward_rules admin delete" on public.reward_rules;
create policy "reward_rules admin delete"
  on public.reward_rules for delete
  to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

-- ── 4. reward_catalog (catalogue échanges CC) ───────────────────────────────
create table if not exists public.reward_catalog (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  emoji       text not null default '🎁',
  cost        int not null default 0 check (cost >= 0),
  locked      boolean not null default false,
  status      text not null default 'active' check (status in ('active', 'archived', 'draft')),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists reward_catalog_status_sort_idx
  on public.reward_catalog (status, sort_order);

alter table public.reward_catalog enable row level security;

drop policy if exists "reward_catalog read active" on public.reward_catalog;
create policy "reward_catalog read active"
  on public.reward_catalog for select
  to authenticated
  using (status = 'active');

drop policy if exists "reward_catalog admin insert" on public.reward_catalog;
create policy "reward_catalog admin insert"
  on public.reward_catalog for insert
  to authenticated
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

drop policy if exists "reward_catalog admin update" on public.reward_catalog;
create policy "reward_catalog admin update"
  on public.reward_catalog for update
  to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  )
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

drop policy if exists "reward_catalog admin delete" on public.reward_catalog;
create policy "reward_catalog admin delete"
  on public.reward_catalog for delete
  to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

comment on table public.reward_rules is
  'Règles de gain CotonCoins (écran Récompenses). Lecture : active=true. Édition : admins.';

comment on table public.reward_catalog is
  'Catalogue d''échange CotonCoins. Lecture : status=active. Édition : admins.';
