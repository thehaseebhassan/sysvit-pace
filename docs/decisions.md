# Decisions

Format: date - decision - why / source.

- 2026-10-29 - Repo is `sysvit/sysvit-pace`; work happens on feature branches, never `main`.
- 2026-10-29 - Roles: `admin` and `member` only (no viewer). RLS enforces it. App is read-only for task data in Phase 1.
- 2026-10-29 - Password login (Supabase Auth), sign-up closed; admin created via script.
- 2026-10-29 - Vercel Hobby cron: max once/day, ±59 min precision (Vercel docs). One daily sync + Linear webhooks for near-real-time + "Sync now" fallback.
- 2026-10-29 - Linear webhooks: admin-only to create (Linear docs); Free-plan availability unconfirmed - verify when creating one.
- 2026-10-29 - Supabase Free: no daily backups; use `scripts/backup-weekly.sh` (Supabase backups docs).
- 2026-10-29 - Linear API has `issueArchive`, `issueUnarchive`, `issueDelete` (trash, 30-day recovery) in its public schema. Pace never calls delete.
- 2026-10-29 - Linear auto-archive is enabled by the user, so Pace's archive step is likely redundant; kept off. Whether archived issues count toward the 250 cap is UNCONFIRMED (see docs/linear-archive-check.md).
- 2026-10-29 - Weeks are Mon-Sun in workspace timezone `Australia/Melbourne` (workspaces.timezone).
- 2026-10-29 - Historical data arrives via CSV/Excel import into `tasks` + `task_events` (origin `import`); idempotent on `(source, external_id)`.
- 2026-10-29 - Archive step: only tasks Done > 14 days; batches larger than `max_batch` need explicit approval.
- 2026-10-29 - Node installed via Homebrew (v26) on the dev machine; Next 16 docs in node_modules/next/dist/docs must be read before using framework APIs.
- 2026-10-29 - Auth: Supabase password login; `src/proxy.ts` (Next 16 rename of middleware) redirects signed-out users, the (app) layout re-checks with getUser() and requires a `members` row. Public paths: /login, /api/cron, /api/webhooks (own secrets).
- 2026-10-29 - Disabled `cacheComponents`/`partialPrefetching` from the scaffold: app is auth-gated and dynamic, so they only add friction.
- 2026-10-29 - Supabase now names keys "publishable" (was anon) and "secret" (was service_role); env var names kept.
