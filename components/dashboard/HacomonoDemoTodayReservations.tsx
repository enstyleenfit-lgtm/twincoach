"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ExpandableSection } from "@/components/ui/ExpandableSection";
import { useTrialStore } from "@/components/store/TrialStoreProvider";
import {
  getHacomonoDemoReservationsForStore,
  resolveHacomonoDemoPattern,
  type HacomonoDemoPatternId,
} from "@/lib/demo/hacomonoReservations";

const PATTERN_LABEL: Record<HacomonoDemoPatternId, string> = {
  A: "通常日",
  B: "混雑日",
  C: "穴あき日",
};
import { memberDetailHref } from "@/lib/routeContext";

function formatYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function statusBadgeClass(status: string): string {
  if (status === "仮予約") {
    return "text-amber-800 bg-amber-400/15 border-amber-500/30";
  }
  if (status === "キャンセル") {
    return "text-slate-500 bg-slate-200/60 border-slate-300/80";
  }
  return "text-emerald-800 bg-emerald-400/12 border-emerald-500/25";
}

function HacomonoDemoTodayReservationsInner() {
  const searchParams = useSearchParams();
  const { selectedId, selectedStore } = useTrialStore();
  const today = useMemo(() => formatYmdLocal(new Date()), []);

  const rawOverride = searchParams.get("hacomonoDemo");
  const queryOverride: HacomonoDemoPatternId | null =
    rawOverride === "A" || rawOverride === "B" || rawOverride === "C"
      ? rawOverride
      : null;

  const pattern = resolveHacomonoDemoPattern(selectedId, queryOverride);
  const rows = useMemo(
    () => getHacomonoDemoReservationsForStore(selectedId, today, pattern),
    [selectedId, today, pattern]
  );

  const count = rows.length;
  const summary = `${count}件`;

  return (
    <ExpandableSection title="本日の予約" summary={summary} defaultOpen={false}>
      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed px-0.5">
        <span className="font-medium text-slate-600">hacomono予約連携</span>
        ・表示店舗: {selectedStore.name}・{PATTERN_LABEL[pattern]}（シナリオ {pattern}
        {queryOverride ? "・URL指定" : ""}）
      </p>
      {count > 0 ? (
        <div className="space-y-2.5">
          {rows.map((r) => {
            const timeLabel = `${r.startTime}–${r.endTime}`;
            const muted = r.status === "キャンセル";
            return (
              <div
                key={r.id}
                className={`rounded-lg border border-slate-200 bg-slate-100/90 px-3.5 py-3 ${
                  muted ? "opacity-75" : ""
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 gap-y-1">
                      <Link
                        href={memberDetailHref("trainer", r.memberId)}
                        className={`text-blue-800 font-semibold underline decoration-blue-400/70 underline-offset-2 hover:text-blue-900 text-sm leading-snug inline-flex min-h-10 items-center py-0.5 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 ${
                          muted ? "line-through decoration-slate-400" : ""
                        }`}
                      >
                        {r.memberName}
                      </Link>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${statusBadgeClass(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p
                      className={`text-slate-700 text-sm mt-1.5 ${
                        muted ? "line-through text-slate-500" : ""
                      }`}
                    >
                      {r.menuType}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      担当: {r.trainerName}
                    </p>
                  </div>
                  <p
                    className={`text-blue-700 font-bold text-sm shrink-0 tabular-nums text-right ${
                      muted ? "text-slate-500 line-through" : ""
                    }`}
                  >
                    {timeLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-slate-600 text-center py-6 md:py-8">
          本日の予約はありません
        </p>
      )}
      <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
        パターンC（穴あき日）を試す場合は URL に{" "}
        <code className="bg-slate-100 px-1 rounded">?hacomonoDemo=C</code>{" "}
        を付けてください（A/B も同様）。
      </p>
    </ExpandableSection>
  );
}

function ReservationsFallback() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden md:p-6">
      <div className="md:hidden px-4 py-3.5 bg-slate-100/90 text-sm font-bold text-slate-700">
        本日の予約（読み込み中…）
      </div>
      <h2 className="hidden md:block text-xl font-bold mb-4">本日の予約</h2>
      <p className="text-slate-500 text-sm px-4 py-4 md:px-0">読み込み中…</p>
    </div>
  );
}

export function HacomonoDemoTodayReservations() {
  return (
    <Suspense fallback={<ReservationsFallback />}>
      <HacomonoDemoTodayReservationsInner />
    </Suspense>
  );
}
