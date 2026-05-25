-- ============================================================
-- CotonCoins d’accueil (50 CC) + colonnes profil manquantes
-- À exécuter dans Supabase → SQL Editor (projet déjà en prod).
--
-- Problèmes corrigés :
-- 1) handle_new_user() ne mettait que id + name → coins restaient à 0.
-- 2) L’app envoie region / climate / budget / total_earned : les colonnes
--    doivent exister sinon l’upsert client échoue sans message clair.
-- 3) Le bonus est appliqué côté serveur (security definer) : fonctionne
--    même si la confirmation e-mail retarde la session client.
-- ============================================================

alter table public.profiles add column if not exists region text default '';
alter table public.profiles add column if not exists climate text default '';
alter table public.profiles add column if not exists budget text default '';
alter table public.profiles add column if not exists total_earned int not null default 0;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d text := to_char(coalesce(new.created_at, now()) at time zone 'utc', 'YYYY-MM-DD');
begin
  insert into public.profiles (
    id,
    name,
    hair_type,
    porosity,
    density,
    coins,
    total_earned
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Utilisatrice'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'hair_type'), ''), '3C'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'porosity'), ''), 'Moyenne'),
    coalesce(nullif(trim(new.raw_user_meta_data->>'density'), ''), 'Moyenne'),
    50,
    50
  )
  on conflict (id) do update set
    coins = greatest(public.profiles.coins, 50),
    total_earned = greatest(public.profiles.total_earned, 50);

  insert into public.coin_history (user_id, label, amount, date)
  select
    new.id,
    'Bienvenue sur Coton Noir 🎉',
    50,
    d
  where not exists (
    select 1
    from public.coin_history ch
    where ch.user_id = new.id
      and ch.label = 'Bienvenue sur Coton Noir 🎉'
      and ch.amount = 50
  );

  return new;
end;
$$;
