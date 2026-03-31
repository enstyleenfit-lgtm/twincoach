"use client";

import { useEffect, useState } from "react";
import {
  MEMBER_NEXT_ACTION_STORAGE_KEY,
  readStoredNextActionSuggestion,
} from "@/lib/memberNextActionStorage";
import type { NextActionSuggestion } from "@/types";

function formatUpdatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type Props = {
  memberId: string;
  fallbackSuggestion: NextActionSuggestion;
};

export function MemberNextActionsClient({ memberId, fallbackSuggestion }: Props) {
  const [stored, setStored] = useState<{
    suggestion: NextActionSuggestion;
    updatedAt: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => {
      setStored(readStoredNextActionSuggestion(memberId));
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === MEMBER_NEXT_ACTION_STORAGE_KEY) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [memberId]);

  const nextActions = stored?.suggestion ?? fallbackSuggestion;
  const fromSessionInput = Boolean(stored);

  const priority: "high" | "medium" | "low" =
    nextActions?.priority === "high" ||
    nextActions?.priority === "medium" ||
    nextActions?.priority === "low"
      ? nextActions.priority
      : "low";
  const actions = Array.isArray(nextActions?.actions) ? nextActions.actions : [];

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 mb-8">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h2 className="text-xl font-semibold">次回提案AI</h2>
        {fromSessionInput ? (
          <span className="inline-flex items-center rounded-md border border-emerald-500/35 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-800">
            最新セッションをもとに更新済み
          </span>
        ) : null}
      </div>
      <p className="text-slate-600 text-xs mb-4">
        退会理由AIと会員状態をもとに、次回セッションで実行すべき具体アクションを提案します
      </p>
      {fromSessionInput && stored ? (
        <p className="text-slate-500 text-[11px] mb-3">更新: {formatUpdatedAt(stored.updatedAt)}</p>
      ) : null}
      <div className="mb-3">
        <span className="text-slate-600 text-sm">優先度: </span>
        <span
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${
            priority === "high"
              ? "text-red-700 bg-red-400/10 border-red-400/25"
              : priority === "medium"
                ? "text-yellow-300 bg-yellow-400/10 border-yellow-400/25"
                : "border-slate-200/80 bg-slate-100 text-slate-700"
          }`}
        >
          {priority.toUpperCase()}
        </span>
      </div>
      <div className="space-y-2">
        {actions.map((action, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs">{action.type}</span>
              <span className="text-slate-900 text-sm font-medium">{action.title}</span>
            </div>
            <p className="mt-1 text-slate-600 text-xs">{action.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
