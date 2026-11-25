import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { DataTable, type Column } from "../components/DataTable";
import { OrganizationFormDialog } from "../components/forms/OrganizationForm";
import { Money } from "../components/Money";
import { LoadError, Loading, PageHeader } from "../components/PageHeader";
import { RowActions } from "../components/RowActions";
import { useOrganizations } from "../hooks/organizations";
import type { OrganizationRow } from "../lib/types";

export default function Organizations() {
  const { data, isPending, error } = useOrganizations();
  const [editing, setEditing] = useState<OrganizationRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<OrganizationRow | null>(null);

  const columns = useMemo<Column<OrganizationRow>[]>(
    () => [
      { id: "name", header: "Name", kind: "text", value: (o) => o.name, cell: (o) => <Link className="name-link" to={`/organizations/${o.id}`}>{o.name}</Link> },
      { id: "industry", header: "Industry", kind: "text", value: (o) => o.industry },
      { id: "website", header: "Website", kind: "text", value: (o) => o.website },
      { id: "contacts", header: "Contacts", kind: "number", value: (o) => o.contact_count, align: "right", cell: (o) => <span className="mono">{o.contact_count}</span> },
      { id: "open_deals", header: "Open deals", kind: "number", value: (o) => o.open_deal_count, align: "right", cell: (o) => <span className="mono">{o.open_deal_count}</span> },
      { id: "open_value", header: "Open value", kind: "number", value: (o) => o.open_value_cents, align: "right", cell: (o) => <Money cents={o.open_value_cents} /> },
    ],
    [],
  );

  return (
    <main className="page">
      <PageHeader title="Organizations" addLabel="Add organization" onAdd={() => setEditing("new")} />
      {isPending ? (
        <Loading />
      ) : error ? (
        <LoadError error={error} />
      ) : (
        <DataTable
          label="Organizations"
          searchPlaceholder="Search organizations"
          columns={columns}
          data={data}
          rowId={(o) => o.id}
          actions={(o) => <RowActions name={o.name} onEdit={() => setEditing(o)} onDelete={() => setDeleting(o)} />}
          empty={
            <>
              <p>No organizations yet.</p>
              <button type="button" className="btn" onClick={() => setEditing("new")}>Add organization</button>
            </>
          }
        />
      )}
      {editing && <OrganizationFormDialog organization={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDelete kind="organizations" id={deleting.id} name={deleting.name} onClose={() => setDeleting(null)} />}
    </main>
  );
}
