import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useContacts } from "../../hooks/contacts";
import { useSaveDeal } from "../../hooks/deals";
import { useOrganizations } from "../../hooks/organizations";
import { errorMessage } from "../../lib/api";
import { centsToDollarsText, isoDate, parseDollars } from "../../lib/format";
import { STAGES, usualProbability } from "../../lib/rules";
import type { Deal, DealDetail, DealInput, Stage } from "../../lib/types";
import { Dialog, DialogActions } from "../Dialog";
import { Field } from "./Field";
import { Picker, type PickerOption } from "./Picker";
import { blank, dealSchema, type DealValues } from "./schemas";
import "./forms.css";

export interface DealDefaults {
  stage?: Stage;
  organization_id?: number | null;
  contact_id?: number | null;
}

export function dealValues(deal?: Deal, defaults: DealDefaults = {}): DealValues {
  const stage = deal?.stage ?? defaults.stage ?? "new";
  return {
    name: deal?.name ?? "",
    stage,
    value: deal ? centsToDollarsText(deal.value_cents) : "",
    probability: String(deal?.probability ?? usualProbability(stage)),
    close_date: deal?.close_date ?? (stage === "won" || stage === "lost" ? isoDate(new Date()) : ""),
    organization_id: deal ? deal.organization_id : (defaults.organization_id ?? null),
    contact_id: deal ? deal.contact_id : (defaults.contact_id ?? null),
  };
}

export function toDealInput(values: DealValues): DealInput {
  return {
    name: values.name.trim(),
    stage: values.stage,
    value_cents: parseDollars(values.value) ?? 0,
    probability: values.probability.trim() === "" ? usualProbability(values.stage) : Number(values.probability),
    close_date: blank(values.close_date),
    organization_id: values.organization_id,
    contact_id: values.contact_id,
  };
}

interface FormProps {
  initial: DealValues;
  organizations: PickerOption[];
  contacts: (PickerOption & { organization_id: number | null })[];
  onSubmit: (data: DealInput) => void;
  onCancel: () => void;
  submitLabel: string;
  busy?: boolean;
  error?: string | null;
  today?: () => Date;
}

export function DealForm({ initial, organizations, contacts, onSubmit, onCancel, submitLabel, busy, error, today = () => new Date() }: FormProps) {
  const { register, handleSubmit, control, setValue, getValues, formState } = useForm<DealValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: initial,
  });
  const errors = formState.errors;
  const stageField = register("stage");

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(toDealInput(values)))} noValidate>
      <div className="form-grid">
        <div className="wide">
          <Field id="deal-name" label="Name" required error={errors.name?.message}>
            <input id="deal-name" className="input" aria-invalid={!!errors.name} {...register("name")} autoFocus />
          </Field>
        </div>
        <Field id="deal-stage" label="Stage" required error={errors.stage?.message}>
          <select
            id="deal-stage"
            className="input"
            {...stageField}
            onChange={(e) => {
              void stageField.onChange(e);
              // A new stage fills in its usual probability, and today's date
              // for Won or Lost; both can be overwritten (concern 6).
              const stage = e.target.value as Stage;
              setValue("probability", String(usualProbability(stage)));
              if (stage === "won" || stage === "lost") setValue("close_date", isoDate(today()));
            }}
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="deal-value" label="Value" required error={errors.value?.message}>
          <div className="input-prefix">
            <span aria-hidden>US$</span>
            <input id="deal-value" className="input" inputMode="decimal" aria-invalid={!!errors.value} {...register("value")} />
          </div>
        </Field>
        <Field id="deal-probability" label="Probability of close" error={errors.probability?.message}>
          <div className="input-suffix">
            <input
              id="deal-probability"
              className="input"
              inputMode="numeric"
              aria-invalid={!!errors.probability}
              {...register("probability")}
            />
            <span aria-hidden>%</span>
          </div>
        </Field>
        <Field id="deal-close" label="Close date">
          <input id="deal-close" type="date" className="input" {...register("close_date")} />
        </Field>
        <Field id="deal-org" label="Organization">
          <Controller
            control={control}
            name="organization_id"
            render={({ field }) => (
              <Picker id="deal-org" value={field.value} onChange={field.onChange} options={organizations} placeholder="Pick an organization" noneLabel="No organization" />
            )}
          />
        </Field>
        <Field id="deal-contact" label="Main contact">
          <Controller
            control={control}
            name="contact_id"
            render={({ field }) => (
              <Picker
                id="deal-contact"
                value={field.value}
                onChange={(id) => {
                  field.onChange(id);
                  // Picking a contact fills in their organization if none is set.
                  const contact = contacts.find((c) => c.id === id);
                  if (contact?.organization_id && getValues("organization_id") === null) {
                    setValue("organization_id", contact.organization_id);
                  }
                }}
                options={contacts}
                placeholder="Pick a contact"
                noneLabel="No main contact"
              />
            )}
          />
        </Field>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <DialogActions>
        <button type="button" className="btn btn-quiet" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn" disabled={busy}>
          {submitLabel}
        </button>
      </DialogActions>
    </form>
  );
}

interface DialogProps {
  deal?: Deal;
  defaults?: DealDefaults;
  onClose: () => void;
  onSaved?: (saved: DealDetail) => void;
}

export function DealFormDialog({ deal, defaults, onClose, onSaved }: DialogProps) {
  const save = useSaveDeal();
  const organizations = useOrganizations();
  const contacts = useContacts();
  const [error, setError] = useState<string | null>(null);
  const ready = organizations.data && contacts.data;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title={deal ? "Edit deal" : "Add deal"} width={560}>
      {ready ? (
        <DealForm
          initial={dealValues(deal, defaults)}
          organizations={organizations.data.map((o) => ({ id: o.id, label: o.name, hint: o.industry }))}
          contacts={contacts.data.map((c) => ({ id: c.id, label: c.name, hint: c.organization_name, organization_id: c.organization_id }))}
          submitLabel={deal ? "Save changes" : "Add deal"}
          busy={save.isPending}
          error={error}
          onCancel={onClose}
          onSubmit={(data) => {
            setError(null);
            save.mutate(
              { id: deal?.id, data },
              { onSuccess: (saved) => (onClose(), onSaved?.(saved)), onError: (e) => setError(errorMessage(e)) },
            );
          }}
        />
      ) : (
        <p className="muted">Loading…</p>
      )}
    </Dialog>
  );
}
