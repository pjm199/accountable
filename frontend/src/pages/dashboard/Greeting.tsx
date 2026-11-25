import { fullDate } from "../../lib/format";
import type { Dashboard } from "../../lib/types";

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

/** "Four" for 4, the digits from 13 on. */
export function countWord(n: number): string {
  return WORDS[n] ?? String(n);
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

/** The greeting and how many deals need attention this week; under it, the
 * date and how many follow-ups are overdue or due today (R32). */
export function Greeting({ data }: { data: Dashboard }) {
  const deals = data.attention_count;
  const due = data.follow_ups_due_count;
  return (
    <header className="greeting">
      <h1 className="hello">
        {greeting()}{" "}
        {deals === 0 ? (
          "No deals need you this week."
        ) : (
          <>
            <em>
              {countWord(deals)} {deals === 1 ? "deal" : "deals"}
            </em>{" "}
            {deals === 1 ? "needs" : "need"} you this week.
          </>
        )}
      </h1>
      <p className="hello-sub">
        {fullDate(data.today)} ·{" "}
        {due === 0
          ? "no follow-ups are overdue or due today"
          : `${countWord(due).toLowerCase()} ${due === 1 ? "follow-up is" : "follow-ups are"} overdue or due today`}
      </p>
    </header>
  );
}
