-- Overdue / open counts must match what Linear shows.
--  * Issues trashed in Linear (deleted_in_source_at) never count anywhere.
--  * Issues archived in Linear (archived_in_source_at) still count as history (done / weekly),
--    but are not "open work": they are hidden in Linear, so they must not appear overdue here.
-- Column lists are unchanged, so create or replace is safe.

create or replace view public.v_project_progress
with (security_invoker = true) as
select
  p.id as project_id,
  p.workspace_id,
  p.name as project_name,
  p.target_date,
  count(t.id)                                              as total_tasks,
  count(t.id) filter (where t.status_category = 'done')        as done_tasks,
  count(t.id) filter (where t.status_category = 'canceled')    as canceled_tasks,
  count(t.id) filter (where t.status_category in ('backlog','todo','in_progress')
        and t.archived_in_source_at is null)                as open_tasks,
  count(t.id) filter (where t.status_category in ('backlog','todo','in_progress')
        and t.archived_in_source_at is null
        and t.due_date < (now() at time zone w.timezone)::date) as overdue_tasks,
  count(t.id) filter (where t.status_category in ('backlog','todo','in_progress')
        and t.archived_in_source_at is null
        and t.assignee_id is null)                         as unassigned_tasks,
  case when count(t.id) filter (where t.status_category <> 'canceled') = 0 then 0
       else round(100.0 * count(t.id) filter (where t.status_category = 'done')
            / count(t.id) filter (where t.status_category <> 'canceled'), 1)
  end as percent_done
from public.projects p
join public.workspaces w on w.id = p.workspace_id
left join public.tasks t on t.project_id = p.id and t.deleted_in_source_at is null
group by p.id, w.timezone;

create or replace view public.v_assignee_workload
with (security_invoker = true) as
select
  t.workspace_id,
  t.assignee_id,                               -- null row = Unassigned
  coalesce(pe.display_name, 'Unassigned')      as assignee_name,
  count(*) filter (where t.status_category in ('backlog','todo','in_progress')
        and t.archived_in_source_at is null)                                   as open_tasks,
  count(*) filter (where t.status_category = 'done')                           as done_tasks,
  count(*) filter (where t.status_category in ('backlog','todo','in_progress')
        and t.archived_in_source_at is null
        and t.due_date < (now() at time zone w.timezone)::date)                as overdue_tasks
from public.tasks t
join public.workspaces w on w.id = t.workspace_id
left join public.people pe on pe.id = t.assignee_id
where t.deleted_in_source_at is null
group by t.workspace_id, t.assignee_id, pe.display_name;

create or replace view public.v_flagged_tasks
with (security_invoker = true) as
select
  t.id as task_id, t.workspace_id, t.identifier, t.title, t.project_id, t.assignee_id,
  t.status_name, t.due_date, t.external_url,
  (t.due_date < (now() at time zone w.timezone)::date) as is_overdue,
  (t.assignee_id is null)                              as is_unassigned
from public.tasks t
join public.workspaces w on w.id = t.workspace_id
where t.status_category in ('backlog','todo','in_progress')
  and t.deleted_in_source_at is null
  and t.archived_in_source_at is null
  and ( t.assignee_id is null
     or t.due_date < (now() at time zone w.timezone)::date );

create or replace view public.v_weekly_done
with (security_invoker = true) as
select
  t.workspace_id,
  (date_trunc('week', t.completed_at at time zone w.timezone))::date as week_start,
  t.project_id,
  t.assignee_id,
  count(*) as done_count
from public.tasks t
join public.workspaces w on w.id = t.workspace_id
where t.status_category = 'done' and t.completed_at is not null
  and t.deleted_in_source_at is null
group by t.workspace_id, week_start, t.project_id, t.assignee_id;
