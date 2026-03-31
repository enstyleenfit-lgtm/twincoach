"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type ContractStatus = "active" | "trial" | "inactive" | "suspended";
type MembershipRole = "trainer" | "owner" | "hq" | "staff";

type StoreRow = {
  membershipId: string;
  role: MembershipRole;
  store: { id: string; name: string; contractStatus: ContractStatus };
};

type CurrentStore = {
  storeId: string | null;
  storeName?: string;
  contractStatus?: ContractStatus;
  role?: MembershipRole;
};

function statusBadgeClass(s: ContractStatus | undefined) {
  if (s === "active") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (s === "trial") return "border-sky-200 bg-sky-50 text-sky-800";
  if (s === "inactive") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-red-200 bg-red-50 text-red-800";
}

export function AppTopBar() {
  const router = useRouter();
  const pathname = usePathname();

  const [stores, setStores] = useState<StoreRow[]>([]);
  const [current, setCurrent] = useState<CurrentStore>({ storeId: null });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentRow = useMemo(
    () => (current.storeId ? stores.find((s) => s.store.id === current.storeId) ?? null : null),
    [stores, current.storeId]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sRes, cRes] = await Promise.all([fetch("/api/stores"), fetch("/api/current-store")]);
        if (!sRes.ok || !cRes.ok) return;
        const sJson = (await sRes.json()) as StoreRow[];
        const cJson = (await cRes.json()) as CurrentStore;
        if (cancelled) return;
        setStores(Array.isArray(sJson) ? sJson : []);
        setCurrent(cJson ?? { storeId: null });
      } catch {
        // noop
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const switchStore = async (storeId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/current-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as CurrentStore;
      setCurrent(json ?? { storeId });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const displayName =
    currentRow?.store.name ??
    current.storeName ??
    (stores.length === 1 ? stores[0].store.name : "店舗未選択");
  const displayStatus = currentRow?.store.contractStatus ?? current.contractStatus;
  const isLocked = displayStatus === "inactive" || displayStatus === "suspended";

  return (
    <div className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-full items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">TwinCoach</div>
          <div className="text-xs text-slate-500">店舗切替</div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={loading || stores.length === 0}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="max-w-[14rem] truncate">{displayName}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusBadgeClass(displayStatus)}`}>
              {displayStatus ?? "—"}
            </span>
            <span className="text-slate-400">▾</span>
          </button>

          {open ? (
            <div className="absolute right-0 z-50 mt-2 w-[min(22rem,90vw)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
              <div className="max-h-[60vh] overflow-y-auto p-1">
                {stores.map((s) => {
                  const active = s.store.id === current.storeId;
                  return (
                    <button
                      key={s.store.id}
                      type="button"
                      onClick={() => switchStore(s.store.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                        active
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{s.store.name}</div>
                          <div className="text-[11px] text-slate-500">role: {s.role}</div>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${statusBadgeClass(s.store.contractStatus)}`}>
                          {s.store.contractStatus}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {isLocked ? (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          この店舗は現在未契約です。契約すると会員ログ、継続率分析、食事管理が利用できます。
        </div>
      ) : null}
    </div>
  );
}

