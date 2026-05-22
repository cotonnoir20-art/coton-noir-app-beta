-- Premium — quotas analyses mensuelles (gratuit vs abonné)
-- Exécuter après security-premium-checkout.sql et security-coach-edge-function.sql.

create or replace function public.get_monthly_analysis_count()
returns int
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::int
  from public.hair_analyses
  where user_id = auth.uid()
    and created_at >= date_trunc('month', timezone('utc', now()));
$$;

grant execute on function public.get_monthly_analysis_count() to authenticated;

-- Quota analyse : 2/mois gratuit, illimité si premium ou essai (essai géré côté app pour l’instant)
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
  v_analysis_day   int  := 5;
  v_analysis_month int  := 2;
  v_premium        boolean := false;
  v_chat           int;
  v_analysis       int;
  v_month_count    int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select coalesce(is_premium, false)
    into v_premium
  from public.profiles
  where id = v_uid;

  if v_premium then
    v_analysis_month := 999;
    v_analysis_day := 50;
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

  if p_kind = 'analysis' and v_analysis >= v_analysis_day then
    return jsonb_build_object(
      'ok', false, 'error', 'rate_limit',
      'kind', 'analysis', 'limit', v_analysis_day, 'used', v_analysis
    );
  end if;

  select public.get_monthly_analysis_count() into v_month_count;

  if p_kind = 'analysis' and v_month_count >= v_analysis_month then
    return jsonb_build_object(
      'ok', false, 'error', 'premium_required',
      'kind', 'analysis',
      'monthly_limit', v_analysis_month,
      'monthly_used', v_month_count
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

  return jsonb_build_object('ok', true, 'kind', p_kind, 'is_premium', v_premium);
end;
$$;
