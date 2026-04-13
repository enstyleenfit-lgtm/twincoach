"use client";

import { useState } from "react";
import Link from "next/link";

export type TrainerPriorityQueueRow = {
  id: string;
  name: string;
  probability30Days: number;
  reasonTags: string[];
  suggestedAction: string;
  priority: "low" | "medium" | "high";
};

function priorityBadgeClass(p: TrainerPriorityQueueRow["priority"]): string {
  switch (p) {
    case "high":
      return "text-red-600 bg-red-400/10 border-red-400/25";
    case "medium":
      return "text-orange-700 bg-orange-400/10 border-orange-400/25";
    default:
      return "text-slate-600 bg-slate-100 border-slate-200";
  }
}

function priorityLabel(p: TrainerPriorityQueueRow["priority"]): string {
  if (p === "high") return "高";
  if (p === "medium") return "中";
  return "低";
}

/**
 * 店舗ダッシュボード（トレーナー）用・lg 未満のみ表示。
 * 「今日の優先対応」をタップで開閉（初期は閉じる）。
 */
export function TrainerPriorityQueueMobile({ rows }: { rows: TrainerPriorityQueueRow[] }) {
  const [open, setOpen] = useState(false);
  const count = rows.length;

  return (
    <div className="mb-6 lg:mb-8 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden lg:hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 min-h-[3.25rem] text-left bg-slate-100/90 hover:bg-slate-100 active:bg-slate-200/90 transition-colors border-b border-slate-200/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:ring-inset"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-[15px] font-bold text-slate-900 leading-snug min-w-0">
          今日の優先対応
          <span className="text-slate-600 font-semibold">（{count}件）</span>
        </span>
        <span
          className="text-slate-500 text-sm font-medium w-7 text-center shrink-0"
          aria-hidden
        >
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open ? (
        <div className="px-3 py-3 space-y-3 bg-white">
          {count === 0 ? (
            <p className="text-slate-600 text-sm text-center py-4">
              優先対応の対象会員はいません
            </p>
          ) : (
            rows.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5"
              >
                <Link
                  href={`/members/${item.id}`}
                  className="text-slate-900 font-semibold text-sm hover:text-blue-700 inline-flex min-h-10 items-center"
                >
                  {item.name}
                </Link>

                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    優先理由
                  </p>
                  <p className="text-xs text-slate-600">
                    30日退会リスク（推定）{" "}
                    <span className="text-red-600 font-bold tabular-nums">
                      {item.probability30Days}%
                    </span>
                  </p>
                  {item.reasonTags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.reasonTags.map((t) => (
                        <span
                          key={t}
                          className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    対応内容
                  </p>
                  <p className="text-sm text-slate-800 leading-snug">{item.suggestedAction}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="text-[11px] font-semibold text-slate-500">優先度</span>
                  <span
                    className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${priorityBadgeClass(
                      item.priority
                    )}`}
                  >
                    {priorityLabel(item.priority)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
