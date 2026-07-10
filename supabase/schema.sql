-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.portfolios (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.portfolios enable row level security;

create policy "portfolios_select_own"
  on public.portfolios for select
  using (auth.uid() = user_id);

create policy "portfolios_insert_own"
  on public.portfolios for insert
  with check (auth.uid() = user_id);

create policy "portfolios_update_own"
  on public.portfolios for update
  using (auth.uid() = user_id);

create policy "portfolios_delete_own"
  on public.portfolios for delete
  using (auth.uid() = user_id);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists portfolios_updated_at on public.portfolios;
create trigger portfolios_updated_at
  before update on public.portfolios
  for each row execute function public.set_updated_at();

-- 사용자별 API 키 (온라인 에디션 · RLS)
create table if not exists public.user_api_secrets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  secrets jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_api_secrets enable row level security;

create policy "user_api_secrets_select_own"
  on public.user_api_secrets for select
  using (auth.uid() = user_id);

create policy "user_api_secrets_insert_own"
  on public.user_api_secrets for insert
  with check (auth.uid() = user_id);

create policy "user_api_secrets_update_own"
  on public.user_api_secrets for update
  using (auth.uid() = user_id);

create policy "user_api_secrets_delete_own"
  on public.user_api_secrets for delete
  using (auth.uid() = user_id);

drop trigger if exists user_api_secrets_updated_at on public.user_api_secrets;
create trigger user_api_secrets_updated_at
  before update on public.user_api_secrets
  for each row execute function public.set_updated_at();
