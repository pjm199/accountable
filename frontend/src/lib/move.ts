import { isoDate } from "./format";
import { usualProbability } from "./rules";
import type { Deal, Stage } from "./types";

function column(deals: Deal[], stage: Stage, leaveOut?: number): Deal[] {
  return deals
    .filter((d) => d.stage === stage && d.id !== leaveOut)
    .sort((a, b) => a.position - b.position || a.id - b.id);
}

/** Applies a card move to a list of deals the same way the server does
 * (backend/repo/deals.py move_deal), so the board updates at once (R29). */
export function applyMove(deals: Deal[], dealId: number, stage: Stage, index: number, today: Date = new Date()): Deal[] {
  const moving = deals.find((d) => d.id === dealId);
  if (!moving) return deals;
  const changed = moving.stage !== stage;

  let moved: Deal = moving;
  if (changed) {
    moved = { ...moving, stage, probability: usualProbability(stage), is_late: false };
    if (stage === "won" || stage === "lost") moved.close_date = isoDate(today);
    else moved.is_late = !!moved.close_date && moved.close_date < isoDate(today);
  }

  const target = column(deals, stage, dealId);
  target.splice(Math.min(index, target.length), 0, moved);
  const positions = new Map<number, number>();
  target.forEach((d, i) => positions.set(d.id, i));
  if (changed) column(deals, moving.stage, dealId).forEach((d, i) => positions.set(d.id, i));

  return deals.map((d) => {
    const base = d.id === dealId ? moved : d;
    const position = positions.get(d.id);
    return position === undefined || position === base.position ? base : { ...base, position };
  });
}

/** The deals of one column, top to bottom. */
export function columnOf(deals: Deal[], stage: Stage): Deal[] {
  return column(deals, stage);
}
