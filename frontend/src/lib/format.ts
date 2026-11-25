import { differenceInCalendarDays, format, parseISO } from "date-fns";

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const withCents = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** US$12,500 (and US$12,500.50 when there are cents), for tables and forms. */
export function money(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = abs / 100;
  return `${sign}US$${abs % 100 === 0 ? whole.format(dollars) : withCents.format(dollars)}`;
}

function trim(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

/** US$12.5K and US$1.2M, for charts, cards and summary figures. */
export function moneyShort(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const dollars = Math.abs(cents) / 100;
  if (dollars >= 999_950) return `${sign}US$${trim(dollars / 1_000_000)}M`;
  if (dollars >= 1_000) return `${sign}US$${trim(dollars / 1_000)}K`;
  return `${sign}US$${whole.format(Math.round(dollars))}`;
}

export function percent(value: number): string {
  return `${Math.round(value)}%`;
}

/** Dollars typed in a form ("12,500.50") to cents, or null if not a number. */
export function parseDollars(text: string): number | null {
  const cleaned = text.replace(/[,\s]/g, "").replace(/^US\$|^\$/i, "");
  if (cleaned === "" || !/^\d*\.?\d*$/.test(cleaned) || cleaned === ".") return null;
  return Math.round(Number(cleaned) * 100);
}

export function centsToDollarsText(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

export function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/** 24 Nov 2026 */
export function longDate(value: string | Date): string {
  return format(toDate(value), "d MMM yyyy");
}

/** 24 Nov, or 24 Nov 2027 when it isn't this year. */
export function shortDate(value: string | Date, today: Date = new Date()): string {
  const day = toDate(value);
  return format(day, day.getFullYear() === today.getFullYear() ? "d MMM" : "d MMM yyyy");
}

/** 24 Nov 2026, 09:40 */
export function dateTime(value: string | Date): string {
  return format(toDate(value), "d MMM yyyy, HH:mm");
}

/** Today, 09:40 / Yesterday / 12 Nov */
export function relativeTime(value: string | Date, now: Date = new Date()): string {
  const at = toDate(value);
  const days = differenceInCalendarDays(now, at);
  if (days === 0) return `Today, ${format(at, "HH:mm")}`;
  if (days === 1) return "Yesterday";
  return shortDate(at, now);
}

/** Tuesday 24 November 2026 */
export function fullDate(value: string | Date): string {
  return format(toDate(value), "EEEE d MMMM yyyy");
}

/** "YYYY-MM-DD" for a local date. */
export function isoDate(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

/** "YYYY-MM-DDTHH:mm" for a local date-time, as a datetime-local input wants. */
export function isoDateTime(value: Date): string {
  return format(value, "yyyy-MM-dd'T'HH:mm");
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "—";
  const words = name.replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/i, "").split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}
