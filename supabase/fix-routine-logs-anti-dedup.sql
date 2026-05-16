-- Correctif routine_logs : contrainte unique + RPC validate_routine idempotente
-- Prérequis : security-economy-server-authority.sql (_economy_bypass, _compute_streak, …)
-- À exécuter si l’économie a été migrée avant la section routine_logs. (réexécutable)

drop policy if exists "Enregistrer une routine validée" on public.routine_logs;
drop policy if exists "Enregistrer une routine valid?e" on public.routine_logs;

drop policy if exists "routine_logs select own" on public.routine_logs;
create policy "routine_logs select own"
  on public.routine_logs for select
  to authenticated
  using (auth.uid() = user_id);

delete from public.routine_logs a
using public.routine_logs b
where a.id > b.id
  and a.user_id = b.user_id
  and a.routine_type = b.routine_type
  and (a.logged_at at time zone 'utc')::date = (b.logged_at at time zone 'utc')::date;

create unique index if not exists routine_logs_user_type_day_uidx
  on public.routine_logs (
    user_id,
    routine_type,
    ((logged_at at time zone 'utc')::date)
  );

-- ── RPC validate_routine (identique à security-economy-server-authority.sql) ─
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

revoke all on function public.validate_routine(text) from public;
grant execute on function public.validate_routine(text) to authenticated;
