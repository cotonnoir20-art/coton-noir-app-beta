-- ============================================================
-- COTON NOIR APP ? Sch?ma complet Supabase
-- ? coller dans : Supabase Dashboard ? SQL Editor ? Run
--
-- ??  NE PAS ex?cuter ce fichier ENTIER sur une base d?j? en prod /
--     d?j? initialis?e : les `create table` sans `if not exists` sur
--     profiles, coin_history, etc. provoquent l?erreur
--     ? relation "profiles" already exists ?.
--     Sur une base existante : n?ex?cuter que des scripts incr?mentaux
--     (ex. supabase/highlights-only.sql pour la table highlights).
-- ============================================================


-- ?? 1. PROFILES ?????????????????????????????????????????????
-- Stocke le profil utilisateur + solde coins + streak
create table public.profiles (
  id              uuid        references auth.users(id) on delete cascade primary key,
  name            text        not null default 'Utilisatrice',
  hair_type       text        not null default '3C',
  porosity        text        not null default 'Moyenne',
  density         text        not null default '?paisse',
  length          text                 default '',
  objective       text                 default '',
  target_length   text                 default '',
  routine_type    text                 default '',
  problematics    text[]               default '{}',
  region          text                 default '',
  climate         text                 default '',
  budget          text                 default '',
  total_earned    int         not null default 0,
  -- Pr?f?rence de soin : 'shop' | 'diy' | 'mix' (vide tant que non renseign?)
  care_style      text                 default '',
  coins           int         not null default 0,
  streak          int         not null default 0,
  last_routine_date date               default null,
  created_at      timestamptz          default now(),
  updated_at      timestamptz          default now()
);

-- Migration s?re si la table existait d?j? (d?ploiements ant?rieurs)
alter table public.profiles add column if not exists care_style text default '';

alter table public.profiles enable row level security;

create policy "Voir son propre profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Modifier son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Cr?er son propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);


-- ?? 2. COIN_HISTORY ?????????????????????????????????????????
-- Historique de toutes les transactions CotonCoins
create table public.coin_history (
  id          bigserial   primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  label       text        not null,
  amount      int         not null,
  date        text        not null,
  created_at  timestamptz default now()
);

alter table public.coin_history enable row level security;

create policy "Voir son historique coins"
  on public.coin_history for select
  using (auth.uid() = user_id);

create policy "Ajouter ? son historique coins"
  on public.coin_history for insert
  with check (auth.uid() = user_id);

create index coin_history_user_id_idx on public.coin_history(user_id);
create index coin_history_created_at_idx on public.coin_history(created_at desc);


-- ?? 3. GROWTH_HISTORY ???????????????????????????????????????
-- Mesures de pousse par zone capillaire
create table public.growth_history (
  id          bigserial   primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  date        text        not null,
  zone        text        not null,
  cm          numeric(5,1) not null,
  created_at  timestamptz default now()
);

alter table public.growth_history enable row level security;

create policy "Voir son historique de pousse"
  on public.growth_history for select
  using (auth.uid() = user_id);

create policy "Ajouter une mesure de pousse"
  on public.growth_history for insert
  with check (auth.uid() = user_id);

create index growth_history_user_id_idx  on public.growth_history(user_id);
create index growth_history_zone_idx     on public.growth_history(zone);


-- ?? 4. ROUTINE_LOGS ?????????????????????????????????????????
-- Chaque fois qu'une routine est valid?e
create table public.routine_logs (
  id            bigserial   primary key,
  user_id       uuid        references auth.users(id) on delete cascade not null,
  routine_type  text        not null,
  logged_at     timestamptz default now()
);

alter table public.routine_logs enable row level security;

drop policy if exists "Voir ses routines valid?es" on public.routine_logs;
drop policy if exists "Enregistrer une routine valid?e" on public.routine_logs;

