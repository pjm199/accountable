import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { DeleteImpact, DeleteKind } from "../lib/types";

export const useDeleteImpact = (kind: DeleteKind, id: number | null) =>
  useQuery({
    queryKey: ["delete-impact", kind, id],
    queryFn: () => api.get<DeleteImpact>(`/delete-impact/${kind}/${id}`),
    enabled: id !== null,
    staleTime: 0,
    gcTime: 0,
  });

/** Deletes a record, then refreshes everything except the deleted record's own
 * page and delete counts, which would only answer "not found". They are left
 * as they are until the screen showing them closes. */
export function useDeleteRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id }: { kind: DeleteKind; id: number }) => api.delete(`/${kind}/${id}`),
    onSuccess: (_data, { kind, id }) => {
      const gone = (key: readonly unknown[]) =>
        (key[0] === kind && key[1] === id) || key[0] === "delete-impact";
      // Not awaited, so the caller can leave the deleted record's page first.
      void queryClient.invalidateQueries({ predicate: (q) => !gone(q.queryKey) });
    },
  });
}
