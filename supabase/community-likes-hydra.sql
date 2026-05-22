-- Likes serveur + défi Hydra (inscriptions & classement)
-- Exécuter après community-virality.sql et security-community-storage.sql.

-- ── Likes par post ───────────────────────────────────────────────────────────

create table if not exists public.community_post_likes (
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists community_post_likes_user_idx
  on public.community_post_likes(user_id);

alter table public.community_post_likes enable row level security;

drop policy if exists "Likes communauté lecture" on public.community_post_likes;
create policy "Likes communauté lecture"
  on public.community_post_likes for select
  to authenticated
  using (true);

drop policy if exists "Likes communauté insert own" on public.community_post_likes;
create policy "Likes communauté insert own"
  on public.community_post_likes for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Likes communauté delete own" on public.community_post_likes;
create policy "Likes communauté delete own"
  on public.community_post_likes for delete
  to authenticated
  using (user_id = auth.uid());

create or replace function public._sync_community_post_likes_count(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  select count(*)::int into v_count
  from public.community_post_likes
  where post_id = p_post_id;

  update public.community_posts
  set likes = v_count
  where id = p_post_id;
end;
$$;

create or replace function public.toggle_community_post_like(p_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_liked boolean;
  v_count int;
begin
  if v_uid is null then
    raise exception 'toggle_community_post_like: authentification requise';
  end if;

  if not exists (
    select 1 from public.community_posts
    where id = p_post_id and status = 'published'
  ) then
    raise exception 'toggle_community_post_like: post introuvable';
  end if;

  if exists (
    select 1 from public.community_post_likes
    where post_id = p_post_id and user_id = v_uid
  ) then
    delete from public.community_post_likes
    where post_id = p_post_id and user_id = v_uid;
    v_liked := false;
  else
    insert into public.community_post_likes (post_id, user_id)
    values (p_post_id, v_uid);
    v_liked := true;
  end if;

  perform public._sync_community_post_likes_count(p_post_id);

  select likes into v_count from public.community_posts where id = p_post_id;

  return jsonb_build_object('liked', v_liked, 'likes_count', coalesce(v_count, 0));
end;
$$;

grant execute on function public.toggle_community_post_like(uuid) to authenticated;

-- ── Inscriptions aux défis ───────────────────────────────────────────────────

create table if not exists public.challenge_enrollments (
  user_id        uuid not null references auth.users(id) on delete cascade,
  challenge_slug text not null,
  joined_at      date not null default (timezone('utc', now()))::date,
  created_at     timestamptz not null default now(),
  primary key (user_id, challenge_slug)
);

create index if not exists challenge_enrollments_slug_idx
  on public.challenge_enrollments(challenge_slug);

alter table public.challenge_enrollments enable row level security;

drop policy if exists "Défis inscription lecture" on public.challenge_enrollments;
create policy "Défis inscription lecture"
  on public.challenge_enrollments for select
  to authenticated
  using (true);

drop policy if exists "Défis inscription insert own" on public.challenge_enrollments;
create policy "Défis inscription insert own"
  on public.challenge_enrollments for insert
  to authenticated
  with check (user_id = auth.uid() and challenge_slug in ('hydra30'));

create or replace function public.join_challenge(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_joined date;
begin
  if v_uid is null then
    raise exception 'join_challenge: authentification requise';
  end if;

  if p_slug is null or p_slug not in ('hydra30') then
    raise exception 'join_challenge: défi inconnu';
  end if;

  insert into public.challenge_enrollments (user_id, challenge_slug, joined_at)
  values (v_uid, p_slug, (timezone('utc', now()))::date)
  on conflict (user_id, challenge_slug) do update
    set joined_at = public.challenge_enrollments.joined_at
  returning joined_at into v_joined;

  return jsonb_build_object('challenge_slug', p_slug, 'joined_at', v_joined);
end;
$$;

grant execute on function public.join_challenge(text) to authenticated;

-- ── Stats & classement Hydra ─────────────────────────────────────────────────

create or replace function public.get_hydra_my_stats()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_joined date;
  v_days int;
  v_posts int;
begin
  if v_uid is null then
    return null;
  end if;

  select joined_at into v_joined
  from public.challenge_enrollments
  where user_id = v_uid and challenge_slug = 'hydra30';

  select
    count(distinct (created_at at time zone 'utc')::date)::int,
    count(*)::int
  into v_days, v_posts
  from public.community_posts
  where user_id = v_uid
    and status = 'published'
    and challenge_slug = 'hydra30';

  return jsonb_build_object(
    'joined_at', v_joined,
    'active_days', coalesce(v_days, 0),
    'post_count', coalesce(v_posts, 0)
  );
end;
$$;

grant execute on function public.get_hydra_my_stats() to authenticated;

create or replace function public.get_hydra_leaderboard(p_limit int default 30)
returns table (
  rank_num     bigint,
  user_id      uuid,
  display_name text,
  active_days  int,
  post_count   int,
  is_me        boolean
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_lim int := greatest(1, least(coalesce(p_limit, 30), 100));
begin
  return query
  with scores as (
    select
      cp.user_id,
      max(cp.author_name) as display_name,
      count(distinct (cp.created_at at time zone 'utc')::date)::int as active_days,
      count(*)::int as post_count
    from public.community_posts cp
    where cp.status = 'published'
      and cp.challenge_slug = 'hydra30'
      and cp.user_id is not null
    group by cp.user_id
  ),
  ranked as (
    select
      row_number() over (order by s.active_days desc, s.post_count desc, s.display_name) as rank_num,
      s.user_id,
      s.display_name,
      s.active_days,
      s.post_count
    from scores s
  )
  select
    r.rank_num,
    r.user_id,
    r.display_name,
    r.active_days,
    r.post_count,
    (v_uid is not null and r.user_id = v_uid) as is_me
  from ranked r
  order by r.rank_num
  limit v_lim;
end;
$$;

grant execute on function public.get_hydra_leaderboard(int) to authenticated;

create or replace function public.get_hydra_participant_count()
returns int
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::int
  from public.challenge_enrollments
  where challenge_slug = 'hydra30';
$$;

grant execute on function public.get_hydra_participant_count() to authenticated;