create policy "routine_logs select own"
  on public.routine_logs for select
  to authenticated
  using (auth.uid() = user_id);

-- INSERT uniquement via RPC validate_routine (security definer)
create unique index if not exists routine_logs_user_type_day_uidx
  on public.routine_logs (
    user_id,
    routine_type,
    ((logged_at at time zone 'utc')::date)
  );

create index if not exists routine_logs_user_id_idx on public.routine_logs(user_id);


-- ?? 5. TRIGGER : profil + 50 CotonCoins d'accueil (serveur)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d text := to_char(coalesce(new.created_at, now()) at time zone 'utc', 'YYYY-MM-DD');
begin
  insert into public.profiles (id, name, hair_type, porosity, density, coins, total_earned)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Utilisatrice'),
    '3C',
    'Moyenne',
    'Moyenne',
    50,
    50
  )
  on conflict (id) do update set
    coins = greatest(public.profiles.coins, 50),
    total_earned = greatest(public.profiles.total_earned, 50);

  insert into public.coin_history (user_id, label, amount, date)
  select new.id, 'Bienvenue sur Coton Noir ??', 50, d
  where not exists (
    select 1 from public.coin_history ch
    where ch.user_id = new.id and ch.label = 'Bienvenue sur Coton Noir ??' and ch.amount = 50
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ?? 6. TRIGGER : updated_at automatique sur profiles ????????
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();


-- ?? 7. RECETTES (contenu ?ditable depuis le dashboard Supabase) ??
-- L'app lit cette table avec la cl? anon : une policy SELECT publique est obligatoire.
create table if not exists public.recipes (
  id              uuid         primary key default gen_random_uuid(),
  name            text         not null,
  description     text,
  category        text,
  difficulty      text         not null default 'Facile',
  duration        int,
  hair_types      text[]       not null default '{}',
  ingredients     text[]       not null default '{}',
  steps           text[]       not null default '{}',
  image           text,
  likes           int          not null default 0,
  created_at      timestamptz  not null default now()
);

create index if not exists recipes_created_at_idx on public.recipes (created_at desc);
create index if not exists recipes_category_idx   on public.recipes (category);

alter table public.recipes enable row level security;

drop policy if exists "Recettes ? lecture pour l'app" on public.recipes;
create policy "Recettes ? lecture pour l'app"
  on public.recipes for select
  to anon, authenticated
  using (true);

-- Pas de policy INSERT/UPDATE pour anon : ajout / ?dition via Table Editor (r?le service) ou SQL.


-- ?? 8. ADMIN USERS ?????????????????????????????????????????????
-- Liste des comptes autoris?s ? utiliser le back-office (coton-noir-admin-hub).
-- On stocke seulement un lien vers auth.users + un r?le.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    text not null default 'admin', -- 'admin' | plus tard 'editor', etc.
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Seuls les admins peuvent voir la liste des admins.
drop policy if exists "Voir admin_users (admins seulement)" on public.admin_users;
create policy "Voir admin_users (admins seulement)"
  on public.admin_users for select
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

-- Seuls les admins peuvent ajouter / modifier des admins (via le back-office s?curis?).
drop policy if exists "G?rer admin_users (admins seulement)" on public.admin_users;

drop policy if exists "G?rer admin_users (insert admins seulement)" on public.admin_users;
create policy "G?rer admin_users (insert admins seulement)"
  on public.admin_users for insert
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

drop policy if exists "G?rer admin_users (update admins seulement)" on public.admin_users;
create policy "G?rer admin_users (update admins seulement)"
  on public.admin_users for update
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

drop policy if exists "G?rer admin_users (delete admins seulement)" on public.admin_users;
create policy "G?rer admin_users (delete admins seulement)"
  on public.admin_users for delete
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );


