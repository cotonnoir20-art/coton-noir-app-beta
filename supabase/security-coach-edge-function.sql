-- ============================================================
-- Correctif sécurité #2 — Edge Function coach (quotas + RPC)
-- À exécuter dans Supabase → SQL Editor.
-- ============================================================

create table if not exists public.coach_api_usage (
  user_id         uuid not null references auth.users(id) on delete cascade,
  usage_date      date not null default ((timezone('utc', now()))::date),
  chat_count      int  not null default 0 check (chat_count >= 0),
  analysis_count  int  not null default 0 check (analysis_count >= 0),
  updated_at      timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create index if not exists coach_api_usage_date_idx
  on public.coach_api_usage (usage_date);

alter table public.coach_api_usage enable row level security;

-- Lecture de sa propre consommation (optionnel, debug / profil)
drop policy if exists "coach_api_usage select own" on public.coach_api_usage;
create policy "coach_api_usage select own"
  on public.coach_api_usage for select
  to authenticated
  using (auth.uid() = user_id);

-- Incrément atomique + contrôle quota (appelé avec JWT utilisateur)
create or replace function public.coach_consume_quota(p_kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid            uuid := auth.uid();
  v_today          date := (timezone('utc', now()))::date;
  v_chat_limit     int  := 40;
  v_analysis_limit int  := 5;
  v_chat           int;
  v_analysis       int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_kind not in ('chat', 'analysis') then
    return jsonb_build_object('ok', false, 'error', 'invalid_kind');
  end if;

  insert into public.coach_api_usage (user_id, usage_date, chat_count, analysis_count)
  values (v_uid, v_today, 0, 0)
  on conflict (user_id, usage_date) do nothing;

  select chat_count, analysis_count
    into v_chat, v_analysis
  from public.coach_api_usage
  where user_id = v_uid and usage_date = v_today
  for update;

  if p_kind = 'chat' and v_chat >= v_chat_limit then
    return jsonb_build_object(
      'ok', false, 'error', 'rate_limit',
      'kind', 'chat', 'limit', v_chat_limit, 'used', v_chat
    );
  end if;

  if p_kind = 'analysis' and v_analysis >= v_analysis_limit then
    return jsonb_build_object(
      'ok', false, 'error', 'rate_limit',
      'kind', 'analysis', 'limit', v_analysis_limit, 'used', v_analysis
    );
  end if;

  if p_kind = 'chat' then
    update public.coach_api_usage
      set chat_count = chat_count + 1, updated_at = now()
    where user_id = v_uid and usage_date = v_today;
  else
    update public.coach_api_usage
      set analysis_count = analysis_count + 1, updated_at = now()
    where user_id = v_uid and usage_date = v_today;
  end if;

  return jsonb_build_object('ok', true, 'kind', p_kind);
end;
$$;

revoke all on function public.coach_consume_quota(text) from public;
grant execute on function public.coach_consume_quota(text) to authenticated;

-- ============================================================
-- Déploiement Edge Function (Dashboard ou CLI)
-- ============================================================
-- 1. SQL Editor : exécuter ce fichier.
-- 2. Secrets :
--      ANTHROPIC_API_KEY=sk-ant-...
--      COACH_ALLOWED_ORIGINS=https://ton-domaine-pwa.com,http://localhost:8081
-- 3. Redéployer : coach-coton-noir
-- 4. Dashboard → Edge Functions → coach-coton-noir → Verify JWT = ON
--    (ou supabase/config.toml : verify_jwt = true)
--
-- Quotas par défaut (modifiables dans coach_consume_quota) :
--   • chat     : 40 / jour / utilisatrice
--   • analyse  :  5 / jour / utilisatrice
--
-- Suivi conso :
--   select * from coach_api_usage where usage_date = current_date order by chat_count desc;
