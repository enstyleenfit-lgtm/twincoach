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
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [selectedId, setSelectedIdState] = useState<string>(TRIAL_STORE_DEFAULT_ID);

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(TRIAL_SELECTED_STORE_STORAGE_KEY);
    } catch {
      // noop
    }
    if (!raw || !TRIAL_STORES.some((s) => s.id === raw)) return;
    const storeId = raw;
    void fetch("/api/current-store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId }),
    }).then((res) => {
      if (!res.ok) return;
      setSelectedIdState(storeId);
      router.refresh();
    }).catch(() => {
      // noop
    });
  }, [router]);

  const setSelectedId = useCallback((id: string) => {
    if (!TRIAL_STORES.some((s) => s.id === id)) return;
    void fetch("/api/current-store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: id }),
    }).then((res) => {
      if (!res.ok) return;
      setSelectedIdState(id);
      try {
        window.localStorage.setItem(TRIAL_SELECTED_STORE_STORAGE_KEY, id);
      } catch {
        // noop
      }
      router.refresh();
    }).catch(() => {
      // noop
    });
  }, [router]);

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
