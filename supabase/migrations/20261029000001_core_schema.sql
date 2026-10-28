-- Pace core schema (Phase 1): workspaces, members, people, teams, projects,
-- tasks, task_events, sync_runs, archive batches.
-- Future tables (clients, time_entries, proposals, invoices, invoice_line_items)
-- are planned in docs/schema-plan.md and intentionally NOT created yet.

create extension if not exists pgcrypto;

-- Shared updated_at trigger ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- workspaces ------------------------------------------------------------------
create table public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  timezone   text not null default 'Australia/Melbourne',
  -- archive config lives here; archiving is OFF by default (dry run only)
  settings   jsonb not null default jsonb_build_object(
    'archive', jsonb_build_object(
      'enabled', false,
      'after_days', 14,
      'max_batch', 5
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger workspaces_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();

-- members: Pace login users (auth.users) in a workspace -------------------------
create table public.members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('admin', 'member')),
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index members_user_id_idx on public.members(user_id);
create trigger members_updated_at before update on public.members
  for each row execute function public.set_updated_at();

-- RLS helper functions (security definer so policies on members do not recurse)
create or replace function public.is_member(ws uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.workspace_id = ws and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_admin(ws uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.workspace_id = ws and m.user_id = (select auth.uid()) and m.role = 'admin'
  );
$$;

-- people: assignees imported from a source (Linear users) ------------------------
create table public.people (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  member_id    uuid references public.members(id) on delete set null,
  display_name text not null,
  email        text,
  active       boolean not null default true,
  source       text not null default 'linear',
  external_id  text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, source, external_id)
);
create trigger people_updated_at before update on public.people
  for each row execute function public.set_updated_at();

-- teams -------------------------------------------------------------------------
create table public.teams (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  key          text,
  source       text not null default 'linear',
  external_id  text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, source, external_id)
);
create trigger teams_updated_at before update on public.teams
  for each row execute function public.set_updated_at();

-- projects ----------------------------------------------------------------------
create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  team_id      uuid references public.teams(id) on delete set null,
  -- client_id is added in the future clients migration
  name         text not null,
  status       text,
  status_category text check (status_category in ('backlog','planned','started','paused','completed','canceled')),
  target_date  date,
  source       text not null default 'linear',
  external_id  text not null,
  external_url text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, source, external_id)
);
create index projects_workspace_idx on public.projects(workspace_id);
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- tasks -------------------------------------------------------------------------
create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  team_id         uuid references public.teams(id) on delete set null,
  project_id      uuid references public.projects(id) on delete set null,
  assignee_id     uuid references public.people(id) on delete set null,
  parent_task_id  uuid references public.tasks(id) on delete set null,
  identifier      text,                       -- human id, e.g. MKT-8
  title           text not null,
  description     text,
  status_name     text,
  status_category text not null default 'backlog'
    check (status_category in ('backlog','todo','in_progress','done','canceled')),
  priority        smallint,                   -- 0 none, 1 urgent .. 4 low (Linear scale)
  labels          text[] not null default '{}',
  due_date        date,
  completed_at    timestamptz,
  canceled_at     timestamptz,
  source_created_at timestamptz,
  -- source reference (Linear is just one source)
  source          text not null default 'linear',
  external_id     text not null,
  external_url    text,
  external_updated_at timestamptz,
  -- lifecycle in the source system. Pace never hard-deletes tasks.
  archived_in_source_at timestamptz,
  deleted_in_source_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (workspace_id, source, external_id)
);
create index tasks_workspace_status_idx on public.tasks(workspace_id, status_category);
create index tasks_project_idx   on public.tasks(project_id);
create index tasks_assignee_idx  on public.tasks(assignee_id);
create index tasks_completed_idx on public.tasks(workspace_id, completed_at);
create index tasks_identifier_idx on public.tasks(workspace_id, identifier);
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- task_events: status / assignee history ------------------------------------------
create table public.task_events (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  task_id          uuid not null references public.tasks(id) on delete cascade,
  event_type       text not null check (event_type in (
    'created','status_changed','assignee_changed','completed','reopened',
    'canceled','archived','imported')),
  from_value       text,
  to_value         text,
  occurred_at      timestamptz not null,
  origin           text not null default 'linear_history'
    check (origin in ('linear_history','linear_diff','webhook','import')),
  -- deterministic key => re-running a sync / import never duplicates history
  source_event_key text not null,
  created_at       timestamptz not null default now(),
  unique (task_id, source_event_key)
);
create index task_events_task_idx on public.task_events(task_id, occurred_at);
create index task_events_ws_time_idx on public.task_events(workspace_id, occurred_at);

-- sync_runs: log of every sync / import ---------------------------------------------
create table public.sync_runs (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  trigger      text not null check (trigger in ('cron','webhook','manual','import')),
  status       text not null default 'running' check (status in ('running','success','error')),
  cursor       timestamptz,                   -- max updatedAt seen; next run starts here
  counts       jsonb not null default '{}'::jsonb,
  error        text,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz
);
create index sync_runs_ws_idx on public.sync_runs(workspace_id, started_at desc);

-- archive batches: dry-run proposals awaiting approval ----------------------------------
create table public.archive_batches (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  status       text not null default 'pending'
    check (status in ('pending','approved','rejected','done','dry_run')),
  reason       text,
  created_at   timestamptz not null default now(),
  decided_by   uuid references auth.users(id),
  decided_at   timestamptz,
  executed_at  timestamptz
);
create table public.archive_candidates (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  batch_id     uuid not null references public.archive_batches(id) on delete cascade,
  task_id      uuid not null references public.tasks(id) on delete cascade,
  status       text not null default 'pending'
    check (status in ('pending','archived','skipped','failed')),
  error        text,
  unique (batch_id, task_id)
);