-- ?? 9. PRODUITS ????????????????????????????????????????????????
-- Contenu vitrine pour l'?cran Boutique. Lecture publique, ?criture r?serv?e aux admins.
create table if not exists public.products (
  id           uuid         primary key default gen_random_uuid(),
  name         text         not null,
  brand        text         not null,
  description  text,
  category     text         not null,          -- ex: 'masque', 'huile', 'shampoing'
  tags         text[]       not null default '{}',
  price_cents  int          not null default 0,
  currency     text         not null default 'EUR',
  image        text,
  url          text,                            -- lien e-commerce partenaire
  rating       numeric(2,1) default 0,          -- 0?5
  rating_count int          not null default 0,
  status       text         not null default 'draft', -- 'draft' | 'published' | 'archived'
  created_at   timestamptz  not null default now(),
  updated_at   timestamptz  not null default now()
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_status_idx   on public.products(status);

alter table public.products enable row level security;

-- Lecture publique uniquement des produits publi?s.
drop policy if exists "Produits ? lecture pour l'app" on public.products;
create policy "Produits ? lecture pour l'app"
  on public.products for select
  to anon, authenticated
  using (status = 'published');

-- ?criture r?serv?e aux admins (utilis?e par coton-noir-admin-hub).
drop policy if exists "Produits ? gestion par les admins" on public.products;
drop policy if exists "Produits ? gestion par les admins (insert)" on public.products;
create policy "Produits ? gestion par les admins (insert)"
  on public.products for insert
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

drop policy if exists "Produits ? gestion par les admins (update)" on public.products;
create policy "Produits ? gestion par les admins (update)"
  on public.products for update
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

drop policy if exists "Produits ? gestion par les admins (delete)" on public.products;
create policy "Produits ? gestion par les admins (delete)"
  on public.products for delete
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );


-- ?? 10. PARTENAIRES ???????????????????????????????????????????
-- Contenu vitrine pour l'?cran Partenaires (salons, e-shops, services).
create table if not exists public.partners (
  id          uuid         primary key default gen_random_uuid(),
  name        text         not null,
  kind        text         not null,          -- 'salon' | 'product' | 'service'
  description text,
  city        text,
  country     text,
  offer       text,
  website     text,
  instagram   text,
  rating      numeric(2,1) default 0,
  image_url   text,                            -- visuel principal de la carte
  logo_url    text,                            -- (optionnel) logo carr?
  status      text         not null default 'draft', -- 'draft' | 'published' | 'archived'
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

-- Migration s?re si la table existait d?j? sans ces colonnes
alter table public.partners add column if not exists image_url text;
alter table public.partners add column if not exists logo_url  text;

create index if not exists partners_kind_idx   on public.partners(kind);
create index if not exists partners_status_idx on public.partners(status);

alter table public.partners enable row level security;

-- Lecture publique uniquement des partenaires publi?s.
drop policy if exists "Partenaires ? lecture pour l'app" on public.partners;
create policy "Partenaires ? lecture pour l'app"
  on public.partners for select
  to anon, authenticated
  using (status = 'published');

-- ?criture partenaires r?serv?e aux admins (back-office).
drop policy if exists "Partenaires ? gestion par les admins" on public.partners;
drop policy if exists "Partenaires ? gestion par les admins (insert)" on public.partners;
create policy "Partenaires ? gestion par les admins (insert)"
  on public.partners for insert
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

drop policy if exists "Partenaires ? gestion par les admins (update)" on public.partners;
create policy "Partenaires ? gestion par les admins (update)"
  on public.partners for update
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

drop policy if exists "Partenaires ? gestion par les admins (delete)" on public.partners;
create policy "Partenaires ? gestion par les admins (delete)"
  on public.partners for delete
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );


