-- =============================================================================
-- HIGHLIGHTS uniquement — à exécuter sur une base Supabase DÉJÀ initialisée
-- (ne pas rejouer schema.sql entier : erreur "relation profiles already exists").
-- Dashboard → SQL Editor → coller ce fichier → Run
-- =============================================================================

create table if not exists public.highlights (
  id          uuid primary key default gen_random_uuid(),
  badge       text not null,
  title       text not null,
  sub         text not null,
  footer_left text not null default '',
  variant     text not null default 'neutral',
  route       text,
  sort_order  int not null default 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  status      text not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint highlights_variant_chk check (variant in ('live', 'premium', 'neutral')),
  constraint highlights_status_chk check (status in ('draft', 'published', 'archived'))
);

create index if not exists highlights_status_sort_idx on public.highlights (status, sort_order);

alter table public.highlights enable row level security;

drop policy if exists "Highlights lecture publique publiees" on public.highlights;
create policy "Highlights lecture publique publiees"
  on public.highlights for select
  to anon, authenticated
  using (
    status = 'published'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

-- Nécessite la table public.admin_users (déjà créée par le schéma principal).
drop policy if exists "Highlights gestion admins insert" on public.highlights;
create policy "Highlights gestion admins insert"
  on public.highlights for insert
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.active = true
    )
  );

drop policy if exists "Highlights gestion admins update" on public.highlights;
create policy "Highlights gestion admins update"
  on public.highlights for update
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.active = true
    )
  )
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.active = true
    )
  );

drop policy if exists "Highlights gestion admins delete" on public.highlights;
create policy "Highlights gestion admins delete"
  on public.highlights for delete
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

insert into public.highlights (id, badge, title, sub, footer_left, variant, route, sort_order, status, starts_at, ends_at)
values
  (
    'a0000001-0000-4000-8000-000000000001',
    E'● LIVE',
    'Hydra Challenge 30',
    '1247 participantes · jour 8 / 30',
    '+30 pts défi/jour',
    'live',
    '/community',
    0,
    'published',
    null,
    null
  ),
  (
    'a0000002-0000-4000-8000-000000000002',
    E'● 3 J RESTANTS',
    'Box Mai · Karité',
    E'Dispo jusqu''au 17 mai',
    'Premium',
    'premium',
    '/box',
    1,
    'published',
    null,
    null
  ),
  (
    'a0000003-0000-4000-8000-000000000003',
    E'● NOUVEAU',
    'Analyse IA express',
    'Black Cotton · conseils perso en quelques minutes',
    '+10 CC',
    'neutral',
    '/(tabs)/analyze',
    2,
    'published',
    null,
    null
  ),
  (
    'a0000004-0000-4000-8000-000000000004',
    E'● 5 MIN',
    'Routine humidité express',
    E'Un tuto court pour lancer la journée sans prise de tête',
    'Tutos',
    'neutral',
    '/tutorials',
    3,
    'published',
    null,
    null
  ),
  (
    'a0000005-0000-4000-8000-000000000005',
    E'● EN COURS',
    'Parrainage x2',
    E'Ton amie s''inscrit avec ton code → CC pour vous deux (plafonné)',
    'Inviter',
    'live',
    '/invite',
    4,
    'published',
    null,
    null
  )
on conflict (id) do nothing;
