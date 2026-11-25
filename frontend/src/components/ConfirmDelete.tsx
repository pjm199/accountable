import { useState } from "react";
import { errorMessage } from "../lib/api";
import { plural } from "../lib/format";
import type { DeleteImpact, DeleteKind } from "../lib/types";
import { useDeleteImpact, useDeleteRecord } from "../hooks/records";
import { Dialog, DialogActions } from "./Dialog";

const NOUN: Record<DeleteKind, string> = { organizations: "organization", contacts: "contact", deals: "deal" };

/** What happens to linked records, with the counts (R19). */
export function deleteMessage(kind: DeleteKind, counts: DeleteImpact): string {
  if (kind === "organizations") {
    const parts = [counts.contacts && plural(counts.contacts, "contact"), counts.deals && plural(counts.deals, "deal")].filter(Boolean);
    return parts.length ? `Its ${parts.join(" and ")} will be kept, with no organization.` : "No contacts or deals are linked to it.";
  }
  if (kind === "contacts") {
    const sentences = [];
    if (counts.deals) sentences.push(`Its ${plural(counts.deals, "deal")} will be kept, with no main contact.`);
    if (counts.activities) sentences.push(`Its ${plural(counts.activities, "activity", "activities")} will be deleted.`);
    return sentences.join(" ") || "No deals or activities are linked to it.";
  }
  return counts.activities
    ? `Its ${plural(counts.activities, "activity", "activities")} and its stage history will be deleted.`
    : "Its stage history will be deleted.";
}

interface ViewProps {
  kind: DeleteKind;
  name: string;
  counts: DeleteImpact | undefined;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteView({ kind, name, counts, busy, error, onConfirm, onCancel }: ViewProps) {
  const noun = NOUN[kind];
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onCancel()}
      title={`Delete ${noun}?`}
      description={
        <>
          <strong>{name}</strong> will be deleted. {counts ? deleteMessage(kind, counts) : "Checking linked records…"}
        </>
      }
      width={460}
    >
      {error && <p className="form-error" role="alert">{error}</p>}
      <DialogActions>
        <button type="button" className="btn btn-quiet" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy || !counts}>
          Delete {noun}
        </button>
      </DialogActions>
    </Dialog>
  );
}

interface Props {
  kind: DeleteKind;
  id: number;
  name: string;
  onClose: () => void;
  onDeleted?: () => void;
}

export function ConfirmDelete({ kind, id, name, onClose, onDeleted }: Props) {
  const impact = useDeleteImpact(kind, id);
  const remove = useDeleteRecord();
  const [error, setError] = useState<string | null>(null);
  return (
    <ConfirmDeleteView
      kind={kind}
      name={name}
      counts={impact.data}
      busy={remove.isPending}
      error={error ?? (impact.error ? errorMessage(impact.error) : null)}
      onCancel={onClose}
      onConfirm={() =>
        remove.mutate(
          { kind, id },
          {
            onSuccess: () => {
              onClose();
              onDeleted?.();
            },
            onError: (e) => setError(errorMessage(e)),
          },
        )
      }
    />
  );
}
