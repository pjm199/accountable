import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Contact, ContactDetail, ContactInput } from "../lib/types";
import { useSaved } from "./useSaved";

export const useContacts = () =>
  useQuery({ queryKey: ["contacts"], queryFn: () => api.get<Contact[]>("/contacts") });

export const useContact = (id: number) =>
  useQuery({ queryKey: ["contacts", id], queryFn: () => api.get<ContactDetail>(`/contacts/${id}`) });

export const useSaveContact = () =>
  useSaved(({ id, data }: { id?: number; data: ContactInput }) =>
    id ? api.put<ContactDetail>(`/contacts/${id}`, data) : api.post<ContactDetail>("/contacts", data),
  );
