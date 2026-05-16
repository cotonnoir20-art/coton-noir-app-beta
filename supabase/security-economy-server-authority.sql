-- ============================================================
-- Correctif sécurité #1 — Économie CotonCoins côté serveur
-- À exécuter dans Supabase → SQL Editor (base existante).
--
-- • Les colonnes coins / total_earned / streak / last_routine_date
--   ne sont plus modifiables par le client (JWT authenticated).
-- • coin_history : INSERT uniquement via fonctions security definer.
-- • RPC : validate_routine, grant_coins, spend_coins, claim_onboarding_gift
-- ============================================================

-- ── Idempotence des gains ponctuels ─────────────────────────────────────────
create table if not exists public.economy_grants (
  user_id         uuid        not null references auth.users(id) on delete cascade,
  idempotency_key text        not null,
  created_at      timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);

alter table public.economy_grants enable row level security;

drop policy if exists "economy_grants select own" on public.economy_grants;
create policy "economy_grants select own"
  on public.economy_grants for select
  to authenticated
  using (auth.uid() = user_id);

-- ── Bypass interne (fonctions security definer uniquement) ────────────────
create or replace function public._economy_bypass()
returns void
language plpgsql
as $$
begin
  perform set_config('app.economy_bypass', 'true', true);
end;
$$;

revoke all on function public._economy_bypass() from public;
grant execute on function public._economy_bypass() to service_role;

-- ── Garde profiles : blocage économie côté client ─────────────────────────
create or replace function public.profiles_guard_economy()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.economy_bypass', true) = 'true' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.coins             := 0;
    new.total_earned      := 0;
    new.streak            := 0;
    new.last_routine_date := null;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.coins             := old.coins;
    new.total_earned      := old.total_earned;
    new.streak            := old.streak;
    new.last_routine_date := old.last_routine_date;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_economy on public.profiles;
create trigger profiles_guard_economy
  before insert or update on public.profiles
  for each row
  execute function public.profiles_guard_economy();

-- ── coin_history : plus d'INSERT direct client ─────────────────────────────
drop policy if exists "Ajouter à son historique coins" on public.coin_history;
drop policy if exists "Ajouter ? son historique coins" on public.coin_history;

-- ── routine_logs : anti-doublon + pas d'INSERT client ─────────────────────
drop policy if exists "Enregistrer une routine validée" on public.routine_logs;
drop policy if exists "Enregistrer une routine valid?e" on public.routine_logs;
drop policy if exists "Voir ses routines validées" on public.routine_logs;
drop policy if exists "Voir ses routines valid?es" on public.routine_logs;

create policy "routine_logs select own"
  on public.routine_logs for select
  to authenticated
  using (auth.uid() = user_id);

-- Dédupliquer avant l’index (bases déjà peuplées)
delete from public.routine_logs a
using public.routine_logs b
where a.id > b.id
  and a.user_id = b.user_id
  and a.routine_type = b.routine_type
  and (a.logged_at at time zone 'utc')::date = (b.logged_at at time zone 'utc')::date;

-- Un seul log par (utilisatrice, type de routine, jour UTC)
create unique index if not exists routine_logs_user_type_day_uidx
  on public.routine_logs (
    user_id,
    routine_type,
    ((logged_at at time zone 'utc')::date)
  );

-- ── Helpers streak (alignés AppContext) ───────────────────────────────────
create or replace function public._compute_streak(
  p_current int,
  p_last_date date,
  p_today date
)
returns int
language plpgsql
immutable
as $$
declare
  v_yesterday date := p_today - 1;
begin
  if p_last_date is null then
    return 1;
  end if;
  if p_last_date = p_today then
    return greatest(p_current, 1);
  end if;
  if p_last_date = v_yesterday then
    return greatest(p_current, 0) + 1;
  end if;
  return 1;
end;
$$;

