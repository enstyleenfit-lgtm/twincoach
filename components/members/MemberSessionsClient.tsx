"use client";

import { useEffect, useMemo, useState } from "react";
import { Session } from "@/types";
import { getSessionsForMemberName, loadImportedSessions } from "@/lib/importStore";

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("ja-JP");
}

export function MemberSessionsClient({ memberName }: { memberName: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    // localStorageベース。会員名で紐付け（PoC）
    try {
      setSessions(getSessionsForMemberName(memberName));
    } catch {
      // 念のためフォールバック
      const all = loadImportedSessions();
      setSessions(all.filter((s) => (s.memberName || "").trim() === memberName.trim()));
    }
  }, [memberName]);

  const latest = useMemo(() => {
    return [...sessions]
      .sort((a, b) => (b.sessionDate || "").localeCompare(a.sessionDate || ""))
      .slice(0, 5);
  }, [sessions]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-2">過去5回セッション</h2>
      <p className="text-zinc-400 text-xs mb-4">
        /import で取り込んだセッション履歴を表示します（新しい順・最大5件）
      </p>

      {latest.length === 0 ? (
        <p className="text-zinc-400 text-sm">セッション履歴がありません</p>
      ) : (
        <div className="space-y-3">
          {latest.map((s) => (
            <div
              key={s.id}
              className="bg-zinc-950 border border-zinc-800 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0">
                  <div className="text-white font-semibold">
                    {formatDate(s.sessionDate)}
                  </div>
                  <div className="text-zinc-500 text-xs truncate">
                    {s.storeName} / {s.trainerName}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-zinc-400 text-xs font-semibold mb-1">
                    メニュー要約
                  </div>
                  <div className="text-zinc-200 text-sm whitespace-pre-wrap">
                    {s.menuSummary || "-"}
                  </div>
                </div>

                <div>
                  <div className="text-zinc-400 text-xs font-semibold mb-1">
                    会話要約
                  </div>
                  <div className="text-zinc-200 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
                    {s.conversationSummary || "-"}
                  </div>
                </div>

                <div>
                  <div className="text-zinc-400 text-xs font-semibold mb-1">
                    次回アクション
                  </div>
                  <div className="text-zinc-200 text-sm whitespace-pre-wrap">
                    {s.nextAction || "-"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


