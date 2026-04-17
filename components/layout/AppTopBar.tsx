"use client";

/**
 * 右上「店舗選択」ドロップダウンのトリガー（TwinCoach 共通トップバー）
 * RoleBasedShell 内で描画。試験用は TrialStoreProvider 経由の店舗名を表示。
 */
import { useEffect, useRef, useState } from "react";
import { useTrialStore } from "@/components/store/TrialStoreProvider";
import { LogoutButton } from "@/components/LogoutButton";

export function AppTopBar() {
  const { stores, selectedId, selectedStore, setSelectedId } = useTrialStore();
  const [open, setOpen] = useState(false);
  const storeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointerDown = (e: PointerEvent) => {
      const root = storeMenuRef.current;
      if (root && !root.contains(e.target as Node)) {
        close();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-full items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">TwinCoach</div>
          <div className="text-xs text-slate-500">店舗切替（試験）</div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div ref={storeMenuRef} className="relative">
            <button
              type="button"
              data-twin-topbar-store-trigger
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="listbox"
              className={`group flex min-h-[44px] min-w-[9rem] sm:min-w-[10rem] items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 text-left text-sm font-semibold shadow-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${
                open
                  ? "border-slate-400 bg-slate-100 text-slate-950 shadow-md ring-1 ring-slate-300/90"
                  : "border-slate-300 text-slate-900 hover:border-slate-400 hover:bg-slate-200 hover:text-slate-950 hover:shadow-md active:bg-slate-200"
              }`}
            >
              <span className="truncate">{selectedStore.name}</span>
              <span
                className={`shrink-0 transition-colors duration-200 ${
                  open ? "text-slate-800" : "text-slate-600 group-hover:text-slate-900"
                }`}
                aria-hidden
              >
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
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
