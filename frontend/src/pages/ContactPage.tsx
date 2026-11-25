import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { useDealForm } from "../components/DealFormContext";
import { ContactFormDialog } from "../components/forms/ContactForm";
import { LinkedDeals } from "../components/LinkedDeals";
import { LoadError, Loading } from "../components/PageHeader";
import { Timeline } from "../components/Timeline";
import { useContact } from "../hooks/contacts";
import { StatusPill } from "./Contacts";
import "./record.css";

export default function ContactPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const openDealForm = useDealForm();
  const { data: contact, isPending, error } = useContact(id);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isPending) return <main className="page"><Loading /></main>;
  if (error || !contact) return <main className="page"><LoadError error={error} /></main>;

  return (
    <main className="page">
      <Link className="back-link" to="/contacts">← Contacts</Link>
      <section className="panel">
        <div className="record-head">
          <div>
            <p className="record-kicker">
              {contact.job_title ?? "Contact"}
              {contact.organization_id && (
                <> at <Link to={`/organizations/${contact.organization_id}`}>{contact.organization_name}</Link></>
              )}
            </p>
            <h1 className="record-name">
              {contact.name} <StatusPill status={contact.status} />
            </h1>
          </div>
          <div className="record-buttons">
            <button type="button" className="btn btn-quiet" onClick={() => setEditing(true)}><Pencil size={15} aria-hidden /> Edit</button>
            <button type="button" className="btn btn-quiet" onClick={() => setDeleting(true)}><Trash2 size={15} aria-hidden /> Delete</button>
          </div>
        </div>
        <dl className="record-facts">
          <div className="fact">
            <dt>Organization</dt>
            <dd>{contact.organization_id ? <Link to={`/organizations/${contact.organization_id}`}>{contact.organization_name}</Link> : "—"}</dd>
          </div>
          <div className="fact"><dt>Email</dt><dd>{contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : "—"}</dd></div>
          <div className="fact"><dt>Phone</dt><dd className="mono">{contact.phone ?? "—"}</dd></div>
          <div className="fact"><dt>Job title</dt><dd>{contact.job_title ?? "—"}</dd></div>
        </dl>
      </section>

      <div className="record-grid" style={{ marginTop: 18 }}>
        <section className="panel" aria-labelledby="deals-title">
          <div className="section-head">
            <h2 id="deals-title" className="panel-title">Deals</h2>
            <button
              type="button"
              className="btn btn-small btn-quiet"
              onClick={() => openDealForm({ defaults: { contact_id: contact.id, organization_id: contact.organization_id } })}
            >
              <Plus size={14} aria-hidden /> Add deal
            </button>
          </div>
          <LinkedDeals deals={contact.deals} show="organization" />
        </section>
        <Timeline entries={contact.timeline} on={{ contact_id: contact.id }} showDeal />
      </div>

      {editing && <ContactFormDialog contact={contact} onClose={() => setEditing(false)} />}
      {deleting && <ConfirmDelete kind="contacts" id={contact.id} name={contact.name} onClose={() => setDeleting(false)} onDeleted={() => navigate("/contacts")} />}
    </main>
  );
}
