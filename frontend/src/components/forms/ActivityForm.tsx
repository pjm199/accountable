import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSaveActivity } from "../../hooks/activities";
import { errorMessage } from "../../lib/api";
import { isoDateTime } from "../../lib/format";
import type { ActivityType, TimelineActivity } from "../../lib/types";
import { Dialog, DialogActions } from "../Dialog";
import { Field } from "./Field";
import { activitySchema, blank, type ActivityValues } from "./schemas";
import "./forms.css";

const TYPES: { id: ActivityType; label: string }[] = [
  { id: "note", label: "Note" },
  { id: "call", label: "Call" },
  { id: "email", label: "Email" },
];

interface Props {
  /** The contact or deal it's logged on. */
  on: { contact_id: number } | { deal_id: number };
  activity?: TimelineActivity;
  onClose: () => void;
}

/** Log or edit an activity: type, description, when, follow-up date, and on
 * edit a "Done" box (R25). */
export function ActivityFormDialog({ on, activity, onClose }: Props) {
  const save = useSaveActivity();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ActivityValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: activity?.type ?? "note",
      description: activity?.description ?? "",
      happened_at: activity ? activity.at.slice(0, 16) : isoDateTime(new Date()),
      follow_up_date: activity?.follow_up_date ?? "",
      done: activity?.done ?? false,
    },
  });
  const errors = formState.errors;
  const target = activity
    ? { contact_id: activity.contact_id, deal_id: activity.deal_id }
    : { contact_id: "contact_id" in on ? on.contact_id : null, deal_id: "deal_id" in on ? on.deal_id : null };

  const submit = handleSubmit((values) => {
    setServerError(null);
    const data = {
      type: values.type,
      description: values.description.trim(),
      happened_at: values.happened_at,
      follow_up_date: blank(values.follow_up_date),
      done: values.done,
      ...target,
    };
    save.mutate({ id: activity?.id, data }, { onSuccess: onClose, onError: (e) => setServerError(errorMessage(e)) });
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title={activity ? "Edit activity" : "Log activity"}>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field id="activity-type" label="Type" required error={errors.type?.message}>
            <select id="activity-type" className="input" {...register("type")}>
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="activity-when" label="When" required error={errors.happened_at?.message}>
            <input id="activity-when" type="datetime-local" className="input" aria-invalid={!!errors.happened_at} {...register("happened_at")} />
          </Field>
          <div className="wide">
            <Field id="activity-description" label="Description" required error={errors.description?.message}>
              <textarea id="activity-description" className="input" rows={3} aria-invalid={!!errors.description} {...register("description")} autoFocus />
            </Field>
          </div>
          <Field id="activity-follow-up" label="Follow-up date" hint="Optional. Shows on the dashboard until it's done.">
            <input id="activity-follow-up" type="date" className="input" {...register("follow_up_date")} />
          </Field>
          {activity && (
            <div className="field" style={{ justifyContent: "center" }}>
              <label className="checkbox">
                <input type="checkbox" {...register("done")} />
                Done
              </label>
            </div>
          )}
        </div>
        {serverError && <p className="form-error" role="alert">{serverError}</p>}
        <DialogActions>
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={save.isPending}>
            {activity ? "Save changes" : "Log activity"}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
