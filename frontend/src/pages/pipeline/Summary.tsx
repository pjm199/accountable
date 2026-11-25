import { money, moneyShort } from "../../lib/format";
import { OPEN_STAGES, STAGE_BY_ID, openTotals } from "../../lib/rules";
import type { Deal } from "../../lib/types";

/** Open deals, open value, expected revenue and a stacked bar of open value
 * by stage. Won and Lost are left out (R27). */
export function Summary({ deals }: { deals: Deal[] }) {
  const totals = openTotals(deals);
  const byStage = OPEN_STAGES.map((stage) => ({
    stage: STAGE_BY_ID[stage],
    value: deals.filter((d) => d.stage === stage).reduce((s, d) => s + d.value_cents, 0),
  }));
  return (
    <div className="strip">
      <div className="panel strip-figure">
        <p className="strip-label">Open deals</p>
        <p className="strip-value mono" data-testid="open-count">{totals.count}</p>
      </div>
      <div className="panel strip-figure">
        <p className="strip-label">Open value</p>
        <p className="strip-value mono" data-testid="open-value">{money(totals.valueCents)}</p>
      </div>
      <div className="panel strip-figure">
        <p className="strip-label">Expected revenue</p>
        <p className="strip-value mono" data-testid="expected-revenue">{money(totals.expectedCents)}</p>
      </div>
      <div className="panel strip-figure">
        <p className="strip-label">Open value by stage</p>
        <div className="stack-bar" role="img" aria-label={byStage.map((s) => `${s.stage.label} ${moneyShort(s.value)}`).join(", ")}>
          {byStage.filter((s) => s.value > 0).map((s) => (
            <span key={s.stage.id} style={{ flexGrow: s.value, background: s.stage.color }} title={`${s.stage.label}: ${money(s.value)}`} />
          ))}
        </div>
        <div className="stack-legend" aria-hidden>
          {byStage.map((s) => (
            <span key={s.stage.id}>
              <i style={{ background: s.stage.color }} />
              {s.stage.label} <span className="mono">{moneyShort(s.value)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
