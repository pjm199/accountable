import type { ReactNode } from "react";

interface Props {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  hint?: string;
}

/** A labelled form field. Required fields are marked with an asterisk (R18). */
export function Field({ id, label, required, error, children, hint }: Props) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {required && (
          <span className="required" aria-hidden>
            {" "}*
          </span>
        )}
        {required && <span className="visually-hidden"> (required)</span>}
      </label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
