import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useSaveContact } from "../../hooks/contacts";
import { useOrganizations } from "../../hooks/organizations";
import { errorMessage } from "../../lib/api";
import { STATUSES } from "../../lib/rules";
import type { Contact, ContactDetail, ContactStatus } from "../../lib/types";
import { Dialog, DialogActions } from "../Dialog";
import { Field } from "./Field";
import { Picker } from "./Picker";
import { blank, contactSchema, type ContactValues } from "./schemas";
import "./forms.css";

interface Props {
  contact?: Contact;
  defaults?: { organization_id?: number | null; status?: ContactStatus };
  onClose: () => void;
  onSaved?: (saved: ContactDetail) => void;
}

export function ContactFormDialog({ contact, defaults, onClose, onSaved }: Props) {
  const save = useSaveContact();
  const organizations = useOrganizations();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, control, formState } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact?.name ?? "",
      status: contact?.status ?? defaults?.status ?? "lead",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      job_title: contact?.job_title ?? "",
      organization_id: contact ? contact.organization_id : (defaults?.organization_id ?? null),
    },
  });
  const errors = formState.errors;

  const submit = handleSubmit((values) => {
    setServerError(null);
    const data = {
      name: values.name.trim(),
      status: values.status,
      email: blank(values.email),
      phone: blank(values.phone),
      job_title: blank(values.job_title),
      organization_id: values.organization_id,
    };
    save.mutate(
      { id: contact?.id, data },
      { onSuccess: (saved) => (onClose(), onSaved?.(saved)), onError: (e) => setServerError(errorMessage(e)) },
    );
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title={contact ? "Edit contact" : "Add contact"}>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field id="contact-name" label="Name" required error={errors.name?.message}>
            <input id="contact-name" className="input" aria-invalid={!!errors.name} {...register("name")} autoFocus />
          </Field>
          <Field id="contact-status" label="Status" required error={errors.status?.message}>
            <select id="contact-status" className="input" {...register("status")}>
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="contact-org" label="Organization">
            <Controller
              control={control}
              name="organization_id"
              render={({ field }) => (
                <Picker
                  id="contact-org"
                  value={field.value}
                  onChange={field.onChange}
                  options={(organizations.data ?? []).map((o) => ({ id: o.id, label: o.name, hint: o.industry }))}
                  placeholder="Pick an organization"
                  noneLabel="No organization"
                />
              )}
            />
          </Field>
          <Field id="contact-job" label="Job title">
            <input id="contact-job" className="input" {...register("job_title")} />
          </Field>
          <Field id="contact-email" label="Email" error={errors.email?.message}>
            <input id="contact-email" type="email" className="input" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field id="contact-phone" label="Phone">
            <input id="contact-phone" type="tel" className="input" {...register("phone")} />
          </Field>
        </div>
        {serverError && <p className="form-error" role="alert">{serverError}</p>}
        <DialogActions>
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={save.isPending}>
            {contact ? "Save changes" : "Add contact"}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
