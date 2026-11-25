import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Deal } from "../lib/types";
import { DealFormDialog, type DealDefaults } from "./forms/DealForm";

type Open = (options?: { deal?: Deal; defaults?: DealDefaults }) => void;
const DealFormContext = createContext<Open>(() => {});

/** One deal form for the whole app, so the top bar, the pipeline columns and
 * the deals table all open the same dialog (R30, concern 13). */
export function DealFormProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ deal?: Deal; defaults?: DealDefaults; key: number } | null>(null);
  const open = useCallback<Open>((options = {}) => setState({ ...options, key: Date.now() }), []);
  return (
    <DealFormContext.Provider value={open}>
      {children}
      {state && <DealFormDialog key={state.key} deal={state.deal} defaults={state.defaults} onClose={() => setState(null)} />}
    </DealFormContext.Provider>
  );
}

export const useDealForm = () => useContext(DealFormContext);
