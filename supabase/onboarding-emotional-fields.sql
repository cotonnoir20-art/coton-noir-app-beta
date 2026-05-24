-- Champs onboarding émotionnel / notes (idempotent)
alter table public.profiles add column if not exists hair_confidence text default '';
alter table public.profiles add column if not exists routine_consistency text default '';
alter table public.profiles add column if not exists hair_blockers text[] default '{}';
alter table public.profiles add column if not exists hair_notes text default '';
alter table public.profiles add column if not exists hair_type_unsure boolean not null default false;
alter table public.profiles add column if not exists results_pace text default 'balanced';
alter table public.profiles add column if not exists results_weeks int default 8;
