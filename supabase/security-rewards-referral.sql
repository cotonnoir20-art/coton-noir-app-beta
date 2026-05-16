-- ============================================================
-- Correctif sécurité #4 — Récompenses idempotentes + parrainage serveur
-- À exécuter dans Supabase → SQL Editor (après security-economy-server-authority.sql).
-- ============================================================

-- ── coin_history : lecture seule côté client ───────────────────────────────
drop policy if exists "Ajouter à son historique coins" on public.coin_history;
drop policy if exists "Ajouter ? son historique coins" on public.coin_history;

-- ── routine_logs : voir security-economy-server-authority.sql ─────────────

-- ── Code parrain sur profil ─────────────────────────────────────────────────
alter table public.profiles
  add column if not exists referral_code text;

create unique index if not exists profiles_referral_code_uidx
  on public.profiles (referral_code)
  where referral_code is not null;

create or replace function public.compute_referral_code(p_user_id uuid, p_name text)
returns text
language plpgsql
immutable
as $$
declare
  v_name text;
  v_hash text;
begin
  v_name := upper(
    regexp_replace(
      translate(
        coalesce(nullif(trim(p_name), ''), 'COTON'),
        'àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ',
        'aaaeeeeiioouucAAAEEEEIIOOUUC'
      ),
      '[^A-Za-z0-9]', '', 'g'
    )
  );
  v_name := left(v_name, 5);
  if v_name = '' then
    v_name := 'COTON';
  end if;
  v_hash := upper(right(md5(p_user_id::text), 4));
  return v_name || '-' || v_hash;
end;
$$;

create or replace function public.profiles_set_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null or trim(new.referral_code) = '' then
    new.referral_code := public.compute_referral_code(new.id, new.name);
  else
    new.referral_code := upper(trim(new.referral_code));
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_referral_code on public.profiles;
create trigger profiles_set_referral_code
  before insert or update of name, referral_code on public.profiles
  for each row
  execute function public.profiles_set_referral_code();

update public.profiles
set referral_code = public.compute_referral_code(id, name)
where referral_code is null or trim(referral_code) = '';

-- ── Parrainages enregistrés ─────────────────────────────────────────────────
create table if not exists public.referrals (
  referee_id    uuid        primary key references auth.users(id) on delete cascade,
  referrer_id   uuid        not null references auth.users(id) on delete cascade,
  referral_code text        not null,
  reward_cc     int         not null default 50,
  created_at    timestamptz not null default now(),
  constraint referrals_no_self check (referee_id <> referrer_id)
);

create index if not exists referrals_referrer_idx on public.referrals (referrer_id);

alter table public.referrals enable row level security;

drop policy if exists "referrals select own as referee" on public.referrals;
create policy "referrals select own as referee"
  on public.referrals for select
  to authenticated
  using (auth.uid() = referee_id);

drop policy if exists "referrals select own as referrer" on public.referrals;
create policy "referrals select own as referrer"
  on public.referrals for select
  to authenticated
  using (auth.uid() = referrer_id);

-- Crédit CC interne (marraine) — non appelable depuis le client
create or replace function public._grant_coins_to_user(
  p_user_id uuid,
  p_amount int,
  p_label text,
  p_idempotency_key text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today text := to_char(timezone('utc', now()), 'YYYY-MM-DD');
  v_row_count int;
begin
  if p_user_id is null or p_amount is null or p_amount <= 0 or p_amount > 500 then
    return;
  end if;
  if p_label is null or length(trim(p_label)) < 2 then
    return;
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    insert into public.economy_grants (user_id, idempotency_key)
    values (p_user_id, trim(p_idempotency_key))
    on conflict do nothing;
    get diagnostics v_row_count = row_count;
    if v_row_count = 0 then
      return;
    end if;
  end if;

  perform public._economy_bypass();

  update public.profiles
  set
    coins        = coins + p_amount,
    total_earned = total_earned + p_amount
  where id = p_user_id;

  insert into public.coin_history (user_id, label, amount, date)
  values (p_user_id, trim(p_label), p_amount, v_today);
end;
$$;

revoke all on function public._grant_coins_to_user(uuid, int, text, text) from public;

-- ── RPC : activer un code parrain (validation serveur + crédit filleule + marraine) ──
create or replace function public.apply_referral_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referee      uuid := auth.uid();
  v_clean        text;
  v_referrer     uuid;
  v_reward       int := 50;
  v_referee_row  jsonb;
  v_account_age  interval;
begin
  if v_referee is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  v_clean := upper(trim(coalesce(p_code, '')));
  if v_clean = '' then
    return jsonb_build_object('ok', false, 'error', 'empty');
  end if;
  if v_clean !~ '^[A-Z0-9]{2,8}-[A-Z0-9]{2,8}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_format');
  end if;

  if exists (select 1 from public.referrals r where r.referee_id = v_referee) then
    return jsonb_build_object('ok', false, 'error', 'already');
  end if;

  select age(now(), u.created_at) into v_account_age
  from auth.users u
  where u.id = v_referee;

  if v_account_age is null then
    return jsonb_build_object('ok', false, 'error', 'account_not_found');
  end if;

  if v_account_age > interval '30 days' then
    return jsonb_build_object('ok', false, 'error', 'account_too_old');
  end if;

  select id into v_referrer
  from public.profiles p
  where p.referral_code = v_clean
  limit 1;

  if v_referrer is null then
    return jsonb_build_object('ok', false, 'error', 'unknown_code');
  end if;

  if v_referrer = v_referee then
    return jsonb_build_object('ok', false, 'error', 'self');
  end if;

  insert into public.referrals (referee_id, referrer_id, referral_code, reward_cc)
  values (v_referee, v_referrer, v_clean, v_reward);

  perform public._grant_coins_to_user(
    v_referrer,
    v_reward,
    'Filleule inscrite via ton code 🎁',
    'referral_referrer_' || v_referee::text
  );

  v_referee_row := public.grant_coins(
    v_reward,
    'Code parrain activé 🎁',
    v_reward,
    'referral_signup_bonus'
  );

  return v_referee_row;
end;
$$;

revoke all on function public.apply_referral_code(text) from public;
grant execute on function public.apply_referral_code(text) to authenticated;

-- ── RPC : journal manuel (1 soin + 1 routine max / jour) ───────────────────
create or replace function public.grant_journal_entry(
  p_kind text,
  p_label text,
  p_entry_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_date  date := coalesce(p_entry_date, (timezone('utc', now()))::date);
  v_amount int;
  v_key   text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_kind not in ('soin', 'routine') then
    return jsonb_build_object('ok', false, 'error', 'invalid_kind');
  end if;

  if p_label is null or length(trim(p_label)) < 2 or length(p_label) > 120 then
    return jsonb_build_object('ok', false, 'error', 'invalid_label');
  end if;

  if p_entry_date is not null and p_entry_date > (timezone('utc', now()))::date then
    return jsonb_build_object('ok', false, 'error', 'future_date');
  end if;

  v_amount := case when p_kind = 'soin' then 30 else 10 end;
  v_key := 'journal_' || p_kind || '_' || to_char(v_date, 'YYYY-MM-DD');

  return public.grant_coins(
    v_amount,
    trim(p_label),
    v_amount,
    v_key
  );
end;
$$;

revoke all on function public.grant_journal_entry(text, text, date) from public;
grant execute on function public.grant_journal_entry(text, text, date) to authenticated;
