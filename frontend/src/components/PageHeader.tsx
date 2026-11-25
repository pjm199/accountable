import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ title, hint, addLabel, onAdd, children }: { title: string; hint?: string; addLabel?: string; onAdd?: () => void; children?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {hint && <p className="page-hint">{hint}</p>}
      </div>
      {children}
      {addLabel && onAdd && (
        <button type="button" className="btn" onClick={onAdd}>
          <Plus size={16} aria-hidden /> {addLabel}
        </button>
      )}
    </div>
  );
}

/** Loading and error states shared by every page. */
export function Loading() {
  return <p className="muted" style={{ padding: "24px 0" }}>Loading…</p>;
}

export function LoadError({ error }: { error: unknown }) {
  return (
    <div className="panel empty" role="alert">
      <p>{error instanceof Error ? error.message : "Something went wrong."}</p>
    </div>
  );
}