-- ?? 11. POSTS COMMUNAUT? ??????????????????????????????????????
-- Posts du fil communaut?. Pour l'instant publi?s depuis le back-office admin.
create table if not exists public.community_posts (
  id            uuid         primary key default gen_random_uuid(),
  author_name   text         not null,
  verified      boolean      not null default false,
  type          text         not null default 'astuce', -- 'progres' | 'question' | 'astuce'
  text          text         not null,
  image         text,                                    -- URL image (optionnel)
  likes         int          not null default 0,
  comments      int          not null default 0,
  status        text         not null default 'draft',   -- 'draft' | 'published' | 'archived'
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now()
);

create index if not exists community_posts_status_idx     on public.community_posts(status);
create index if not exists community_posts_created_at_idx on public.community_posts(created_at desc);

-- Statuts : draft / published / archiv? (l?app publie avec status = published).
alter table public.community_posts drop constraint if exists community_posts_status_chk;
update public.community_posts set status = 'published' where status = 'active';
alter table public.community_posts add constraint community_posts_status_chk
  check (status in ('draft', 'published', 'archived'));

alter table public.community_posts enable row level security;

drop policy if exists "Posts communaut? ? lecture pour l'app" on public.community_posts;
create policy "Posts communaut? ? lecture pour l'app"
  on public.community_posts for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Posts communaut? ? gestion par les admins (insert)" on public.community_posts;
create policy "Posts communaut? ? gestion par les admins (insert)"
  on public.community_posts for insert
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

drop policy if exists "Posts communaut? ? gestion par les admins (update)" on public.community_posts;
create policy "Posts communaut? ? gestion par les admins (update)"
  on public.community_posts for update
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

drop policy if exists "Posts communaut? ? gestion par les admins (delete)" on public.community_posts;
create policy "Posts communaut? ? gestion par les admins (delete)"
  on public.community_posts for delete
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );


-- ?? 12. CODES PROMO ???????????????????????????????????????????
-- Codes promo affich?s dans l'?cran "Mes codes". Gestion via back-office admin.
create table if not exists public.promo_codes (
  id            uuid         primary key default gen_random_uuid(),
  brand         text         not null,
  description   text,
  code          text         not null,
  discount      text         not null,                    -- ex: '-15%', '-10?'
  icon_name     text,                                     -- nom Ionicons c?t? front (ex: 'bag-handle-outline')
  color_theme   text         not null default 'amber',    -- 'amber' | 'rose' | 'sage'
  expires_at    date,
  status        text         not null default 'active',   -- 'active' | 'archived' | 'used'
  saved         text,                                     -- libell? d'?conomie pour l'historique (ex: '12?')
  partner_url   text,                                     -- (optionnel) lien e-commerce vers la boutique partenaire
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now()
);

-- Migration compatible avec les bases existantes
alter table public.promo_codes add column if not exists partner_url text;

create index if not exists promo_codes_status_idx     on public.promo_codes(status);
create index if not exists promo_codes_created_at_idx on public.promo_codes(created_at desc);

alter table public.promo_codes enable row level security;

drop policy if exists "Codes promo ? lecture pour l'app" on public.promo_codes;
create policy "Codes promo ? lecture pour l'app"
  on public.promo_codes for select
  to anon, authenticated
  using (status in ('active', 'used', 'archived'));

drop policy if exists "Codes promo ? gestion par les admins (insert)" on public.promo_codes;
create policy "Codes promo ? gestion par les admins (insert)"
  on public.promo_codes for insert
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

drop policy if exists "Codes promo ? gestion par les admins (update)" on public.promo_codes;
create policy "Codes promo ? gestion par les admins (update)"
  on public.promo_codes for update
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

drop policy if exists "Codes promo ? gestion par les admins (delete)" on public.promo_codes;
create policy "Codes promo ? gestion par les admins (delete)"
  on public.promo_codes for delete
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );


