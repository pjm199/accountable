import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { OrganizationDetail, OrganizationInput, OrganizationRow } from "../lib/types";
import { useSaved } from "./useSaved";

export const useOrganizations = () =>
  useQuery({ queryKey: ["organizations"], queryFn: () => api.get<OrganizationRow[]>("/organizations") });

export const useOrganization = (id: number) =>
  useQuery({ queryKey: ["organizations", id], queryFn: () => api.get<OrganizationDetail>(`/organizations/${id}`) });

export const useSaveOrganization = () =>
  useSaved(({ id, data }: { id?: number; data: OrganizationInput }) =>
    id ? api.put<OrganizationDetail>(`/organizations/${id}`, data) : api.post<OrganizationDetail>("/organizations", data),
  );
