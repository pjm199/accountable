import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Dashboard } from "../lib/types";

// Worked out again on every visit, so it reflects the latest change (R40).
export const useDashboard = () =>
  useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<Dashboard>("/dashboard"), staleTime: 0 });
