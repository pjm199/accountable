import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { useDealForm } from "../components/DealFormContext";
import { ContactFormDialog } from "../components/forms/ContactForm";
import { OrganizationFormDialog } from "../components/forms/OrganizationForm";
import { LinkedDeals } from "../components/LinkedDeals";
import { Money } from "../components/Money";
import { LoadError, Loading } from "../components/PageHeader";
import { useOrganization } from "../hooks/organizations";
import { isOpen } from "../lib/rules";
import { StatusPill } from "./Contacts";
import "./record.css";

function websiteHref(site: string) {
  return /^https?:\/\//.test(site) ? site : `https://${site}`;
}

export default function OrganizationPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const openDealForm = useDealForm();
  const { data: org, isPending, error } = useOrganization(id);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingContact, setAddingContact] = useState(false);

  if (isPending) return <main className="page"><Loading /></main>;
  if (error || !org) return <main className="page"><LoadError error={error} /></main>;

  const open = org.deals.filter((d) => isOpen(d.stage));
  return (
    <main className="page">
      <Link className="back-link" to="/organizations">← Organizations</Link>
      <section className="panel record-head-panel">
        <div className="record-head">
          <div>
            <p className="record-kicker">Organization</p>
            <h1 className="record-name">{org.name}</h1>
          </div>
          <div className="record-buttons">
            <button type="button" className="btn btn-quiet" onClick={() => setEditing(true)}><Pencil size={15} aria-hidden /> Edit</button>
            <button type="button" className="btn btn-quiet" onClick={() => setDeleting(true)}><Trash2 size={15} aria-hidden /> Delete</button>
          </div>
        </div>
        <dl className="record-facts">
          <div className="fact"><dt>Industry</dt><dd>{org.industry ?? "—"}</dd></div>
          <div className="fact">
            <dt>Website</dt>
            <dd>{org.website ? <a href={websiteHref(org.website)} target="_blank" rel="noreferrer">{org.website}</a> : "—"}</dd>
          </div>
          <div className="fact"><dt>Contacts</dt><dd className="mono">{org.contacts.length}</dd></div>
          <div className="fact"><dt>Open deals</dt><dd className="mono">{open.length}</dd></div>
          <div className="fact"><dt>Open value</dt><dd><Money cents={open.reduce((s, d) => s + d.value_cents, 0)} /></dd></div>
        </dl>
        {org.notes && <p className="record-notes">{org.notes}</p>}
      </section>

      <div className="record-grid" style={{ marginTop: 18 }}>
        <section className="panel" aria-labelledby="contacts-title">
          <div className="section-head">
            <h2 id="contacts-title" className="panel-title">Contacts</h2>
            <button type="button" className="btn btn-small btn-quiet" onClick={() => setAddingContact(true)}><Plus size={14} aria-hidden /> Add contact</button>
          </div>
          {org.contacts.length === 0 ? (
            <p className="linked-empty">No contacts yet.</p>
          ) : (
            <ul className="linked-list" aria-label="Contacts">
              {org.contacts.map((c) => (
                <li key={c.id}>
                  <div>
                    <Link className="title" to={`/contacts/${c.id}`}>{c.name}</Link>
                    <div className="sub">{c.job_title ?? "—"}{c.email && <> · {c.email}</>}</div>
                  </div>
                  <StatusPill status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel" aria-labelledby="deals-title">
          <div className="section-head">
            <h2 id="deals-title" className="panel-title">Deals</h2>
            <button type="button" className="btn btn-small btn-quiet" onClick={() => openDealForm({ defaults: { organization_id: org.id } })}><Plus size={14} aria-hidden /> Add deal</button>
          </div>
          <LinkedDeals deals={org.deals} show="contact" />
        </section>
      </div>

      {editing && <OrganizationFormDialog organization={org} onClose={() => setEditing(false)} />}
      {addingContact && <ContactFormDialog defaults={{ organization_id: org.id }} onClose={() => setAddingContact(false)} />}
      {deleting && (
        <ConfirmDelete kind="organizations" id={org.id} name={org.name} onClose={() => setDeleting(false)} onDeleted={() => navigate("/organizations")} />
      )}
    </main>
  );
}
