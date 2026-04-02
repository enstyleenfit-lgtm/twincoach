"use client";

import { useState } from "react";
import { useTrialStore } from "@/components/store/TrialStoreProvider";

export function AppTopBar() {
  const { stores, selectedId, selectedStore, setSelectedId } = useTrialStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-full items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">TwinCoach</div>
          <div className="text-xs text-slate-500">店舗切替（試験）</div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="listbox"
            className="flex min-h-[44px] min-w-[10rem] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-900 shadow-sm transition-colors duration-200 hover:bg-slate-200 hover:border-slate-300"
          >
            <span className="truncate">{selectedStore.name}</span>
            <span className="shrink-0 text-slate-500" aria-hidden>
              ▼
            </span>
          </button>

          {open ? (
            <div
              className="absolute right-0 z-50 mt-2 w-[min(16rem,90vw)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10"
              role="listbox"
            >
              <ul className="max-h-[40vh] overflow-y-auto p-1">
                {stores.map((s) => {
                  const active = s.id === selectedId;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setSelectedId(s.id);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-200 ${
                          active
                            ? "bg-slate-200 text-slate-900"
                            : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                        }`}
                      >
                        <span>{s.name}</span>
                        {active ? (
                          <span className="text-xs text-slate-600" aria-hidden>
                            ✓
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
