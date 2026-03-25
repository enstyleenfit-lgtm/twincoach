-- TwinCoach: Multi-store + contract authorization (Supabase)
-- 目的:
-- - 1ユーザーが複数店舗に所属し、店舗切替できる
-- - 未契約店舗(inactive/suspended)は「データを返さない」(RLS + サーバー認可)
-- - API/画面のUI隠しだけに依存しない

-- 1) stores
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contract_status text not null check (contract_status in ('active','trial','inactive','suspended')),
  owner_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_stores_owner_id on public.stores(owner_id);

-- 2) user_store_memberships
create table if not exists public.user_store_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  store_id uuid not null references public.stores(id) on delete cascade,
  role text not null check (role in ('trainer','owner','hq','staff')),
  created_at timestamptz not null default now(),
  unique (user_id, store_id)
);

create index if not exists idx_user_store_memberships_user_id on public.user_store_memberships(user_id);
create index if not exists idx_user_store_memberships_store_id on public.user_store_memberships(store_id);

-- 3) audit_logs (最低限)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  store_id uuid not null references public.stores(id) on delete cascade,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_store_id on public.audit_logs(store_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);

-- 4) add store_id to existing tables (nullable for migration safety)
alter table public.members add column if not exists store_id uuid references public.stores(id);
create index if not exists idx_members_store_id on public.members(store_id);

alter table public.tasks add column if not exists store_id uuid references public.stores(id);
create index if not exists idx_tasks_store_id on public.tasks(store_id);

-- NOTE: visits/interventions は member_id 経由で店舗が特定できるが、RLSを簡潔にするため store_id を追加可
alter table public.visits add column if not exists store_id uuid references public.stores(id);
create index if not exists idx_visits_store_id on public.visits(store_id);

alter table public.interventions add column if not exists store_id uuid references public.stores(id);
create index if not exists idx_interventions_store_id on public.interventions(store_id);

-- 5) RLS
alter table public.stores enable row level security;
alter table public.user_store_memberships enable row level security;
alter table public.audit_logs enable row level security;
alter table public.members enable row level security;
alter table public.tasks enable row level security;
alter table public.visits enable row level security;
alter table public.interventions enable row level security;

-- stores: 所属店舗だけ見える（未契約でも「店舗名・ステータス」表示のため select は許可）
drop policy if exists stores_select_my_stores on public.stores;
create policy stores_select_my_stores
on public.stores for select
to authenticated
using (
  exists (
    select 1
    from public.user_store_memberships m
    where m.user_id = auth.uid() and m.store_id = stores.id
  )
);

-- memberships: 自分のものだけ
drop policy if exists memberships_select_self on public.user_store_memberships;
create policy memberships_select_self
on public.user_store_memberships for select
to authenticated
using (user_id = auth.uid());

-- audit_logs: insert only (server or client). select は基本不要なので閉じる
drop policy if exists audit_insert_authenticated on public.audit_logs;
create policy audit_insert_authenticated
on public.audit_logs for insert
to authenticated
with check (user_id = auth.uid());

-- helpers: contract must be active/trial
-- members: contract active/trial + membership required
drop policy if exists members_select_contracted on public.members;
create policy members_select_contracted
on public.members for select
to authenticated
using (
  store_id is not null
  and exists (
    select 1
    from public.user_store_memberships m
    join public.stores s on s.id = m.store_id
    where m.user_id = auth.uid()
      and m.store_id = members.store_id
      and s.contract_status in ('active','trial')
  )
);

-- tasks: contract active/trial + membership required
drop policy if exists tasks_select_contracted on public.tasks;
create policy tasks_select_contracted
on public.tasks for select
to authenticated
using (
  store_id is not null
  and exists (
    select 1
    from public.user_store_memberships m
    join public.stores s on s.id = m.store_id
    where m.user_id = auth.uid()
      and m.store_id = tasks.store_id
      and s.contract_status in ('active','trial')
  )
);

-- visits/interventions: store_id が入っている前提で同様に制御（未移行データは返らない）
drop policy if exists visits_select_contracted on public.visits;
create policy visits_select_contracted
on public.visits for select
to authenticated
using (
  store_id is not null
  and exists (
    select 1
    from public.user_store_memberships m
    join public.stores s on s.id = m.store_id
    where m.user_id = auth.uid()
      and m.store_id = visits.store_id
      and s.contract_status in ('active','trial')
  )
);

drop policy if exists interventions_select_contracted on public.interventions;
create policy interventions_select_contracted
on public.interventions for select
to authenticated
using (
  store_id is not null
  and exists (
    select 1
    from public.user_store_memberships m
    join public.stores s on s.id = m.store_id
    where m.user_id = auth.uid()
      and m.store_id = interventions.store_id
      and s.contract_status in ('active','trial')
  )
);

