import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { DataTable, type Column } from "../components/DataTable";
import { ContactFormDialog } from "../components/forms/ContactForm";
import { LoadError, Loading, PageHeader } from "../components/PageHeader";
import { RowActions } from "../components/RowActions";
import { useContacts } from "../hooks/contacts";
import { STATUSES, STATUS_LABEL } from "../lib/rules";
import type { Contact, ContactStatus } from "../lib/types";

export function StatusPill({ status }: { status: ContactStatus }) {
  return <span className={`status-pill status-${status}`}>{STATUS_LABEL[status]}</span>;
}

export default function Contacts() {
  const { data, isPending, error } = useContacts();
  const [status, setStatus] = useState<ContactStatus | "all">("all");
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  const shown = useMemo(() => (data ?? []).filter((c) => status === "all" || c.status === status), [data, status]);
  const columns = useMemo<Column<Contact>[]>(
    () => [
      { id: "name", header: "Name", kind: "text", value: (c) => c.name, cell: (c) => <Link className="name-link" to={`/contacts/${c.id}`}>{c.name}</Link> },
      { id: "status", header: "Status", kind: "text", value: (c) => STATUS_LABEL[c.status], cell: (c) => <StatusPill status={c.status} /> },
      {
        id: "organization", header: "Organization", kind: "text", value: (c) => c.organization_name,
        cell: (c) => (c.organization_id ? <Link to={`/organizations/${c.organization_id}`}>{c.organization_name}</Link> : <span className="muted">—</span>),
      },
      { id: "job_title", header: "Job title", kind: "text", value: (c) => c.job_title },
      { id: "email", header: "Email", kind: "text", value: (c) => c.email },
      { id: "phone", header: "Phone", kind: "text", value: (c) => c.phone },
    ],
    [],
  );

  const filter = (
    <div className="filter-pills" role="group" aria-label="Filter by status">
      {[{ id: "all" as const, plural: "All" }, ...STATUSES].map((s) => (
        <button key={s.id} type="button" aria-pressed={status === s.id} onClick={() => setStatus(s.id)}>
          {s.plural}
        </button>
      ))}
    </div>
  );

  return (
    <main className="page">
      <PageHeader title="Contacts" addLabel="Add contact" onAdd={() => setEditing("new")} />
      {isPending ? (
        <Loading />
      ) : error ? (
        <LoadError error={error} />
      ) : (
        <DataTable
          label="Contacts"
          searchPlaceholder="Search contacts"
          columns={columns}
          data={shown}
          rowId={(c) => c.id}
          toolbar={filter}
          actions={(c) => <RowActions name={c.name} onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} />}
          empty={
            <>
              <p>{status === "all" ? "No contacts yet." : `No ${STATUSES.find((s) => s.id === status)!.plural.toLowerCase()} yet.`}</p>
              <button type="button" className="btn" onClick={() => setEditing("new")}>Add contact</button>
            </>
          }
        />
      )}
      {editing && (
        <ContactFormDialog
          contact={editing === "new" ? undefined : editing}
          defaults={status !== "all" ? { status } : undefined}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && <ConfirmDelete kind="contacts" id={deleting.id} name={deleting.name} onClose={() => setDeleting(null)} />}
    </main>
  );
}
