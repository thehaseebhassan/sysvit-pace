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
- 2026-10-29 - Sync: incremental by Linear `updatedAt` (ordered, 10-minute overlap), backfill on first run, `includeArchived: true`. Pages of 10 issues x 50 history entries keep each query under Linear's 10,000-point complexity cap (estimated ~3,400; not yet measured against the live API).
- 2026-10-29 - Events come only from Linear issue history, keyed `<history id>:<kind>` (unique per task), so re-runs and webhooks never duplicate. Issues with >50 history entries lose the oldest ones (known limit).
- 2026-10-29 - CSV import creates rows with source `import`; when the same project/team/person/issue appears in Linear the sync "adopts" them (flips to source `linear`, sets the Linear id, drops import-origin events) so nothing is duplicated.
- 2026-10-29 - Webhooks (`/api/webhooks/linear`): HMAC-SHA256 on the raw body + 60s timestamp check (Linear docs); each Issue event re-fetches the issue and runs the same upsert as the cron.
- 2026-10-29 - Archive: off by default. Eligible = source linear, Done > N days, not archived/deleted. When enabled: <= max_batch archived directly, more => pending batch needing admin approval in the UI. Only `issueArchive` is ever called.
- 2026-10-29 - Hobby function duration default and max is 300s with fluid compute (Vercel docs); cron and sync-now routes set maxDuration 300.
- 2026-10-29 - UI: cream/terracotta palette (`#faf9f5` / `#d97757`, Anthropic-adjacent, matches SYSVIT), forced light. Issue list follows Linear: nested tree with L-lines, status circles, priority bars, identifier, sub-issue  n/m  counts, label chips.
- 2026-10-29 - CSV import creates stub parent tasks when `parent_id` is set but the parent isn't its own row; re-import links `parent_task_id` in bulk.