-- ── Helper validated flags (JSON) ─────────────────────────────────────────
create or replace function public._validated_today_json(p_uid uuid, p_today date)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'washday', exists (
      select 1 from public.routine_logs rl
      where rl.user_id = p_uid and rl.routine_type = 'washday'
        and (rl.logged_at at time zone 'utc')::date = p_today
    ),
    'daily', exists (
      select 1 from public.routine_logs rl
      where rl.user_id = p_uid and rl.routine_type = 'daily'
        and (rl.logged_at at time zone 'utc')::date = p_today
    ),
    'night', exists (
      select 1 from public.routine_logs rl
      where rl.user_id = p_uid and rl.routine_type = 'night'
        and (rl.logged_at at time zone 'utc')::date = p_today
    )
  );
$$;

-- ── RPC validate_routine (log unique + streak + récompenses atomiques) ─────
create or replace function public.validate_routine(p_routine_type text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid             uuid := auth.uid();
  v_today           date := (timezone('utc', now()))::date;
  v_profile         public.profiles%rowtype;
  v_cc              int;
  v_pts             int;
  v_label           text;
  v_new_streak      int;
  v_streak_bonus    int := 0;
  v_streak_changed  boolean;
  v_inserted        bigint;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_routine_type not in ('washday', 'daily', 'night') then
    return jsonb_build_object('ok', false, 'error', 'invalid_routine_type');
  end if;

  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  -- Réserver le créneau (anti-doublon + course concurrente)
  insert into public.routine_logs (user_id, routine_type)
  values (v_uid, p_routine_type)
  on conflict do nothing
  returning id into v_inserted;

  if v_inserted is null then
    return jsonb_build_object(
      'ok', true,
      'already_done', true,
      'coins', v_profile.coins,
      'total_earned', v_profile.total_earned,
      'streak', v_profile.streak,
      'last_routine_date', v_profile.last_routine_date,
      'validated_today', public._validated_today_json(v_uid, v_today)
    );
  end if;

  if p_routine_type = 'washday' then
    v_cc := 30;
    v_pts := 10;
    v_label := 'Wash day effectué';
  elsif p_routine_type = 'daily' then
    v_cc := 10;
    v_pts := 5;
    v_label := 'Routine Quotidienne complétée';
  else
    v_cc := 10;
    v_pts := 5;
    v_label := 'Routine Nuit complétée';
  end if;

  v_streak_changed := (v_profile.last_routine_date is distinct from v_today);
  v_new_streak := public._compute_streak(
    v_profile.streak,
    v_profile.last_routine_date,
    v_today
  );

  if v_streak_changed and v_new_streak > 0 and mod(v_new_streak, 30) = 0 then
    v_streak_bonus := 50;
  elsif v_streak_changed and v_new_streak > 0 and mod(v_new_streak, 7) = 0 then
    v_streak_bonus := 30;
  end if;

  perform public._economy_bypass();

  update public.profiles
  set
    coins             = coins + v_cc + v_streak_bonus,
    total_earned      = total_earned + v_pts,
    streak            = v_new_streak,
    last_routine_date = v_today
  where id = v_uid;

  insert into public.coin_history (user_id, label, amount, date)
  values (v_uid, v_label, v_cc, to_char(v_today, 'YYYY-MM-DD'));

  if v_streak_bonus > 0 then
    insert into public.coin_history (user_id, label, amount, date)
    values (
      v_uid,
      'Streak ' || v_new_streak::text || ' jours 🔥',
      v_streak_bonus,
      to_char(v_today, 'YYYY-MM-DD')
    );
  end if;

  select * into v_profile from public.profiles where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'already_done', false,
    'coins', v_profile.coins,
    'total_earned', v_profile.total_earned,
    'streak', v_profile.streak,
    'last_routine_date', v_profile.last_routine_date,
    'validated_today', public._validated_today_json(v_uid, v_today)
  );
end;
$$;

