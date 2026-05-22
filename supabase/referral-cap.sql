-- Plafond parrainage marraine : 10 filleules rémunérées (500 CC max)
-- Exécuter dans Supabase → SQL Editor (après security-rewards-referral.sql).

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
  v_referrer_count int;
  v_max_referrals  int := 10;
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

  select count(*)::int into v_referrer_count
  from public.referrals r
  where r.referrer_id = v_referrer;

  insert into public.referrals (referee_id, referrer_id, referral_code, reward_cc)
  values (v_referee, v_referrer, v_clean, v_reward);

  if v_referrer_count < v_max_referrals then
    perform public._grant_coins_to_user(
      v_referrer,
      v_reward,
      'Filleule inscrite via ton code 🎁',
      'referral_referrer_' || v_referee::text
    );
  end if;

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
