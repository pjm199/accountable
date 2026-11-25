import { Check } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog } from "../../components/Dialog";
import { useToast } from "../../components/Toast";
import { useMarkDone } from "../../hooks/activities";
import { errorMessage } from "../../lib/api";
import { shortDate } from "../../lib/format";
import type { FollowUp } from "../../lib/types";

function FollowUpItem({ item }: { item: FollowUp }) {
  const done = useMarkDone();
  const toast = useToast();
  const to = item.deal_id ? `/deals/${item.deal_id}` : `/contacts/${item.contact_id}`;
  const on = item.deal_name ?? item.contact_name;
  return (
    <li className="fu">
      <div className="fu-text">
        <Link to={to} className="fu-title">{item.description}</Link>
        <span className="fu-on">{on}</span>
      </div>
      <div className="fu-side">
        {item.overdue ? (
          <span className="badge badge-late">Overdue</span>
        ) : (
          <span className="badge badge-soon mono">{shortDate(item.follow_up_date)}</span>
        )}
        <button
          type="button"
          className="fu-done"
          aria-label={`Done: ${item.description}`}
          title="Mark as done"
          disabled={done.isPending}
          onClick={() => done.mutate(item.id, { onError: (e) => toast(errorMessage(e)) })}
        >
          <Check size={14} aria-hidden /> Done
        </button>
      </div>
    </li>
  );
}

/** Follow-ups not done: overdue first, then soonest. The panel shows five;
 * "Show all" opens the full list (R38). */
export function FollowUps({ items }: { items: FollowUp[] }) {
  const [all, setAll] = useState(false);
  return (
    <div className="followups">
      <div className="fu-head">
        <h2 className="hero-title">Follow-ups</h2>
        {items.length > 5 && (
          <button type="button" className="link-button" onClick={() => setAll(true)}>
            Show all {items.length}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="fu-empty">Nothing to follow up. Log an activity with a follow-up date and it shows here.</p>
      ) : (
        <ul className="fu-list" aria-label="Follow-ups">
          {items.slice(0, 5).map((item) => (
            <FollowUpItem key={item.id} item={item} />
          ))}
        </ul>
      )}
      {all && (
        <Dialog open onOpenChange={setAll} title="All follow-ups" width={560}>
          <ul className="fu-list fu-list-all" aria-label="All follow-ups">
            {items.map((item) => (
              <FollowUpItem key={item.id} item={item} />
            ))}
          </ul>
          {items.length === 0 && <p className="muted">Nothing left to follow up.</p>}
        </Dialog>
      )}
    </div>
  );
}
