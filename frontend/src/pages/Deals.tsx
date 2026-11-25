import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { DataTable, type Column } from "../components/DataTable";
import { useDealForm } from "../components/DealFormContext";
import { LateBadge } from "../components/LateBadge";
import { Money } from "../components/Money";
import { LoadError, Loading, PageHeader } from "../components/PageHeader";
import { RowActions } from "../components/RowActions";
import { StageBadge } from "../components/StageBadge";
import { useDeals } from "../hooks/deals";
import { longDate, percent } from "../lib/format";
import { STAGES, STAGE_BY_ID } from "../lib/rules";
import type { Deal } from "../lib/types";

export function CloseDate({ deal }: { deal: Pick<Deal, "close_date" | "is_late"> }) {
  if (!deal.close_date) return <span className="muted">—</span>;
  return (
    <span className="late-date">
      <span className="mono">{longDate(deal.close_date)}</span>
      {deal.is_late && <LateBadge />}
    </span>
  );
}

export default function Deals() {
  const { data, isPending, error } = useDeals();
  const openDealForm = useDealForm();
  const [deleting, setDeleting] = useState<Deal | null>(null);

  const columns = useMemo<Column<Deal>[]>(
    () => [
      { id: "name", header: "Name", kind: "text", value: (d) => d.name, cell: (d) => <Link className="name-link" to={`/deals/${d.id}`}>{d.name}</Link> },
      {
        id: "organization", header: "Organization", kind: "text", value: (d) => d.organization_name,
        cell: (d) => (d.organization_id ? <Link to={`/organizations/${d.organization_id}`}>{d.organization_name}</Link> : <span className="muted">—</span>),
      },
      {
        id: "contact", header: "Main contact", kind: "text", value: (d) => d.contact_name,
        cell: (d) => (d.contact_id ? <Link to={`/contacts/${d.contact_id}`}>{d.contact_name}</Link> : <span className="muted">—</span>),
      },
      // Searched by its name, sorted in pipeline order.
      { id: "stage", header: "Stage", kind: "text", value: (d) => STAGE_BY_ID[d.stage].label, sortValue: (d) => String(STAGES.findIndex((s) => s.id === d.stage)), cell: (d) => <StageBadge stage={d.stage} /> },
      { id: "value", header: "Value", kind: "number", value: (d) => d.value_cents, align: "right", cell: (d) => <Money cents={d.value_cents} /> },
      { id: "probability", header: "Probability", kind: "number", value: (d) => d.probability, align: "right", cell: (d) => <span className="mono">{percent(d.probability)}</span> },
      { id: "close_date", header: "Close date", kind: "date", value: (d) => d.close_date, cell: (d) => <CloseDate deal={d} /> },
    ],
    [],
  );
  const rows = useMemo(
    () => [...(data ?? [])].sort((a, b) => STAGES.findIndex((s) => s.id === a.stage) - STAGES.findIndex((s) => s.id === b.stage) || a.position - b.position),
    [data],
  );

  return (
    <main className="page">
      <PageHeader title="Deals" addLabel="Add deal" onAdd={() => openDealForm()} />
      {isPending ? (
        <Loading />
      ) : error ? (
        <LoadError error={error} />
      ) : (
        <DataTable
          label="Deals"
          searchPlaceholder="Search deals"
          columns={columns}
          data={rows}
          rowId={(d) => d.id}
          rowClassName={(d) => (d.is_late ? "row-late" : undefined)}
          actions={(d) => <RowActions name={d.name} onEdit={() => openDealForm({ deal: d })} onDelete={() => setDeleting(d)} />}
          empty={
            <>
              <p>No deals yet.</p>
              <button type="button" className="btn" onClick={() => openDealForm()}>Add deal</button>
            </>
          }
        />
      )}
      {deleting && <ConfirmDelete kind="deals" id={deleting.id} name={deleting.name} onClose={() => setDeleting(null)} />}
    </main>
  );
}
