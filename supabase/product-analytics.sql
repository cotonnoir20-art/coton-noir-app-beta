-- KPI Jour 0 / rétention — événements produit + vues reporting
-- Exécuter sur une base Supabase déjà initialisée (script incrémental).

create table if not exists public.product_events (
  id              bigserial primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  event_name      text not null,
  user_created_at timestamptz,
  payload         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists product_events_user_idx
  on public.product_events (user_id, created_at desc);

create index if not exists product_events_name_idx
  on public.product_events (event_name, created_at desc);

alter table public.product_events enable row level security;

drop policy if exists "Insérer ses propres events" on public.product_events;
create policy "Insérer ses propres events"
  on public.product_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "Lire ses propres events" on public.product_events;
create policy "Lire ses propres events"
  on public.product_events for select
  using (auth.uid() = user_id);

-- Flag onboarding terminé (complément AsyncStorage)
alter table public.profiles
  add column if not exists onboarding_done boolean not null default false;

-- ── Vues KPI (admin / SQL Editor) ─────────────────────────────────────────

create or replace view public.kpi_onboarding_completed_j1 as
select
  date_trunc('day', u.created_at at time zone 'utc') as signup_day,
  count(*)::int as signups,
  count(*) filter (
    where exists (
      select 1 from public.product_events pe
      where pe.user_id = u.id
        and pe.event_name = 'onboarding_completed'
        and pe.created_at < u.created_at + interval '1 day'
    )
  )::int as onboarding_completed_j1,
  round(
    100.0 * count(*) filter (
      where exists (
        select 1 from public.product_events pe
        where pe.user_id = u.id
          and pe.event_name = 'onboarding_completed'
          and pe.created_at < u.created_at + interval '1 day'
      )
    ) / nullif(count(*), 0),
    1
  ) as pct_j1
from auth.users u
group by 1
order by 1 desc;

create or replace view public.kpi_first_action_j7 as
select
  date_trunc('day', u.created_at at time zone 'utc') as signup_day,
  count(*)::int as signups,
  count(*) filter (
    where exists (
      select 1 from public.product_events pe
      where pe.user_id = u.id
        and pe.event_name in ('first_routine_validated', 'first_measurement')
        and pe.created_at < u.created_at + interval '7 days'
    )
  )::int as first_action_j7,
  round(
    100.0 * count(*) filter (
      where exists (
        select 1 from public.product_events pe
        where pe.user_id = u.id
          and pe.event_name in ('first_routine_validated', 'first_measurement')
          and pe.created_at < u.created_at + interval '7 days'
      )
    ) / nullif(count(*), 0),
    1
  ) as pct_j7
from auth.users u
group by 1
order by 1 desc;

-- ── Boucle quotidienne : validations / semaine & streak ───────────────────

create or replace view public.kpi_routines_validated_per_week as
select
  date_trunc('week', rl.logged_at at time zone 'utc') as week_start,
  count(*)::int as validations,
  count(distinct rl.user_id)::int as active_users
from public.routine_logs rl
where rl.routine_type in ('daily', 'night')
group by 1
order by 1 desc;

create or replace view public.kpi_weekly_active_users as
select
  date_trunc('week', rl.logged_at at time zone 'utc') as week_start,
  count(distinct rl.user_id)::int as users_with_routine_validation
from public.routine_logs rl
where rl.routine_type in ('daily', 'night')
group by 1
order by 1 desc;

create or replace view public.kpi_streak_median as
select
  percentile_cont(0.5) within group (order by p.streak)::numeric(10, 1) as median_streak,
  avg(p.streak)::numeric(10, 1) as avg_streak,
  count(*)::int as profiles_count
from public.profiles p
where p.streak > 0;

create or replace view public.kpi_routine_validations_events as
select
  date_trunc('day', pe.created_at at time zone 'utc') as day,
  pe.payload->>'routine_type' as routine_type,
  count(*)::int as events
from public.product_events pe
where pe.event_name = 'routine_validated'
group by 1, 2
order by 1 desc, 2;

-- ── Wash day : planifications, checklist, fréquence ─────────────────────────

create or replace view public.kpi_washdays_per_month as
select
  date_trunc('month', rl.logged_at at time zone 'utc') as month_start,
  count(*)::int as washday_validations,
  count(distinct rl.user_id)::int as users
from public.routine_logs rl
where rl.routine_type = 'washday'
group by 1
order by 1 desc;

create or replace view public.kpi_washday_avg_interval_days as
with ordered as (
  select
    rl.user_id,
    rl.logged_at::date as d,
    lag(rl.logged_at::date) over (partition by rl.user_id order by rl.logged_at) as prev_d
  from public.routine_logs rl
  where rl.routine_type = 'washday'
),
gaps as (
  select user_id, (d - prev_d) as gap_days
  from ordered
  where prev_d is not null
)
select
  round(avg(gap_days)::numeric, 1) as avg_days_between_washdays,
  count(distinct user_id)::int as users_with_2_plus
from gaps;

create or replace view public.kpi_washday_planned_events as
select
  date_trunc('day', pe.created_at at time zone 'utc') as day,
  count(*)::int as planned_events
from public.product_events pe
where pe.event_name = 'washday_planned'
group by 1
order by 1 desc;

create or replace view public.kpi_washday_checklist_completion as
select
  date_trunc('day', pe.created_at at time zone 'utc') as day,
  round(avg((pe.payload->>'pct')::numeric), 1) as avg_checklist_pct,
  count(*)::int as validations_tracked
from public.product_events pe
where pe.event_name = 'washday_checklist_pct'
group by 1
order by 1 desc;

-- ── Pousse : mesures / mois & corrélation rétention ─────────────────────────

create or replace view public.kpi_measurements_per_month as
select
  date_trunc('month', pe.created_at at time zone 'utc') as month_start,
  count(*) filter (where pe.event_name = 'measurement_saved')::int as measurements_saved,
  count(distinct pe.user_id) filter (where pe.event_name = 'measurement_saved')::int as users_measuring
from public.product_events pe
where pe.event_name in ('measurement_saved', 'first_measurement')
group by 1
order by 1 desc;

create or replace view public.kpi_measurement_retention_correlation as
with first_m as (
  select user_id, min(created_at) as first_measurement_at
  from public.product_events
  where event_name = 'first_measurement'
  group by 1
),
cohort as (
  select
    u.id as user_id,
    u.created_at as signup_at,
    fm.first_measurement_at,
    exists (
      select 1 from public.product_events pe2
      where pe2.user_id = u.id
        and pe2.event_name = 'measurement_saved'
        and pe2.created_at > fm.first_measurement_at + interval '30 days'
    ) as measured_again_30d,
    exists (
      select 1 from public.routine_logs rl
      where rl.user_id = u.id
        and rl.logged_at > coalesce(fm.first_measurement_at, u.created_at) + interval '7 days'
    ) as active_week_after
  from auth.users u
  left join first_m fm on fm.user_id = u.id
)
select
  count(*) filter (where first_measurement_at is not null)::int as users_with_first_measurement,
  count(*) filter (where first_measurement_at is not null and measured_again_30d)::int as repeat_measurement_30d,
  round(
    100.0 * count(*) filter (where first_measurement_at is not null and measured_again_30d)
    / nullif(count(*) filter (where first_measurement_at is not null), 0),
    1
  ) as pct_repeat_measurement_30d,
  round(
    100.0 * count(*) filter (where first_measurement_at is not null and active_week_after)
    / nullif(count(*) filter (where first_measurement_at is not null), 0),
    1
  ) as pct_active_week_after_first_measurement
from cohort;

-- ── Analyse capillaire : complétions & adoption routine ─────────────────────

create or replace view public.kpi_analysis_completed_per_day as
select
  date_trunc('day', pe.created_at at time zone 'utc') as day,
  count(*)::int as analyses_completed,
  count(distinct pe.user_id)::int as users_analyzing
from public.product_events pe
where pe.event_name = 'analysis_completed'
group by 1
order by 1 desc;

create or replace view public.kpi_analysis_routine_adoption as
with completed as (
  select user_id, min(created_at) as first_analysis_at
  from public.product_events
  where event_name = 'analysis_completed'
  group by 1
),
adopted as (
  select user_id, min(created_at) as adopted_at
  from public.product_events
  where event_name = 'analysis_routine_adopted'
  group by 1
)
select
  count(*)::int as users_with_analysis,
  count(*) filter (
    where a.adopted_at is not null
      and a.adopted_at <= c.first_analysis_at + interval '7 days'
  )::int as adopted_routine_within_7d,
  round(
    100.0 * count(*) filter (
      where a.adopted_at is not null
        and a.adopted_at <= c.first_analysis_at + interval '7 days'
    ) / nullif(count(*), 0),
    1
  ) as pct_routine_adopted_7d
from completed c
left join adopted a on a.user_id = c.user_id;

-- ── Signaux test produit (reco profils similaires) ───────────────────────────
-- Exécuter aussi : supabase/product-test-signals.sql (table + RLS)

create or replace view public.kpi_product_test_signals_by_type as
select
  coalesce(hair_type, 'inconnu') as hair_type,
  coalesce(porosity, 'inconnu') as porosity,
  product_brand,
  product_name,
  count(*)::int as tests_count,
  count(distinct user_id)::int as users_count
from public.product_test_signals
group by 1, 2, 3, 4
order by tests_count desc;

-- ── Économie CotonCoins : gains, échanges, niveaux ───────────────────────────

create or replace view public.kpi_cc_earned_per_active_user_30d as
with active as (
  select distinct user_id
  from public.routine_logs
  where logged_at >= now() - interval '30 days'
),
earned as (
  select ch.user_id, sum(ch.amount)::int as cc_earned
  from public.coin_history ch
  where ch.amount > 0
    and ch.created_at >= now() - interval '30 days'
  group by 1
)
select
  count(distinct a.user_id)::int as active_users_30d,
  coalesce(sum(e.cc_earned), 0)::int as total_cc_earned_30d,
  round(
    coalesce(sum(e.cc_earned), 0)::numeric / nullif(count(distinct a.user_id), 0),
    1
  ) as avg_cc_earned_per_active_user_30d
from active a
left join earned e on e.user_id = a.user_id;

create or replace view public.kpi_reward_redemption_rate as
with earners as (
  select distinct user_id from public.coin_history where amount > 0
),
redeemers as (
  select distinct user_id from public.coin_history where amount < 0
),
events as (
  select distinct user_id from public.product_events where event_name = 'reward_redeemed'
)
select
  (select count(*) from earners)::int as users_who_earned_cc,
  (select count(*) from redeemers)::int as users_who_redeemed_catalog,
  (select count(*) from events)::int as users_with_redeem_event,
  round(
    100.0 * (select count(*) from redeemers) / nullif((select count(*) from earners), 0),
    1
  ) as pct_users_redeemed_vs_earners;

create or replace view public.kpi_level_distribution as
select
  case
    when p.total_earned >= 13000 then '10 Afrolicious Icon'
    when p.total_earned >= 9000  then '09 Wash Day Goddess'
    when p.total_earned >= 6000  then '08 Twist & Shine'
    when p.total_earned >= 4000  then '07 Kinky Diva'
    when p.total_earned >= 2500  then '06 Slay Braidy'
    when p.total_earned >= 1500  then '05 Crown Vibes'
    when p.total_earned >= 700   then '04 Glow Fro'
    when p.total_earned >= 300   then '03 Afro Queenie'
    when p.total_earned >= 100   then '02 Curlie Cutie'
    else '01 Baby Hair'
  end as level_bucket,
  count(*)::int as users_count
from public.profiles p
group by 1
order by 1;

-- ── Achievements : déblocages ────────────────────────────────────────────────

create or replace view public.kpi_achievement_unlocks as
select
  payload->>'achievement_id' as achievement_id,
  payload->>'group' as achievement_group,
  count(*)::int as unlock_events,
  count(distinct user_id)::int as users_unlocked
from public.product_events
where event_name = 'achievement_unlocked'
group by 1, 2
order by unlock_events desc;

-- ── Communauté & viralité ────────────────────────────────────────────────────

create or replace view public.kpi_community_posts_per_day as
select
  date_trunc('day', created_at at time zone 'utc') as day,
  count(*)::int as posts_published,
  count(*) filter (where type = 'avant_apres')::int as before_after_posts,
  count(*) filter (where challenge_slug = 'hydra30')::int as hydra_posts
from public.community_posts
where status = 'published'
group by 1
order by 1 desc;

create or replace view public.kpi_invite_and_reviews as
select
  (select count(*)::int from public.referrals) as total_referrals,
  (select count(distinct user_id)::int from public.product_events where event_name = 'invite_shared') as users_shared_invite,
  (select count(distinct user_id)::int from public.product_events where event_name = 'product_review_saved') as users_saved_product_review,
  (select count(*)::int from public.product_events where event_name = 'challenge_joined') as challenge_join_events;

create or replace view public.kpi_community_likes as
select
  date_trunc('day', created_at at time zone 'utc') as day,
  count(*)::int as likes_added
from public.community_post_likes
group by 1
order by 1 desc;

create or replace view public.kpi_hydra_challenge as
select
  (select count(*)::int from public.challenge_enrollments where challenge_slug = 'hydra30') as enrolled_users,
  (select count(distinct user_id)::int
   from public.community_posts
   where challenge_slug = 'hydra30' and status = 'published' and user_id is not null) as users_with_hydra_posts,
  (select count(*)::int
   from public.community_posts
   where challenge_slug = 'hydra30' and status = 'published') as hydra_posts_total;

-- ── Premium conversion ───────────────────────────────────────────────────────

create or replace view public.kpi_premium_funnel as
select
  (select count(*)::int from public.profiles where is_premium = true) as premium_subscribers,
  (select count(*)::int from public.product_events where event_name = 'premium_paywall_shown') as paywall_impressions,
  (select count(distinct user_id)::int from public.product_events where event_name = 'premium_paywall_shown') as users_saw_paywall,
  (select count(*)::int from public.product_events where event_name = 'premium_trial_started') as trial_starts,
  (select count(*)::int from public.product_events where event_name = 'premium_trial_first_value') as trial_first_values;
