import { describe, expect, it } from "vitest";
import { categoryFromStateType, deriveEvents } from "../src/lib/linear/map";
import { csvToObjects, parseCsv } from "../src/lib/sync/csv";
import { mapCsvRow } from "../src/lib/sync/import-map";
import { addDays, weekStart } from "../src/lib/weeks";

describe("status mapping", () => {
  it("maps Linear state types", () => {
    expect(categoryFromStateType("unstarted")).toBe("todo");
    expect(categoryFromStateType("started")).toBe("in_progress");
    expect(categoryFromStateType("completed")).toBe("done");
    expect(categoryFromStateType("canceled")).toBe("canceled");
    expect(categoryFromStateType("triage")).toBe("backlog");
    expect(categoryFromStateType(null)).toBe("backlog");
  });
});

describe("deriveEvents", () => {
  const st = (id: string, name: string, type: string) => ({ id, name, type });
  const issue = {
    createdAt: "2026-08-01T00:00:00Z",
    archivedAt: null,
    history: { nodes: [
      { id: "h1", createdAt: "2026-08-02T00:00:00Z", fromState: st("a", "Todo", "unstarted"), toState: st("b", "In Progress", "started"), fromAssignee: null, toAssignee: { id: "u1", name: "Ann" } },
      { id: "h2", createdAt: "2026-08-03T00:00:00Z", fromState: st("b", "In Progress", "started"), toState: st("c", "Done", "completed"), fromAssignee: null, toAssignee: null },
      { id: "h3", createdAt: "2026-08-04T00:00:00Z", fromState: st("c", "Done", "completed"), toState: st("a", "Todo", "unstarted"), fromAssignee: null, toAssignee: null },
      { id: "h4", createdAt: "2026-08-05T00:00:00Z", fromState: null, toState: null, fromAssignee: null, toAssignee: null },
    ] },
  };
  it("derives status, assignee, completed and reopened events with unique keys", () => {
    const ev = deriveEvents(issue);
    expect(ev.map((e) => e.event_type)).toEqual(["created", "status_changed", "assignee_changed", "status_changed", "completed", "status_changed", "reopened"]);
    const keys = ev.map((e) => e.source_event_key);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it("is deterministic (idempotent keys)", () => {
    expect(deriveEvents(issue)).toEqual(deriveEvents(issue));
  });
});

describe("csv", () => {
  it("handles quotes, commas and newlines", () => {
    expect(parseCsv('a,b\n"x, y","he said ""hi"""\n')).toEqual([["a", "b"], ["x, y", 'he said "hi"']]);
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([["a", "b"], ["1", "2"]]);
  });
  it("maps the closed-issues export row", () => {
    const [row] = csvToObjects(
      "id,title,parent_id,parent_title,project,team,assignee,labels,priority,status,closed_type,closed_at,created_at,due_date,url\n" +
      "MKT-8,LinkedIn — Mon Post (24 Aug),MKT-7,Social,ausverse-enviro,MARKETING,Afra Rahim,linkedin; social,Medium,Done,completed,2026-08-25T15:52:55.770Z,2026-08-25T15:47:59.431Z,2026-08-24,https://linear.app/x\n",
    );
    const t = mapCsvRow(row)!;
    expect(t).toMatchObject({ identifier: "MKT-8", status_category: "done", priority: 3, labels: ["linkedin", "social"], due_date: "2026-08-24", parentIdentifier: "MKT-7", parentTitle: "Social" });
    expect(t.closed_at).toBe("2026-08-25T15:52:55.770Z");
  });
});

describe("parent tree", () => {
  it("nests children under parents and keeps orphans as roots", async () => {
    const { nestTasks, missingParentIds } = await import("../src/lib/tasks/tree");
    const nested = nestTasks([
      { id: "p", parent_task_id: null, identifier: "DEV-30" },
      { id: "c", parent_task_id: "p", identifier: "DEV-31" },
      { id: "g", parent_task_id: "c", identifier: "DEV-36" },
      { id: "o", parent_task_id: "missing", identifier: "MKT-1" },
    ]);
    expect(nested.map((n) => n.identifier)).toEqual(["DEV-30", "MKT-1"]);
    expect(nested[0].children[0].children[0].identifier).toBe("DEV-36");
    expect(missingParentIds([
      { identifier: "MKT-8", parentIdentifier: "MKT-7", parentTitle: "Social" },
      { identifier: "MKT-7", parentIdentifier: null, parentTitle: null },
    ])).toEqual([]);
    expect(missingParentIds([
      { identifier: "MKT-8", parentIdentifier: "MKT-7", parentTitle: "Social" },
    ])).toEqual([{ identifier: "MKT-7", title: "Social" }]);
  });
});

describe("weeks (Mon-Sun, Melbourne)", () => {
  it("assigns a Sunday-night UTC instant to the Melbourne Monday", () => {
    // 2026-08-23 (Sun) 15:00 UTC = Mon 24 Aug 01:00 AEST
    expect(weekStart("2026-08-23T15:00:00Z")).toBe("2026-08-24");
    expect(weekStart("2026-08-30T12:00:00Z")).toBe("2026-08-24"); // Sun 30 Aug 22:00 AEST
    expect(weekStart("2026-08-30T14:30:00Z")).toBe("2026-08-31"); // Mon 31 Aug 00:30 AEST
  });
  it("adds days", () => expect(addDays("2026-08-24", 6)).toBe("2026-08-30"));
});
