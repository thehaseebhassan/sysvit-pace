import "server-only";
import { serverEnv } from "@/lib/env";

const ENDPOINT = "https://api.linear.app/graphql";

/**
 * Minimal Linear GraphQL client. Reads only unless a mutation is passed explicitly.
 * Retries once on HTTP 429 (honours Retry-After, max 10s).
 * Limits (Linear docs): 2,500 requests/hour and 3,000,000 complexity points/hour per API key;
 * max 10,000 complexity points for a single query.
 */
export async function linearGql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: serverEnv().LINEAR_API_KEY },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (res.status === 429 && attempt === 0) {
      const wait = Math.min(Number(res.headers.get("retry-after") ?? 5), 10);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    const json = (await res.json().catch(() => null)) as { data?: T; errors?: { message: string }[] } | null;
    if (!res.ok || !json || json.errors?.length) {
      throw new Error(`Linear API error (${res.status}): ${json?.errors?.map((e) => e.message).join("; ") ?? "no body"}`);
    }
    return json.data as T;
  }
  throw new Error("Linear API rate limited");
}

export type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  priority: number | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  canceledAt: string | null;
  archivedAt: string | null;
  trashed: boolean | null;
  url: string;
  state: { id: string; name: string; type: string } | null;
  assignee: { id: string; name: string; email: string | null } | null;
  team: { id: string } | null;
  project: { id: string } | null;
  parent: { id: string; identifier: string } | null;
  labels: { nodes: { name: string }[] };
  history: {
    nodes: {
      id: string;
      createdAt: string;
      fromState: { id: string; name: string; type: string } | null;
      toState: { id: string; name: string; type: string } | null;
      fromAssignee: { id: string; name: string } | null;
      toAssignee: { id: string; name: string } | null;
    }[];
  };
};

// Keep pages small: complexity = children x pagination size (limit 10,000 per query).
export const ISSUE_FIELDS = `
  id identifier title description priority dueDate createdAt updatedAt completedAt canceledAt archivedAt trashed url
  state { id name type }
  assignee { id name email }
  team { id }
  project { id }
  parent { id identifier }
  labels(first: 10) { nodes { name } }
  history(first: 50) { nodes {
    id createdAt
    fromState { id name type } toState { id name type }
    fromAssignee { id name } toAssignee { id name }
  } }
`;

export const ISSUE_PAGE_SIZE = 10;

export async function fetchIssuePage(opts: { after?: string | null; updatedAfter?: string | null }) {
  const data = await linearGql<{
    issues: { nodes: LinearIssue[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } };
  }>(
    `query($after:String,$filter:IssueFilter){
      issues(first:${ISSUE_PAGE_SIZE}, after:$after, includeArchived:true, orderBy:updatedAt, filter:$filter){
        nodes{ ${ISSUE_FIELDS} } pageInfo{ hasNextPage endCursor }
      } }`,
    { after: opts.after ?? null, filter: opts.updatedAfter ? { updatedAt: { gt: opts.updatedAfter } } : null },
  );
  return data.issues;
}

export async function fetchIssueById(id: string) {
  const data = await linearGql<{ issue: LinearIssue | null }>(
    `query($id:String!){ issue(id:$id){ ${ISSUE_FIELDS} } }`,
    { id },
  );
  return data.issue;
}

export async function archiveIssue(id: string) {
  const d = await linearGql<{ issueArchive: { success: boolean } }>(
    `mutation($id:String!){ issueArchive(id:$id){ success } }`,
    { id },
  );
  return d.issueArchive.success;
}
