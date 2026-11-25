import { api } from "../lib/api";
import type { Activity, ActivityInput } from "../lib/types";
import { useSaved } from "./useSaved";

export const useSaveActivity = () =>
  useSaved(({ id, data }: { id?: number; data: ActivityInput }) =>
    id ? api.put<Activity>(`/activities/${id}`, data) : api.post<Activity>("/activities", data),
  );

export const useMarkDone = () => useSaved((id: number) => api.post<Activity>(`/activities/${id}/done`));

export const useDeleteActivity = () => useSaved((id: number) => api.delete(`/activities/${id}`));
