-- Recos « profils similaires » depuis user_routine_plans (produits testés) + profiles.
-- Exécuter après user-routine-plans.sql

create or replace function public.fetch_similar_routine_plan_products(
  match_hair_type text default null,
  match_porosity text default null,
  result_limit int default 5
)
returns table (
  product_brand text,
  product_name text,
  hair_type text,
  porosity text,
  outcome_snippet text,
  plan_kind text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return;
  end if;

  return query
  select
    coalesce(nullif(trim(split_part(item->>'label', ' — ', 1)), ''), 'Produit') as product_brand,
    coalesce(
      nullif(trim(split_part(item->>'label', ' — ', 2)), ''),
      trim(item->>'label'),
      '—'
    ) as product_name,
    coalesce(p.hair_type, '—') as hair_type,
    coalesce(p.porosity, '—') as porosity,
    left(nullif(trim(urp.hair_state_comment), ''), 140) as outcome_snippet,
    urp.kind as plan_kind
  from public.user_routine_plans urp
  inner join public.profiles p on p.id = urp.user_id
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(urp.items) = 'array' then urp.items else '[]'::jsonb end
  ) as item
  where urp.user_id <> uid
    and coalesce(item->>'kind', '') = 'product'
    and coalesce(item->>'label', '') <> ''
    and (
      match_hair_type is null
      or trim(match_hair_type) = ''
      or p.hair_type ilike '%' || left(trim(match_hair_type), 2) || '%'
    )
    and (
      match_porosity is null
      or trim(match_porosity) = ''
      or lower(p.porosity) = lower(trim(match_porosity))
    )
  order by urp.updated_at desc
  limit greatest(1, least(result_limit, 20));
end;
$$;

revoke all on function public.fetch_similar_routine_plan_products(text, text, int) from public;
grant execute on function public.fetch_similar_routine_plan_products(text, text, int) to authenticated;

comment on function public.fetch_similar_routine_plan_products is
  'Produits issus des routines personnalisées d’autres utilisatrices au profil proche (reco communauté).';
