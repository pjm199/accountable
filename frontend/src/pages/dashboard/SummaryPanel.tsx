import { money, moneyShort } from "../../lib/format";
import type { Dashboard } from "../../lib/types";
import { FollowUps } from "./FollowUps";

/** The Sea Green panel: expected revenue, key figures and follow-ups (R33). */
export function SummaryPanel({ data }: { data: Dashboard }) {
  const figures = [
    ["Open pipeline", moneyShort(data.open_value_cents), "open-value"],
    ["Won, 12 months",moneyShort(data.won_12_months_cents), "won-12-months"],
    ["Open deals", String(data.open_count), "open-count"],
    ["Running late", String(data.late_count), "late-count"],
  ];
  return (
    <section className="panel hero" aria-label="Summary">
      <div>
        <p className="hero-label">Expected revenue from open deals</p>
        <p className="hero-big mono" data-testid="expected-revenue">{money(data.expected_revenue_cents)}</p>
      </div>
      <dl className="hero-mini">
        {figures.map(([label, value, id]) => (
          <div key={id}>
            <dt>{label}</dt>
            <dd className="mono" data-testid={id}>{value}</dd>
          </div>
        ))}
      </dl>
      <FollowUps items={data.follow_ups} />
    </section>
  );
}
