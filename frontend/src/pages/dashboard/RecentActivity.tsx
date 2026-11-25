import { Link } from "react-router-dom";
import { relativeTime } from "../../lib/format";
import type { RecentEntry } from "../../lib/types";

const DOT = { call: "#118AB2", email: "#F78C6B", note: "#FFC145", stage: "#06D6A0" };
const KIND = { call: "Call", email: "Email", note: "Note", stage: "Stage change" };

/** The 10 newest activities and stage changes (R39). */
export function RecentActivity({ entries }: { entries: RecentEntry[] }) {
  return (
    <section className="panel recent" aria-labelledby="recent-title">
      <h2 id="recent-title" className="panel-title">Recent activity</h2>
      <p className="panel-hint">Calls, emails, notes and stage changes</p>
      {entries.length === 0 ? (
        <p className="muted">Nothing has happened yet.</p>
      ) : (
        <ul className="feed" aria-label="Recent activity">
          {entries.map((e) => {
            const to = e.deal_id ? `/deals/${e.deal_id}` : `/contacts/${e.contact_id}`;
            return (
              <li key={`${e.kind}${e.id}`}>
                <span className="dot" style={{ background: DOT[e.type] }} aria-hidden />
                <div>
                  <p className="feed-text">{e.description}</p>
                  <p className="feed-meta">
                    <span className="visually-hidden">{KIND[e.type]} · </span>
                    <Link to={to}>{e.deal_name ?? e.contact_name}</Link> · {relativeTime(e.at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
