-- Local/dev seed: one workspace. The first admin is attached by
-- scripts/create-admin.ts (needs the service-role key), not hard-coded here.
insert into public.workspaces (name, slug)
values ('SYSVIT', 'sysvit')
on conflict (slug) do nothing;
