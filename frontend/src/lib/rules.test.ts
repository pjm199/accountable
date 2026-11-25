import { columnTotals, isLate, isOverdue, openTotals, usualProbability } from "./rules";
import type { Stage } from "./types";

const today = new Date(2026, 10, 24, 15, 30);

test("usual probabilities", () => {
  const stages: Stage[] = ["new", "qualified", "proposal", "negotiation", "won", "lost"];
  expect(stages.map(usualProbability)).toEqual([10, 25, 50, 75, 100, 0]);
});

test("late only when open and the close date is before today", () => {
  expect(isLate({ stage: "proposal", close_date: "2026-11-23" }, today)).toBe(true);
  expect(isLate({ stage: "proposal", close_date: "2026-11-24" }, today)).toBe(false);
  expect(isLate({ stage: "won", close_date: "2026-11-01" }, today)).toBe(false);
  expect(isLate({ stage: "lost", close_date: "2026-11-01" }, today)).toBe(false);
  expect(isLate({ stage: "new", close_date: null }, today)).toBe(false);
});

test("overdue when not done and the follow-up date is before today", () => {
  expect(isOverdue({ follow_up_date: "2026-11-23" }, today)).toBe(true);
  expect(isOverdue({ follow_up_date: "2026-11-24" }, today)).toBe(false);
  expect(isOverdue({ follow_up_date: "2026-11-23", done: true }, today)).toBe(false);
  expect(isOverdue({ follow_up_date: null }, today)).toBe(false);
});

const deals = [
  { stage: "new" as Stage, value_cents: 1_000_000, probability: 10 },
  { stage: "negotiation" as Stage, value_cents: 2_000_000, probability: 75 },
  { stage: "won" as Stage, value_cents: 5_000_000, probability: 100 },
  { stage: "lost" as Stage, value_cents: 3_000_000, probability: 0 },
];

test("column totals count every deal in the column with expected revenue", () => {
  expect(columnTotals(deals.slice(0, 2))).toEqual({ count: 2, valueCents: 3_000_000, expectedCents: 1_600_000 });
  expect(columnTotals([deals[2]])).toEqual({ count: 1, valueCents: 5_000_000, expectedCents: 5_000_000 });
  expect(columnTotals([])).toEqual({ count: 0, valueCents: 0, expectedCents: 0 });
});

test("open totals leave out Won and Lost", () => {
  expect(openTotals(deals)).toEqual({ count: 2, valueCents: 3_000_000, expectedCents: 1_600_000 });
});
