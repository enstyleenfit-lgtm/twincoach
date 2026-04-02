"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  TRIAL_STORE_DEFAULT_ID,
  TRIAL_SELECTED_STORE_STORAGE_KEY,
  TRIAL_STORES,
  type TrialStore,
} from "@/lib/trialStore";

type TrialStoreContextValue = {
  stores: TrialStore[];
  selectedId: string;
  selectedStore: TrialStore;
  setSelectedId: (id: string) => void;
};

const TrialStoreContext = createContext<TrialStoreContextValue | null>(null);

export function TrialStoreProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedIdState] = useState<string>(TRIAL_STORE_DEFAULT_ID);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TRIAL_SELECTED_STORE_STORAGE_KEY);
      if (raw && TRIAL_STORES.some((s) => s.id === raw)) {
        setSelectedIdState(raw);
      }
    } catch {
      // noop
    }
  }, []);

  const setSelectedId = useCallback((id: string) => {
    if (!TRIAL_STORES.some((s) => s.id === id)) return;
    setSelectedIdState(id);
    try {
      window.localStorage.setItem(TRIAL_SELECTED_STORE_STORAGE_KEY, id);
    } catch {
      // noop
    }
  }, []);

  const selectedStore = useMemo(() => {
    return TRIAL_STORES.find((s) => s.id === selectedId) ?? TRIAL_STORES[0];
  }, [selectedId]);

  const value = useMemo<TrialStoreContextValue>(
    () => ({
      stores: TRIAL_STORES,
      selectedId,
      selectedStore,
      setSelectedId,
    }),
    [selectedId, selectedStore, setSelectedId]
  );

  return <TrialStoreContext.Provider value={value}>{children}</TrialStoreContext.Provider>;
}

export function useTrialStore(): TrialStoreContextValue {
  const ctx = useContext(TrialStoreContext);
  if (!ctx) {
    throw new Error("useTrialStore must be used within TrialStoreProvider");
  }
  return ctx;
}
