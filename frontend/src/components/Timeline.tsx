import { ArrowRightLeft, Mail, Pencil, Phone, Plus, StickyNote, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDeleteActivity } from "../hooks/activities";
import { errorMessage } from "../lib/api";
import { dateTime, shortDate } from "../lib/format";
import { STAGE_BY_ID, isOverdue } from "../lib/rules";
import type { TimelineActivity, TimelineEntry } from "../lib/types";
import { Dialog, DialogActions } from "./Dialog";
import { ActivityFormDialog } from "./forms/ActivityForm";
import "./Timeline.css";

const ICONS = { call: Phone, email: Mail, note: StickyNote };
const TYPE_LABEL = { call: "Call", email: "Email", note: "Note" };

function FollowUpTag({ entry }: { entry: TimelineActivity }) {
  if (!entry.follow_up_date) return null;
  if (entry.done) return <span className="badge badge-done">Follow-up done</span>;
  if (isOverdue(entry)) return <span className="badge badge-late">Overdue · {shortDate(entry.follow_up_date)}</span>;
  return <span className="badge badge-soon">Follow-up {shortDate(entry.follow_up_date)}</span>;
}

interface Props {
  entries: TimelineEntry[];
  /** Where a new activity is logged. */
  on: { contact_id: number } | { deal_id: number };
  /** On a contact's timeline, activities on its deals name the deal (R24). */
  showDeal?: boolean;
}

/** Activities and stage changes, newest first (R24, R25). */
export function Timeline({ entries, on, showDeal = false }: Props) {
  const [editing, setEditing] = useState<TimelineActivity | "new" | null>(null);
  const [deleting, setDeleting] = useState<TimelineActivity | null>(null);
  const remove = useDeleteActivity();
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="panel timeline-panel" aria-labelledby="timeline-title">
      <div className="section-head">
        <h2 id="timeline-title" className="panel-title">Timeline</h2>
        <button type="button" className="btn btn-small" onClick={() => setEditing("new")}>
          <Plus size={14} aria-hidden /> Log activity
        </button>
      </div>
      {entries.length === 0 ? (
        <div className="empty">
          <p>Nothing logged yet.</p>
        </div>
      ) : (
        <ol className="timeline" aria-label="Timeline entries">
          {entries.map((entry) =>
            entry.kind === "stage_change" ? (
              <li key={`s${entry.id}`} className="timeline-entry">
                <span className="timeline-icon stage" style={{ background: STAGE_BY_ID[entry.to_stage].color }} aria-hidden>
                  <ArrowRightLeft size={13} color={STAGE_BY_ID[entry.to_stage].onColor} />
                </span>
                <div className="timeline-body">
                  <p className="timeline-text">{entry.description}</p>
                  <p className="timeline-meta">
                    Stage change · <span className="mono">{dateTime(entry.at)}</span>
                  </p>
                </div>
              </li>
            ) : (
              <li key={`a${entry.id}`} className="timeline-entry">
                <ActivityIcon type={entry.type} />
                <div className="timeline-body">
                  <p className="timeline-text">{entry.description}</p>
                  <p className="timeline-meta">
                    {TYPE_LABEL[entry.type]} · <span className="mono">{dateTime(entry.at)}</span>
                    {showDeal && entry.deal_id && (
                      <>
                        {" "}· on <Link to={`/deals/${entry.deal_id}`}>{entry.deal_name}</Link>
                      </>
                    )}
                  </p>
                  <FollowUpTag entry={entry} />
                </div>
                <span className="row-actions">
                  <button type="button" className="icon-btn" aria-label={`Edit activity: ${entry.description}`} onClick={() => setEditing(entry)}>
                    <Pencil size={15} aria-hidden />
                  </button>
                  <button type="button" className="icon-btn danger" aria-label={`Delete activity: ${entry.description}`} onClick={() => setDeleting(entry)}>
                    <Trash2 size={15} aria-hidden />
                  </button>
                </span>
              </li>
            ),
          )}
        </ol>
      )}
      {editing && <ActivityFormDialog on={on} activity={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <Dialog
          open
          onOpenChange={(open) => !open && (setDeleting(null), setError(null))}
          title="Delete activity?"
          description={<>“{deleting.description}” will be deleted.</>}
          width={440}
        >
          {error && <p className="form-error" role="alert">{error}</p>}
          <DialogActions>
            <button type="button" className="btn btn-quiet" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(deleting.id, { onSuccess: () => setDeleting(null), onError: (e) => setError(errorMessage(e)) })
              }
            >
              Delete activity
            </button>
          </DialogActions>
        </Dialog>
      )}
    </section>
  );
}

export function ActivityIcon({ type }: { type: TimelineActivity["type"] }) {
  const Icon = ICONS[type];
  return (
    <span className={`timeline-icon ${type}`} aria-hidden>
      <Icon size={14} />
    </span>
  );
}
