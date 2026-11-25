import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { money } from "../../lib/format";
import { columnTotals, type StageInfo } from "../../lib/rules";
import type { Deal } from "../../lib/types";
import { DealCard } from "./DealCard";

interface Props {
  stage: StageInfo;
  deals: Deal[];
  onAdd: () => void;
}

/** One stage: its name, count, total and expected revenue, its cards, and
 * "Add deal" (R26, R30). */
export function Column({ stage, deals, onAdd }: Props) {
  const { setNodeRef } = useDroppable({ id: `column:${stage.id}`, data: { stage: stage.id } });
  const totals = columnTotals(deals);
  return (
    <section className="column" aria-label={`${stage.label} column`} data-stage={stage.id}>
      <header className="column-head">
        <h2 className="column-title">
          <i style={{ background: stage.color }} aria-hidden />
          {stage.label}
          <span className="column-count mono" data-testid="column-count">{totals.count}</span>
        </h2>
        <p className="column-figures">
          <span className="mono" data-testid="column-value">{money(totals.valueCents)}</span>
          {!stage.open && <span> · closed</span>}
          <br />
          Expected <span className="mono" data-testid="column-expected">{money(totals.expectedCents)}</span>
        </p>
      </header>
      <SortableContext id={stage.id} items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <ol ref={setNodeRef} className="column-cards" aria-label={`${stage.label} deals`}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
          {deals.length === 0 && <li className="column-empty">No deals in this stage yet.</li>}
        </ol>
      </SortableContext>
      <button type="button" className="column-add" onClick={onAdd}>
        <Plus size={14} aria-hidden /> Add deal
        <span className="visually-hidden"> in {stage.label}</span>
      </button>
    </section>
  );
}