-- ── RPC grant_coins ────────────────────────────────────────────────────────
create or replace function public.grant_coins(
  p_amount int,
  p_label text,
  p_points int default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_today  text := to_char(timezone('utc', now()), 'YYYY-MM-DD');
  v_pts    int;
  v_profile public.profiles%rowtype;
  v_row_count int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 500 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  if p_label is null or length(trim(p_label)) < 2 or length(p_label) > 200 then
    return jsonb_build_object('ok', false, 'error', 'invalid_label');
  end if;

  v_pts := coalesce(p_points, p_amount);

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    insert into public.economy_grants (user_id, idempotency_key)
    values (v_uid, trim(p_idempotency_key))
    on conflict do nothing;

    get diagnostics v_row_count = row_count;
    if v_row_count = 0 then
      select * into v_profile from public.profiles where id = v_uid;
      return jsonb_build_object(
        'ok', true,
        'already_done', true,
        'coins', v_profile.coins,
        'total_earned', v_profile.total_earned,
        'streak', v_profile.streak,
        'last_routine_date', v_profile.last_routine_date
      );
    end if;
  end if;

  perform public._economy_bypass();

  update public.profiles
  set
    coins        = coins + p_amount,
    total_earned = total_earned + v_pts
  where id = v_uid;

  insert into public.coin_history (user_id, label, amount, date)
  values (v_uid, trim(p_label), p_amount, v_today);

  select * into v_profile from public.profiles where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'already_done', false,
    'coins', v_profile.coins,
    'total_earned', v_profile.total_earned,
    'streak', v_profile.streak,
    'last_routine_date', v_profile.last_routine_date
  );
end;
$$;

-- ── RPC spend_coins ────────────────────────────────────────────────────────
create or replace function public.spend_coins(
  p_amount int,
  p_label text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_today   text := to_char(timezone('utc', now()), 'YYYY-MM-DD');
  v_profile public.profiles%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 10000 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  if p_label is null or length(trim(p_label)) < 2 or length(p_label) > 200 then
    return jsonb_build_object('ok', false, 'error', 'invalid_label');
  end if;

  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  if v_profile.coins < p_amount then
    return jsonb_build_object('ok', false, 'error', 'insufficient_coins');
  end if;

  perform public._economy_bypass();

  update public.profiles
  set coins = coins - p_amount
  where id = v_uid;

  insert into public.coin_history (user_id, label, amount, date)
  values (v_uid, trim(p_label), -p_amount, v_today);

  select * into v_profile from public.profiles where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'coins', v_profile.coins,
    'total_earned', v_profile.total_earned,
    'streak', v_profile.streak,
    'last_routine_date', v_profile.last_routine_date
  );
end;
$$;

-- ── RPC claim_onboarding_gift (50 CC) ──────────────────────────────────────
create or replace function public.claim_onboarding_gift()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_today   text := to_char(timezone('utc', now()), 'YYYY-MM-DD');
  v_label   text := 'Bienvenue sur Coton Noir 🎉';
  v_amount  int := 50;
  v_profile public.profiles%rowtype;
  v_has_gift boolean;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select exists (
    select 1 from public.coin_history ch
    where ch.user_id = v_uid
      and ch.amount = v_amount
      and (
        ch.label = v_label
        or ch.label like 'Bienvenue sur Coton Noir%'
      )
  ) into v_has_gift;

  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'profile_not_found');
  end if;

  if v_has_gift and v_profile.coins >= v_amount then
    return jsonb_build_object(
      'ok', true,
      'already_done', true,
      'granted', false,
      'coins', v_profile.coins,
      'total_earned', v_profile.total_earned
    );
  end if;

  perform public._economy_bypass();

  if not v_has_gift then
    insert into public.coin_history (user_id, label, amount, date)
    values (v_uid, v_label, v_amount, v_today);
  end if;

  update public.profiles
  set
    coins        = greatest(coins, v_amount),
    total_earned = greatest(total_earned, v_amount)
  where id = v_uid;

  select * into v_profile from public.profiles where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'already_done', v_has_gift,
    'granted', true,
    'coins', v_profile.coins,
    'total_earned', v_profile.total_earned
  );
end;
$$;

revoke all on function public.validate_routine(text) from public;
revoke all on function public.grant_coins(int, text, int, text) from public;
revoke all on function public.spend_coins(int, text) from public;
revoke all on function public.claim_onboarding_gift() from public;

grant execute on function public.validate_routine(text) to authenticated;
grant execute on function public.grant_coins(int, text, int, text) to authenticated;
grant execute on function public.spend_coins(int, text) to authenticated;
grant execute on function public.claim_onboarding_gift() to authenticated;
