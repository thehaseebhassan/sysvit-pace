# Does archiving free up the 250-issue cap? (UNCONFIRMED)

Linear's billing docs only say that over 250 issues you cannot create new ones.
They do not say whether archived issues count. Test with ONE issue:

1. Put `LINEAR_API_KEY` in `.env.local`, then run (read-only):
   `node --env-file=.env.local node_modules/.bin/tsx scripts/linear-archive-check.ts`
2. Pick one Done issue that is already stored in Pace (or one you don't mind archiving).
3. Archive it: `... linear-archive-check.ts --archive <KEY> --yes`
4. Re-run step 1 and check whether Linear's cap/usage changed (try creating an issue if at the cap).
5. Undo if you wish: `... --unarchive <KEY> --yes`

API facts (confirmed in Linear's public GraphQL schema): `issueArchive`,
`issueUnarchive` and `issueDelete` ("trashes" the issue; recoverable 30 days) exist.
Pace never calls `issueDelete`. Whether they behave identically on the Free plan is
**not confirmed** - hence the one-issue test.

Note: with Linear auto-archive enabled, Pace may not need to archive at all; the
archive step stays off unless the test shows a benefit.
