/**
 * Does archiving an issue free up the Linear Free-plan 250-issue cap?  (UNCONFIRMED)
 *
 * Step 1 (read-only):   npx tsx scripts/linear-archive-check.ts
 *   Prints active vs. archived issue counts (includeArchived true/false).
 * Step 2 (one issue):   npx tsx scripts/linear-archive-check.ts --archive <ISSUE_ID_OR_KEY> --yes
 *   Archives exactly ONE issue you name. Then re-run step 1 and compare,
 *   and try creating an issue in the Linear UI if you are at the cap.
 * Undo:                 npx tsx scripts/linear-archive-check.ts --unarchive <ID> --yes
 *
 * This script never deletes anything.
 * Needs LINEAR_API_KEY in the environment (e.g. node --env-file=.env.local).
 */
const LINEAR_URL = "https://api.linear.app/graphql";
const key = process.env.LINEAR_API_KEY;
if (!key) throw new Error("LINEAR_API_KEY is not set");

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(LINEAR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: key! },
    body: JSON.stringify({ query, variables }),
  });
  console.log(`  [rate] remaining=${res.headers.get("x-ratelimit-requests-remaining")}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data as T;
}

async function countIssues(includeArchived: boolean): Promise<number> {
  let after: string | null = null;
  let n = 0;
  for (;;) {
    const d: { issues: { nodes: unknown[]; pageInfo: { hasNextPage: boolean; endCursor: string } } } =
      await gql(
        `query($after:String,$inc:Boolean){ issues(first:100, after:$after, includeArchived:$inc){ nodes{id} pageInfo{hasNextPage endCursor} } }`,
        { after, inc: includeArchived },
      );
    n += d.issues.nodes.length;
    if (!d.issues.pageInfo.hasNextPage) return n;
    after = d.issues.pageInfo.endCursor;
  }
}

const args = process.argv.slice(2);
const flag = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };

async function main() {
  const archiveId = flag("--archive");
  const unarchiveId = flag("--unarchive");
  const confirmed = args.includes("--yes");

  if (archiveId || unarchiveId) {
    if (!confirmed) throw new Error("Refusing to change Linear without --yes");
    const mutation = archiveId ? "issueArchive" : "issueUnarchive";
    const id = (archiveId ?? unarchiveId)!;
    const d = await gql<Record<string, { success: boolean }>>(
      `mutation($id:String!){ ${mutation}(id:$id){ success } }`, { id },
    );
    console.log(mutation, id, d[mutation]);
  }

  const active = await countIssues(false);
  const all = await countIssues(true);
  console.log({ activeIssues: active, includingArchived: all, archived: all - active });
  console.log("Compare these numbers before/after archiving one issue, and check Linear's UI/billing page.");
}
main().catch((e) => { console.error(e); process.exit(1); });
