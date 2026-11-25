import { toDate } from "./format";
import type { ContactStatus, Deal, Stage } from "./types";

export interface StageInfo {
  id: Stage;
  label: string;
  color: string;
  /** Text colour on light backgrounds where the fill is too light. */
  textColor: string;
  /** Text colour on a fill of the stage colour. */
  onColor: string;
  probability: number;
  open: boolean;
}

export const STAGES: StageInfo[] = [
  { id: "new", label: "New", color: "var(--green)", textColor: "var(--green-text)", onColor: "var(--ink)", probability: 10, open: true },
  { id: "qualified", label: "Qualified", color: "var(--marigold)", textColor: "var(--marigold-text)", onColor: "var(--ink)", probability: 25, open: true },
  { id: "proposal", label: "Proposal", color: "var(--coral)", textColor: "var(--ink)", onColor: "var(--ink)", probability: 50, open: true },
  { id: "negotiation", label: "Negotiation", color: "var(--cerulean)", textColor: "var(--cerulean-text)", onColor: "#fff", probability: 75, open: true },
  { id: "won", label: "Won", color: "var(--ink)", textColor: "var(--ink)", onColor: "#fff", probability: 100, open: false },
  { id: "lost", label: "Lost", color: "var(--raspberry)", textColor: "var(--raspberry-text)", onColor: "#fff", probability: 0, open: false },
];

export const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<Stage, StageInfo>;
export const OPEN_STAGES = STAGES.filter((s) => s.open).map((s) => s.id);

export const STATUSES: { id: ContactStatus; label: string; plural: string }[] = [
  { id: "lead", label: "Lead", plural: "Leads" },
  { id: "qualified", label: "Qualified", plural: "Qualified" },
  { id: "customer", label: "Customer", plural: "Customers" },
];
export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label])) as Record<ContactStatus, string>;

export function usualProbability(stage: Stage): number {
  return STAGE_BY_ID[stage].probability;
}

export function isOpen(stage: Stage): boolean {
  return STAGE_BY_ID[stage].open;
}

export function startOfDay(day: Date): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate());
}

/** An open deal whose close date is before today. No date, never late. */
export function isLate(deal: Pick<Deal, "stage" | "close_date">, today: Date = new Date()): boolean {
  if (!isOpen(deal.stage) || !deal.close_date) return false;
  return toDate(deal.close_date) < startOfDay(today);
}

/** A follow-up not done whose date is before today. */
export function isOverdue(followUp: { follow_up_date: string | null; done?: boolean }, today: Date = new Date()): boolean {
  if (!followUp.follow_up_date || followUp.done) return false;
  return toDate(followUp.follow_up_date) < startOfDay(today);
}

export function expectedCents(deal: Pick<Deal, "value_cents" | "probability">): number {
  return (deal.value_cents * deal.probability) / 100;
}

export interface Totals {
  count: number;
  valueCents: number;
  expectedCents: number;
}

/** A column's own totals: every deal in it, open or not (R26). */
export function columnTotals(deals: Pick<Deal, "value_cents" | "probability">[]): Totals {
  return {
    count: deals.length,
    valueCents: deals.reduce((sum, d) => sum + d.value_cents, 0),
    expectedCents: Math.round(deals.reduce((sum, d) => sum + expectedCents(d), 0)),
  };
}

/** The board's totals: open deals only, Won and Lost left out (R27). */
export function openTotals(deals: Pick<Deal, "stage" | "value_cents" | "probability">[]): Totals {
  return columnTotals(deals.filter((d) => isOpen(d.stage)));
}
