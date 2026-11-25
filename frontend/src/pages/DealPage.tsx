import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { useDealForm } from "../components/DealFormContext";
import { LateBadge } from "../components/LateBadge";
import { Money } from "../components/Money";
import { LoadError, Loading } from "../components/PageHeader";
import { StageBadge } from "../components/StageBadge";
import { Timeline } from "../components/Timeline";
import { useDeal } from "../hooks/deals";
import { longDate, percent } from "../lib/format";
import { STAGE_BY_ID, expectedCents, isOpen } from "../lib/rules";
import "./record.css";

export default function DealPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const openDealForm = useDealForm();
  const { data: deal, isPending, error } = useDeal(id);
  const [deleting, setDeleting] = useState(false);

  if (isPending) return <main className="page"><Loading /></main>;
  if (error || !deal) return <main className="page"><LoadError error={error} /></main>;

  const stage = STAGE_BY_ID[deal.stage];
  return (
    <main className="page">
      <Link className="back-link" to="/deals">← Deals</Link>
      <section className="panel">
        <div className="record-head">
          <div>
            <p className="record-kicker">Deal</p>
            <h1 className="record-name">
              {deal.name} {deal.is_late && <LateBadge />}
            </h1>
          </div>
          <div className="record-buttons">
            <button type="button" className="btn btn-quiet" onClick={() => openDealForm({ deal })}><Pencil size={15} aria-hidden /> Edit</button>
            <button type="button" className="btn btn-quiet" onClick={() => setDeleting(true)}><Trash2 size={15} aria-hidden /> Delete</button>
          </div>
        </div>
        <dl className="record-facts">
          <div className="fact"><dt>Value</dt><dd className="big"><Money cents={deal.value_cents} /></dd></div>
          <div className="fact"><dt>Stage</dt><dd><StageBadge stage={deal.stage} /></dd></div>
          <div className="fact">
            <dt>Probability</dt>
            <dd className="probability">
              <span className="prob-bar" aria-hidden><span style={{ width: `${deal.probability}%`, background: stage.color }} /></span>
              <span className="mono">{percent(deal.probability)}</span>
            </dd>
          </div>
          {isOpen(deal.stage) && (
            <div className="fact"><dt>Expected revenue</dt><dd><Money cents={Math.round(expectedCents(deal))} /></dd></div>
          )}
          <div className="fact">
            <dt>{isOpen(deal.stage) ? "Expected close" : "Closed"}</dt>
            <dd className={deal.is_late ? "late-text mono" : "mono"}>{deal.close_date ? longDate(deal.close_date) : "—"}</dd>
          </div>
          <div className="fact">
            <dt>Organization</dt>
            <dd>{deal.organization_id ? <Link to={`/organizations/${deal.organization_id}`}>{deal.organization_name}</Link> : "—"}</dd>
          </div>
          <div className="fact">
            <dt>Main contact</dt>
            <dd>{deal.contact_id ? <Link to={`/contacts/${deal.contact_id}`}>{deal.contact_name}</Link> : "—"}</dd>
          </div>
        </dl>
      </section>

      <div className="record-grid" style={{ marginTop: 18 }}>
        <section className="panel" aria-labelledby="linked-title">
          <h2 id="linked-title" className="panel-title" style={{ marginBottom: 8 }}>Linked records</h2>
          <ul className="linked-list">
            <li>
              <div>
                <div className="sub">Organization</div>
                {deal.organization_id ? <Link className="title" to={`/organizations/${deal.organization_id}`}>{deal.organization_name}</Link> : <span className="muted">No organization</span>}
              </div>
            </li>
            <li>
              <div>
                <div className="sub">Main contact</div>
                {deal.contact_id ? <Link className="title" to={`/contacts/${deal.contact_id}`}>{deal.contact_name}</Link> : <span className="muted">No main contact</span>}
              </div>
            </li>
          </ul>
        </section>
        <Timeline entries={deal.timeline} on={{ deal_id: deal.id }} />
      </div>

      {deleting && <ConfirmDelete kind="deals" id={deal.id} name={deal.name} onClose={() => setDeleting(false)} onDeleted={() => navigate("/deals")} />}
    </main>
  );
}
