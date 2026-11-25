import { applyMove, columnOf } from "./move";
import { columnTotals, openTotals } from "./rules";
import type { Deal, Stage } from "./types";

const today = new Date(2026, 10, 24, 12, 0);
let nextId = 1;

function deal(name: string, stage: Stage, position: number, extra: Partial<Deal> = {}): Deal {
  return {
    id: nextId++, name, stage, position, value_cents: 1_000_000, probability: 10,
    close_date: null, organization_id: null, organization_name: null, contact_id: null,
    contact_name: null, is_late: false, created_at: "2026-11-01T09:00:00", ...extra,
  };
}

function board(): Deal[] {
  nextId = 1;
  return [
    deal("A", "new", 0), deal("B", "new", 1), deal("C", "new", 2),
    deal("D", "qualified", 0, { probability: 25 }), deal("E", "qualified", 1, { probability: 25 }),
  ];
}

const names = (deals: Deal[], stage: Stage) => columnOf(deals, stage).map((d) => d.name);
const positions = (deals: Deal[], stage: Stage) => columnOf(deals, stage).map((d) => d.position);
const id = (deals: Deal[], name: string) => deals.find((d) => d.name === name)!.id;

// The same cases as backend/tests/test_move.py, with the same answers.
test("move within a column, down and up", () => {
  let deals = board();
  deals = applyMove(deals, id(deals, "A"), "new", 2, today);
  expect(names(deals, "new")).toEqual(["B", "C", "A"]);
  deals = applyMove(deals, id(deals, "C"), "new", 0, today);
  expect(names(deals, "new")).toEqual(["C", "B", "A"]);
});

test("move to a middle spot", () => {
  const deals = applyMove(board(), 1, "new", 1, today);
  expect(names(deals, "new")).toEqual(["B", "A", "C"]);
});

test("move between columns", () => {
  const start = board();
  const deals = applyMove(start, id(start, "B"), "qualified", 1, today);
  expect(names(deals, "new")).toEqual(["A", "C"]);
  expect(names(deals, "qualified")).toEqual(["D", "B", "E"]);
  expect(positions(deals, "new")).toEqual([0, 1]);
  expect(positions(deals, "qualified")).toEqual([0, 1, 2]);
});

test("move to the top and bottom of another column", () => {
  let deals = board();
  deals = applyMove(deals, id(deals, "A"), "qualified", 0, today);
  expect(names(deals, "qualified")).toEqual(["A", "D", "E"]);
  deals = applyMove(deals, id(deals, "C"), "qualified", 99, today);
  expect(names(deals, "qualified")).toEqual(["A", "D", "E", "C"]);
});

test("moving to the same place changes nothing", () => {
  const start = board();
  const deals = applyMove(start, id(start, "B"), "new", 1, today);
  expect(deals).toEqual(start);
});

test("a stage change takes the usual probability; Won and Lost set today's date", () => {
  const start = board();
  let deals = applyMove(start, id(start, "A"), "negotiation", 0, today);
  expect(deals.find((d) => d.name === "A")).toMatchObject({ stage: "negotiation", probability: 75 });
  deals = applyMove(deals, id(deals, "A"), "won", 0, today);
  expect(deals.find((d) => d.name === "A")).toMatchObject({ stage: "won", probability: 100, close_date: "2026-11-24" });
  deals = applyMove(deals, id(deals, "A"), "proposal", 0, today);
  expect(deals.find((d) => d.name === "A")).toMatchObject({ probability: 50, close_date: "2026-11-24" });
});

test("totals change with the move", () => {
  const start = board();
  expect(columnTotals(columnOf(start, "new")).valueCents).toBe(3_000_000);
  const deals = applyMove(start, id(start, "A"), "won", 0, today);
  expect(columnTotals(columnOf(deals, "new"))).toEqual({ count: 2, valueCents: 2_000_000, expectedCents: 200_000 });
  expect(columnTotals(columnOf(deals, "won"))).toEqual({ count: 1, valueCents: 1_000_000, expectedCents: 1_000_000 });
  expect(openTotals(deals).count).toBe(4);
  expect(openTotals(start).count).toBe(5);
});

test("a late deal moved to Won is no longer late", () => {
  nextId = 1;
  const start = [deal("Late", "proposal", 0, { close_date: "2026-11-01", is_late: true })];
  const deals = applyMove(start, 1, "won", 0, today);
  expect(deals[0].is_late).toBe(false);
});
