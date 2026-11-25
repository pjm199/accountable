import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSaveOrganization } from "../../hooks/organizations";
import { errorMessage } from "../../lib/api";
import type { Organization, OrganizationDetail } from "../../lib/types";
import { Dialog, DialogActions } from "../Dialog";
import { Field } from "./Field";
import { blank, organizationSchema, type OrganizationValues } from "./schemas";
import "./forms.css";

interface Props {
  organization?: Organization;
  onClose: () => void;
  onSaved?: (saved: OrganizationDetail) => void;
}

export function OrganizationFormDialog({ organization, onClose, onSaved }: Props) {
  const save = useSaveOrganization();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<OrganizationValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name ?? "",
      website: organization?.website ?? "",
      industry: organization?.industry ?? "",
      notes: organization?.notes ?? "",
    },
  });
  const errors = formState.errors;

  const submit = handleSubmit((values) => {
    setServerError(null);
    const data = {
      name: values.name.trim(),
      website: blank(values.website),
      industry: blank(values.industry),
      notes: blank(values.notes),
    };
    save.mutate(
      { id: organization?.id, data },
      { onSuccess: (saved) => (onClose(), onSaved?.(saved)), onError: (e) => setServerError(errorMessage(e)) },
    );
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title={organization ? "Edit organization" : "Add organization"}>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <div className="wide">
            <Field id="org-name" label="Name" required error={errors.name?.message}>
              <input id="org-name" className="input" aria-invalid={!!errors.name} {...register("name")} autoFocus />
            </Field>
          </div>
          <Field id="org-industry" label="Industry">
            <input id="org-industry" className="input" {...register("industry")} />
          </Field>
          <Field id="org-website" label="Website">
            <input id="org-website" className="input" placeholder="example.com" {...register("website")} />
          </Field>
          <div className="wide">
            <Field id="org-notes" label="Notes">
              <textarea id="org-notes" className="input" rows={3} {...register("notes")} />
            </Field>
          </div>
        </div>
        {serverError && <p className="form-error" role="alert">{serverError}</p>}
        <DialogActions>
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={save.isPending}>
            {organization ? "Save changes" : "Add organization"}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
