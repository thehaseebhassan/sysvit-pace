# Pace

Project-management app for SYSVIT. Pace is the **system of record** for tasks;
Linear (Free plan, 250-issue cap) is only the board for the current week.

Stack: Next.js (App Router, TS) on Vercel Hobby, Supabase (Postgres + Auth), Linear GraphQL API.

## Setup (no local tooling needed)
1. Supabase dashboard > SQL Editor: run each file in `supabase/migrations/` in order, then `supabase/seed.sql`.
2. Authentication > Users > Add user (email + password, auto-confirm). Disable public sign-ups.
3. SQL Editor: make that user an admin:
   ```sql
   insert into public.members (workspace_id, user_id, role, display_name)
   select w.id, u.id, 'admin', 'Your Name'
   from public.workspaces w, auth.users u
   where w.slug = 'sysvit' and u.email = 'YOUR_EMAIL';
   ```
4. Vercel: import the repo and set the variables from `.env.example`
   (`NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase *publishable* key, `SUPABASE_SERVICE_ROLE_KEY` = Supabase *secret* key). Redeploy.

Optional local dev: copy `.env.example` to `.env.local`, `npm install`, `npm run dev`.

## Vercel
Cron (`vercel.json`) runs once daily - the most Vercel Hobby allows (timing is only accurate within the hour).

## Operations
- Weekly backup (Supabase Free has no daily backups): `scripts/backup-weekly.sh`
- Archive-cap test: `docs/linear-archive-check.md`
- Decisions log: `docs/decisions.md`; planned tables: `docs/schema-plan.md`

## Rules
Pace never deletes Linear issues. Archiving is off by default and dry-run only.
