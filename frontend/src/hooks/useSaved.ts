import { useMutation, useQueryClient, type MutationFunction } from "@tanstack/react-query";

/** A mutation that refreshes every list and page once it succeeds, so each
 * screen shows the change without a refresh (R20). */
export function useSaved<TData, TVars>(fn: MutationFunction<TData, TVars>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
