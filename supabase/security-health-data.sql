-- ============================================================
-- Correctif sécurité / RGPD — Données capillaires (hair_analyses)
-- À exécuter dans Supabase → SQL Editor.
--
-- • RLS : lecture / insert / delete par propriétaire uniquement
-- • Pas de UPDATE client (historique immuable)
-- • Rétention : purge automatisable > 24 mois
-- • Chiffrement at-rest : géré par Supabase (PostgreSQL + disques chiffrés AWS)
--   + TLS en transit. Aucune action app requise pour at-rest.
-- • Photos d’analyse : non stockées en base (transit base64 → Edge Function uniquement)
-- ============================================================

-- Table (si projet créé avant schema.sql complet)
create table if not exists public.hair_analyses (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  questionnaire  jsonb       not null,
  analysis       jsonb       not null,
  photo_meta     jsonb       not null default '[]'::jsonb,
  score          int,
  hair_type      text,
  porosity       text,
  created_at     timestamptz not null default now()
);

create index if not exists hair_analyses_user_idx
  on public.hair_analyses(user_id, created_at desc);

alter table public.hair_analyses enable row level security;

drop policy if exists "Hair analyses - lecture par proprietaire" on public.hair_analyses;
create policy "Hair analyses - lecture par proprietaire"
  on public.hair_analyses for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Hair analyses - insertion par proprietaire" on public.hair_analyses;
create policy "Hair analyses - insertion par proprietaire"
  on public.hair_analyses for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and jsonb_typeof(questionnaire) = 'object'
    and jsonb_typeof(analysis) = 'object'
    and octet_length(questionnaire::text) <= 4096
    and octet_length(analysis::text) <= 16384
    and octet_length(coalesce(photo_meta, '[]'::jsonb)::text) <= 4096
  );

drop policy if exists "Hair analyses - suppression par proprietaire" on public.hair_analyses;
create policy "Hair analyses - suppression par proprietaire"
  on public.hair_analyses for delete
  to authenticated
  using (auth.uid() = user_id);

-- Limite taille côté serveur (double barrière avec policy)
create or replace function public.hair_analyses_guard_payload()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if octet_length(new.questionnaire::text) > 4096
     or octet_length(new.analysis::text) > 16384
     or octet_length(coalesce(new.photo_meta, '[]'::jsonb)::text) > 4096 then
    raise exception 'hair_analyses: payload trop volumineux';
  end if;
  return new;
end;
$$;

drop trigger if exists hair_analyses_guard_payload on public.hair_analyses;
create trigger hair_analyses_guard_payload
  before insert on public.hair_analyses
  for each row execute function public.hair_analyses_guard_payload();

-- Rétention 24 mois (à planifier via pg_cron ou tâche Dashboard)
create or replace function public.purge_hair_analyses_retention(
  retention_months int default 24
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted bigint;
begin
  if retention_months < 6 or retention_months > 120 then
    raise exception 'retention_months hors plage (6–120)';
  end if;
  delete from public.hair_analyses
  where created_at < now() - make_interval(months => retention_months);
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

revoke all on function public.purge_hair_analyses_retention(int) from public;
grant execute on function public.purge_hair_analyses_retention(int) to service_role;

comment on table public.hair_analyses is
  'Historique analyses capillaires (questionnaire + résumé). Photos non stockées. Rétention cible 24 mois (purge_hair_analyses_retention).';
