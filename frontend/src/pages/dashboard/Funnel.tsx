import { money, moneyShort } from "../../lib/format";
import { STAGE_BY_ID } from "../../lib/rules";
import type { Dashboard } from "../../lib/types";

/** Value of all deals that reached each stage, New to Won (R37, concern 15). */
export function Funnel({ stages }: { stages: Dashboard["funnel"] }) {
  const top = Math.max(1, ...stages.map((s) => s.value_cents));
  return (
    <section className="panel chart-panel" aria-labelledby="funnel-title">
      <h2 id="funnel-title" className="panel-title">Sales funnel</h2>
      <p className="panel-hint">All deals: value that has reached each stage</p>
      <ol className="funnel" aria-label="Sales funnel">
        {stages.map((s) => {
          const info = STAGE_BY_ID[s.stage];
          return (
            <li key={s.stage} title={`${info.label}: ${money(s.value_cents)} from ${s.count} deals`}>
              <span className="funnel-bar" style={{ width: `${Math.max(38, (s.value_cents / top) * 100)}%`, background: info.color, color: info.onColor }}>
                <span className="funnel-label">{info.label}</span>
                <b className="mono" data-testid={`funnel-${s.stage}`}>{moneyShort(s.value_cents)}</b>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
