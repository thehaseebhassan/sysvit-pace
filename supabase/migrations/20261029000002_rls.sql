-- Row Level Security. Every table is workspace-scoped.
-- Members can READ their workspace's data. Pace is read-only in Phase 1:
-- data is written only by the sync using the service-role key (bypasses RLS).
-- Admins can manage workspace settings, members and archive approvals.

alter table public.workspaces         enable row level security;
alter table public.members            enable row level security;
alter table public.people             enable row level security;
alter table public.teams              enable row level security;
alter table public.projects           enable row level security;
alter table public.tasks              enable row level security;
alter table public.task_events        enable row level security;
alter table public.sync_runs          enable row level security;
alter table public.archive_batches    enable row level security;
alter table public.archive_candidates enable row level security;

-- workspaces
create policy workspaces_select on public.workspaces
  for select to authenticated using (public.is_member(id));
create policy workspaces_update on public.workspaces
  for update to authenticated using (public.is_admin(id)) with check (public.is_admin(id));

-- members
create policy members_select on public.members
  for select to authenticated using (public.is_member(workspace_id));
create policy members_insert on public.members
  for insert to authenticated with check (public.is_admin(workspace_id));
create policy members_update on public.members
  for update to authenticated using (public.is_admin(workspace_id)) with check (public.is_admin(workspace_id));
create policy members_delete on public.members
  for delete to authenticated using (public.is_admin(workspace_id));

-- read-only data tables
create policy people_select   on public.people   for select to authenticated using (public.is_member(workspace_id));
create policy teams_select    on public.teams    for select to authenticated using (public.is_member(workspace_id));
create policy projects_select on public.projects for select to authenticated using (public.is_member(workspace_id));
create policy tasks_select    on public.tasks    for select to authenticated using (public.is_member(workspace_id));
create policy task_events_select on public.task_events for select to authenticated using (public.is_member(workspace_id));
create policy sync_runs_select   on public.sync_runs   for select to authenticated using (public.is_member(workspace_id));

-- archive approvals: members can see, only admins can decide
create policy archive_batches_select on public.archive_batches
  for select to authenticated using (public.is_member(workspace_id));
create policy archive_batches_update on public.archive_batches
  for update to authenticated using (public.is_admin(workspace_id)) with check (public.is_admin(workspace_id));
create policy archive_candidates_select on public.archive_candidates
  for select to authenticated using (public.is_member(workspace_id));
