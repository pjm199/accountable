import { Pencil, Trash2 } from "lucide-react";

/** Edit and delete icon buttons, labelled for screen readers. */
export function RowActions({ name, onEdit, onDelete }: { name: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <span className="row-actions">
      <button type="button" className="icon-btn" aria-label={`Edit ${name}`} title="Edit" onClick={onEdit}>
        <Pencil size={16} aria-hidden />
      </button>
      <button type="button" className="icon-btn danger" aria-label={`Delete ${name}`} title="Delete" onClick={onDelete}>
        <Trash2 size={16} aria-hidden />
      </button>
    </span>
  );
}
