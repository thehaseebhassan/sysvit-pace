export type TreeTask = {
  id: string;
  parent_task_id: string | null;
};

export type Nested<T extends TreeTask> = T & { children: Nested<T>[]; depth: number };

/** Nest sub-issues under their parent. Children whose parent isn't in `tasks` stay as roots (with depth 0). */
export function nestTasks<T extends TreeTask>(tasks: T[]): Nested<T>[] {
  const byId = new Map(tasks.map((t) => [t.id, { ...t, children: [] as Nested<T>[], depth: 0 }]));
  const roots: Nested<T>[] = [];
  for (const node of byId.values()) {
    const parent = node.parent_task_id ? byId.get(node.parent_task_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const key = (n: Nested<T>) => String((n as { identifier?: string; title?: string }).identifier ?? (n as { title?: string }).title ?? "");
  const byKey = (a: Nested<T>, b: Nested<T>) => key(a).localeCompare(key(b), undefined, { numeric: true });
  const walk = (nodes: Nested<T>[], depth: number) => {
    for (const n of nodes) {
      n.depth = depth;
      n.children.sort(byKey);
      walk(n.children, depth + 1);
    }
  };
  roots.sort(byKey);
  walk(roots, 0);
  return roots;
}

export function flattenTree<T extends TreeTask>(roots: Nested<T>[]): Nested<T>[] {
  const out: Nested<T>[] = [];
  const walk = (nodes: Nested<T>[]) => {
    for (const n of nodes) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(roots);
  return out;
}

/** Parent identifiers referenced by children but missing as their own CSV row. */
export function missingParentIds(
  rows: { identifier: string; parentIdentifier: string | null; parentTitle: string | null }[],
): { identifier: string; title: string }[] {
  const have = new Set(rows.map((r) => r.identifier));
  const missing = new Map<string, string>();
  for (const r of rows) {
    if (!r.parentIdentifier || have.has(r.parentIdentifier) || missing.has(r.parentIdentifier)) continue;
    missing.set(r.parentIdentifier, r.parentTitle || r.parentIdentifier);
  }
  return [...missing.entries()].map(([identifier, title]) => ({ identifier, title }));
}
