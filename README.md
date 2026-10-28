# Pace

Project-management app for SYSVIT. Pace is the **system of record** for tasks;
Linear (Free plan, 250-issue cap) is only the board for the current week.

Stack: Next.js (App Router, TS) on Vercel Hobby, Supabase (Postgres + Auth), Linear GraphQL API.

## Setup
1. `npm install`
2. `cp .env.example .env.local` and fill in values (never commit it).
3. Supabase: `npx supabase login`, `npx supabase link --project-ref <ref>`, then `npx supabase db push` to apply `supabase/migrations/`.
4. Run `supabase/seed.sql` once (SQL editor) to create the SYSVIT workspace.
5. Create the first admin: `PACE_ADMIN_PASSWORD='...' node --env-file=.env.local node_modules/.bin/tsx scripts/create-admin.ts you@sysvit.com 'Your Name'`
6. `npm run dev`

Generate DB types after migrations: `npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts`

## Vercel
Add every variable from `.env.example` in Project Settings > Environment Variables.
Cron (`vercel.json`) runs once daily - the most Vercel Hobby allows (timing is only accurate within the hour).

## Operations
- Weekly backup (Supabase Free has no daily backups): `scripts/backup-weekly.sh`
- Archive-cap test: `docs/linear-archive-check.md`
- Decisions log: `docs/decisions.md`; planned tables: `docs/schema-plan.md`

## Rules
Pace never deletes Linear issues. Archiving is off by default and dry-run only.