-- ?? 13. PRODUITS ? colonnes suppl?mentaires (UI mobile) ??????????
-- Le back-office peut maintenant renseigner emoji, fond de carte, prix barr?, etc.
alter table public.products add column if not exists emoji            text;
alter table public.products add column if not exists bg_color         text;
alter table public.products add column if not exists old_price_cents  int;
alter table public.products add column if not exists discount_label   text;
alter table public.products add column if not exists ingredients      text;
alter table public.products add column if not exists description_full text;
alter table public.products add column if not exists is_featured      boolean not null default false;
alter table public.products add column if not exists featured_badge   text;
alter table public.products add column if not exists featured_bg      text;
alter table public.products add column if not exists featured_accent  text;

create index if not exists products_is_featured_idx on public.products(is_featured);


-- ?? 14. AVIS PRODUITS ????????????????????????????????????????????
create table if not exists public.product_reviews (
  id          uuid         primary key default gen_random_uuid(),
  product_id  uuid         not null references public.products(id) on delete cascade,
  author      text         not null,
  rating      int          not null check (rating between 1 and 5),
  text        text         not null,
  date_label  text,                                  -- ex: 'Avril 2026'
  status      text         not null default 'published',
  created_at  timestamptz  not null default now()
);

create index if not exists product_reviews_product_idx on public.product_reviews(product_id);
create index if not exists product_reviews_status_idx  on public.product_reviews(status);

alter table public.product_reviews enable row level security;

drop policy if exists "Avis produits ? lecture pour l'app" on public.product_reviews;
create policy "Avis produits ? lecture pour l'app"
  on public.product_reviews for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Avis produits ? gestion par les admins (insert)" on public.product_reviews;
create policy "Avis produits ? gestion par les admins (insert)"
  on public.product_reviews for insert
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

drop policy if exists "Avis produits ? gestion par les admins (update)" on public.product_reviews;
create policy "Avis produits ? gestion par les admins (update)"
  on public.product_reviews for update
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

drop policy if exists "Avis produits ? gestion par les admins (delete)" on public.product_reviews;
create policy "Avis produits ? gestion par les admins (delete)"
  on public.product_reviews for delete
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );


-- ?? 15. COIFFURES ????????????????????????????????????????????????
-- Cr?ation d?fensive : si la table existe d?j? via le back-office,
-- on s'assure quand m?me que toutes les colonnes n?cessaires sont pr?sentes.
create table if not exists public.hairstyles (
  id uuid primary key default gen_random_uuid()
);

alter table public.hairstyles add column if not exists name         text;
alter table public.hairstyles add column if not exists duration     text;
alter table public.hairstyles add column if not exists stars        numeric(2,1) default 0;
alter table public.hairstyles add column if not exists likes        int          not null default 0;
alter table public.hairstyles add column if not exists level        text         not null default 'd?butant';
alter table public.hairstyles add column if not exists bg_color     text;
alter table public.hairstyles add column if not exists emoji        text;
alter table public.hairstyles add column if not exists card_height  int          not null default 220;
alter table public.hairstyles add column if not exists tabs         text[]       not null default '{recent}';
alter table public.hairstyles add column if not exists status       text         not null default 'draft';
alter table public.hairstyles add column if not exists created_at   timestamptz  not null default now();
alter table public.hairstyles add column if not exists updated_at   timestamptz  not null default now();

-- D?tail coiffure (?cran avec ?tapes pas-?-pas)
alter table public.hairstyles add column if not exists description  text;
alter table public.hairstyles add column if not exists image        text;                          -- URL hero (CDN / Storage)
alter table public.hairstyles add column if not exists steps        text[]       not null default '{}';
alter table public.hairstyles add column if not exists tools        text[]       not null default '{}';
alter table public.hairstyles add column if not exists hair_types   text[]       not null default '{}';
alter table public.hairstyles add column if not exists tutorial_url text;                          -- YouTube / Instagram

create index if not exists hairstyles_status_idx     on public.hairstyles(status);
create index if not exists hairstyles_created_at_idx on public.hairstyles(created_at desc);

alter table public.hairstyles enable row level security;

