import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { applyMove } from "../lib/move";
import type { Deal, DealDetail, DealInput, Stage } from "../lib/types";
import { useSaved } from "./useSaved";

export const DEALS_KEY = ["deals"];

export const useDeals = () => useQuery({ queryKey: DEALS_KEY, queryFn: () => api.get<Deal[]>("/deals") });

export const useDeal = (id: number) =>
  useQuery({ queryKey: ["deals", id], queryFn: () => api.get<DealDetail>(`/deals/${id}`) });

export const useSaveDeal = () =>
  useSaved(({ id, data }: { id?: number; data: DealInput }) =>
    id ? api.put<DealDetail>(`/deals/${id}`, data) : api.post<DealDetail>("/deals", data),
  );

interface MoveVars {
  id: number;
  stage: Stage;
  index: number;
}

/** Moves a card. The cached board changes at once, in the same frame as the
 * drop, and goes back with a message if the server refuses (R29). */
export function useMoveDeal(onRefused: (message: string) => void) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, stage, index }: MoveVars) => api.post<Deal>(`/deals/${id}/move`, { stage, index }),
    onSettled: () => queryClient.invalidateQueries(),
  });
  return (vars: MoveVars) => {
    const before = queryClient.getQueryData<Deal[]>(DEALS_KEY);
    if (before) queryClient.setQueryData<Deal[]>(DEALS_KEY, applyMove(before, vars.id, vars.stage, vars.index));
    void queryClient.cancelQueries({ queryKey: DEALS_KEY, exact: true });
    mutation.mutate(vars, {
      onError: (error) => {
        if (before) queryClient.setQueryData(DEALS_KEY, before);
        onRefused(`The card was put back. ${error instanceof Error ? error.message : ""}`.trim());
      },
    });
  };
}
