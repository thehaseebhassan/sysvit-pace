export type TreeTask = {
  id: string;
  parent_task_id: string | null;
};

export type Nested<T extends TreeTask> = T & { children: Nested<T>[]; depth: number };

/** Nest sub-issues. Breaks cycles (a crash source) and keeps orphans as roots. */
export function nestTasks<T extends TreeTask>(tasks: T[]): Nested<T>[] {
  const byId = new Map(tasks.map((t) => [t.id, { ...t, children: [] as Nested<T>[], depth: 0 }]));
  const roots: Nested<T>[] = [];
  for (const node of byId.values()) {
    const pid = node.parent_task_id;
    const parent = pid && pid !== node.id ? byId.get(pid) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const key = (n: Nested<T>) => String((n as { identifier?: string; title?: string }).identifier ?? (n as { title?: string }).title ?? "");
  const byKey = (a: Nested<T>, b: Nested<T>) => key(a).localeCompare(key(b), undefined, { numeric: true });

  const attached = new Set<string>();
  const walk = (nodes: Nested<T>[], depth: number, stack: Set<string>) => {
    for (const n of nodes) {
      if (stack.has(n.id)) continue;
      n.depth = depth;
      attached.add(n.id);
      n.children.sort(byKey);
      n.children = n.children.filter((c) => c.id !== n.id && !stack.has(c.id));
      const next = new Set(stack);
      next.add(n.id);
      walk(n.children, depth + 1, next);
    }
  };
  roots.sort(byKey);
  walk(roots, 0, new Set());
  for (const node of byId.values()) {
    if (!attached.has(node.id)) {
      node.depth = 0;
      node.children = [];
      roots.push(node);
    }
  }
  return roots;
}

export function flattenTree<T extends TreeTask>(roots: Nested<T>[]): Nested<T>[] {
  const out: Nested<T>[] = [];
  const walk = (nodes: Nested<T>[], stack: Set<string>) => {
    for (const n of nodes) {
      if (stack.has(n.id)) continue;
      out.push(n);
      const next = new Set(stack);
      next.add(n.id);
      walk(n.children, next);
    }
  };
  walk(roots, new Set());
  return out;
}

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
