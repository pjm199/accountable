import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link, useNavigate } from "react-router-dom";
import { initials, moneyShort, percent, shortDate } from "../../lib/format";
import { STAGE_BY_ID } from "../../lib/rules";
import type { Deal } from "../../lib/types";

export function CardBody({ deal }: { deal: Deal }) {
  const stage = STAGE_BY_ID[deal.stage];
  return (
    <>
      <div className="card-top">
        <div className="card-names">
          <Link className="card-name" to={`/deals/${deal.id}`} draggable={false} onClick={(e) => e.stopPropagation()}>
            {deal.name}
          </Link>
          <div className="card-org">{deal.organization_name ?? "No organization"}</div>
        </div>
        <span className="card-initials" title={deal.contact_name ?? "No main contact"} aria-label={deal.contact_name ? `Main contact ${deal.contact_name}` : "No main contact"}>
          {deal.contact_name ? initials(deal.contact_name) : "—"}
        </span>
      </div>
      <div className="card-prob">
        <span className="card-bar" aria-hidden>
          <span style={{ width: `${deal.probability}%`, background: stage.color }} />
        </span>
        <span className="mono card-pct">{percent(deal.probability)}</span>
      </div>
      <div className="card-meta">
        <b className="mono">{moneyShort(deal.value_cents)}</b>
        <span className={deal.is_late ? "card-when late" : "card-when"}>
          {deal.is_late && "Late · "}
          {deal.close_date ? shortDate(deal.close_date) : "No date"}
        </span>
      </div>
    </>
  );
}

/** A deal on the board. Drag it with the mouse, or focus it and press Space
 * to pick it up, the arrow keys to move it and Space to drop it (R31).
 * Clicking it, or pressing Enter, opens the deal page (R28). */
export function DealCard({ deal }: { deal: Deal }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { stage: deal.stage },
  });
  return (
    <li
      ref={setNodeRef}
      className={`card${deal.is_late ? " late" : ""}${isDragging ? " placeholder" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-deal-id={deal.id}
      {...attributes}
      {...listeners}
      aria-roledescription="Deal card"
      aria-label={`${deal.name}, ${STAGE_BY_ID[deal.stage].label}`}
      onClick={() => navigate(`/deals/${deal.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) navigate(`/deals/${deal.id}`);
        else listeners?.onKeyDown?.(e);
      }}
    >
      <CardBody deal={deal} />
    </li>
  );
}