drop policy if exists "Coiffures ? lecture pour l'app" on public.hairstyles;
create policy "Coiffures ? lecture pour l'app"
  on public.hairstyles for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Coiffures ? gestion par les admins (insert)" on public.hairstyles;
create policy "Coiffures ? gestion par les admins (insert)"
  on public.hairstyles for insert
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

drop policy if exists "Coiffures ? gestion par les admins (update)" on public.hairstyles;
create policy "Coiffures ? gestion par les admins (update)"
  on public.hairstyles for update
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

drop policy if exists "Coiffures ? gestion par les admins (delete)" on public.hairstyles;
create policy "Coiffures ? gestion par les admins (delete)"
  on public.hairstyles for delete
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );


-- ?? 15. ARTICLES (sponsoris?s par des pros) ????????????????????
-- Articles ?ditoriaux r?dig?s par des coiffeuses, blogueuses,
-- trichologues, coachs capillaires. Peuvent ?tre sponsoris?s.
create table if not exists public.articles (
  id              uuid         primary key default gen_random_uuid(),
  title           text         not null,
  subtitle        text,                              -- accroche / chapeau
  body            text         not null default '',  -- contenu principal (multi-paragraphes via \n\n)
  category        text,                              -- 'Routine' | 'Pousse' | 'Mode protecteur' | 'Trichologie' | 'Wellness' | 'T?moignage'
  image           text,                              -- visuel hero
  read_time       int          default 5,            -- temps de lecture en minutes
  -- Auteur (pro)
  author_name     text         not null,
  author_role     text         not null,             -- 'Coiffeuse' | 'Blogueuse' | 'Trichologue' | 'Coach capillaire'
  author_avatar   text,                              -- url photo de profil (optionnel)
  author_contact  text,                              -- email, IG, site web?
  -- Sponsor
  is_sponsored    boolean      not null default false,
  sponsor_brand   text,                              -- nom de la marque sponsor (optionnel)
  -- Engagement + ?tat
  likes           int          not null default 0,
  status          text         not null default 'draft', -- 'draft' | 'published' | 'archived'
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now()
);

create index if not exists articles_status_idx     on public.articles(status);
create index if not exists articles_category_idx   on public.articles(category);
create index if not exists articles_created_at_idx on public.articles(created_at desc);

alter table public.articles enable row level security;

-- Lecture publique uniquement des articles publi?s
drop policy if exists "Articles ? lecture pour l'app" on public.articles;
create policy "Articles ? lecture pour l'app"
  on public.articles for select
  to anon, authenticated
  using (status = 'published');

-- ?criture r?serv?e aux admins / pros via back-office
drop policy if exists "Articles ? gestion par les admins (insert)" on public.articles;
create policy "Articles ? gestion par les admins (insert)"
  on public.articles for insert
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.active = true
    )
  );

drop policy if exists "Articles ? gestion par les admins (update)" on public.articles;
create policy "Articles ? gestion par les admins (update)"
  on public.articles for update
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

drop policy if exists "Articles ? gestion par les admins (delete)" on public.articles;
create policy "Articles ? gestion par les admins (delete)"
  on public.articles for delete
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_super_admin = true and au.active = true
    )
  );

-- =====================================================================
-- REFERRALS (parrainage)
-- =====================================================================
--
-- Cette table prepare le suivi cote serveur des invitations. Chaque ligne
-- represente une amie qui s est inscrite via le code de la marraine.
-- Le credit de la marraine (+50 CC) est delivre cote serveur apres la
-- 1ere analyse de la filleule (status -> 'validated').
--
-- A l inscription, l app peut envoyer le code parrain saisi via un
-- ApplyReferralCode RPC qui insere ici la ligne (referrer_user_id, referee_user_id).
--
create table if not exists public.referrals (
  id               uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referee_user_id  uuid not null references auth.users(id) on delete cascade,
  referrer_code    text not null,
  status           text not null default 'pending' check (status in ('pending','validated','revoked')),
  validated_at     timestamptz,
  created_at       timestamptz not null default now(),
  unique (referee_user_id) -- une filleule = 1 seule marraine
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_user_id);
create index if not exists referrals_status_idx   on public.referrals(status);

