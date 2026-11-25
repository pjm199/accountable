import { Link } from "react-router-dom";
import { longDate } from "../lib/format";
import type { Deal } from "../lib/types";
import { LateBadge } from "./LateBadge";
import { Money } from "./Money";
import { StageBadge } from "./StageBadge";

/** A record's deals with stage, value and close date (R21, R22). */
export function LinkedDeals({ deals, show }: { deals: Deal[]; show: "organization" | "contact" }) {
  if (deals.length === 0) return <p className="linked-empty">No deals yet.</p>;
  return (
    <ul className="linked-list" aria-label="Deals">
      {deals.map((d) => {
        const other = show === "organization" ? d.organization_name : d.contact_name;
        return (
          <li key={d.id}>
            <div>
              <Link className="title" to={`/deals/${d.id}`}>{d.name}</Link>
              <div className="sub">
                <StageBadge stage={d.stage} />
                {other && <> · {other}</>}
              </div>
            </div>
            <div className="right">
              <Money cents={d.value_cents} />
              <span className="sub late-date">
                {d.close_date ? <span className="mono">{longDate(d.close_date)}</span> : "No close date"}
                {d.is_late && <LateBadge />}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