alter table public.referrals enable row level security;

drop policy if exists "Referrals - lecture par les concernees" on public.referrals;
create policy "Referrals - lecture par les concernees"
  on public.referrals for select
  using (auth.uid() = referrer_user_id or auth.uid() = referee_user_id);


-- =====================================================================
-- HAIR ANALYSES (diagnostics croises photo + questionnaire)
-- =====================================================================
--
-- Chaque ligne represente une session d'analyse complete realisee par
-- l'utilisatrice (photos + reponses au questionnaire + diagnostic IA).
-- Ces donnees alimentent :
--   1) son historique personnel (graph evolution score)
--   2) l'amelioration de l'algorithme Black Cotton (analyse aggregee
--      des cas reels : reponses au questionnaire vs verdict photo)
--
-- Pas de base64 / photos : transit temporaire vers Edge Function coach uniquement.
-- analysis = r?sum? (score, type, porosit?, synthesis) ? pas routine/conseils d?taill?s.
-- R?tention cible 24 mois : voir security-health-data.sql (purge_hair_analyses_retention).
--
create table if not exists public.hair_analyses (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  questionnaire  jsonb       not null,
  analysis       jsonb       not null,
  photo_meta     jsonb       not null default '[]'::jsonb,   -- [{ label, byteSize, url? }]
  score          int,
  hair_type      text,
  porosity       text,
  created_at     timestamptz not null default now()
);

create index if not exists hair_analyses_user_idx    on public.hair_analyses(user_id, created_at desc);
create index if not exists hair_analyses_created_idx on public.hair_analyses(created_at desc);

alter table public.hair_analyses enable row level security;

drop policy if exists "Hair analyses - lecture par proprietaire" on public.hair_analyses;
create policy "Hair analyses - lecture par proprietaire"
  on public.hair_analyses for select
  using (auth.uid() = user_id);

drop policy if exists "Hair analyses - insertion par proprietaire" on public.hair_analyses;
create policy "Hair analyses - insertion par proprietaire"
  on public.hair_analyses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Hair analyses - suppression par proprietaire" on public.hair_analyses;
create policy "Hair analyses - suppression par proprietaire"
  on public.hair_analyses for delete
  using (auth.uid() = user_id);


-- =====================================================================
-- HIGHLIGHTS (Moments forts ? carrousel accueil)
-- =====================================================================
-- Contenu ?ditorial / ops : challenges, box, lives. Lecture publique
-- pour les lignes publi?es dans la fen?tre [starts_at, ends_at].

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

-- Graines (id fixes = idempotent)
insert into public.highlights (id, badge, title, sub, footer_left, variant, route, sort_order, status, starts_at, ends_at)
values
  (
    'a0000001-0000-4000-8000-000000000001',
    E'? LIVE',
    'Hydra Challenge 30',
    '1247 participantes ? jour 8 / 30',
    '+30 pts palier/jour',
    'live',
    '/community',
    0,
    'published',
    null,
    null
  ),
  (
    'a0000002-0000-4000-8000-000000000002',
    E'? 3 J RESTANTS',
    'Box Mai ? Karit?',
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
    E'? NOUVEAU',
    'Analyse IA express',
    'Black Cotton ? conseils perso en quelques minutes',
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
    E'? 5 MIN',
    'Routine humidit? express',
    E'Un tuto court pour lancer la journ?e sans prise de t?te',
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
    E'? EN COURS',
    'Parrainage x2',
    E'Ton amie s''inscrit avec ton code ? CC pour vous deux (plafonn?)',
    'Inviter',
    'live',
    '/invite',
    4,
    'published',
    null,
    null
  )
on conflict (id) do nothing;

