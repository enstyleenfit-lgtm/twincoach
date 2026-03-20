"use client";

import { useEffect, useMemo, useState } from "react";
import type { ConversationTag, Session } from "@/types";
import {
  conversationTagBadgeClass,
  sessionWithConversationTags,
} from "@/lib/conversationTagAI";
import { getSessionsForMemberName, loadImportedSessions } from "@/lib/importStore";

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("ja-JP");
}

type TagRankRow = { tag: string; category: ConversationTag["category"]; count: number };

function aggregateTagRanking(sessions: Session[], maxItems: number): TagRankRow[] {
  const counts = new Map<string, TagRankRow>();
  for (const s of sessions) {
    const tags = s.tags ?? [];
    for (const t of tags) {
      const prev = counts.get(t.tag);
      if (prev) {
        prev.count += 1;
      } else {
        counts.set(t.tag, { tag: t.tag, category: t.category, count: 1 });
      }
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ja"))
    .slice(0, maxItems);
}

export function MemberSessionsClient({ memberName }: { memberName: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    try {
      setSessions(getSessionsForMemberName(memberName));
    } catch {
      const all = loadImportedSessions();
      setSessions(all.filter((s) => (s.memberName || "").trim() === memberName.trim()));
    }
  }, [memberName]);

  const normalized = useMemo(
    () => sessions.map(sessionWithConversationTags),
    [sessions]
  );

  const latest = useMemo(() => {
    return [...normalized]
      .sort((a, b) => (b.sessionDate || "").localeCompare(a.sessionDate || ""))
      .slice(0, 5);
  }, [normalized]);

  const tagRanking = useMemo(() => aggregateTagRanking(latest, 5), [latest]);

  return (
    <div className="space-y-6 mb-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">過去5回セッション</h2>
        <p className="text-zinc-400 text-xs mb-4">
          /import で取り込んだセッション履歴を表示します（新しい順・最大5件）。会話要約からタグを自動付与します。
        </p>

        {latest.length === 0 ? (
          <p className="text-zinc-400 text-sm">セッション履歴がありません</p>
        ) : (
          <div className="space-y-3">
            {latest.map((s) => {
              const tags = s.tags ?? [];
              return (
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
                      {tags.length > 0 && (
                        <div className="mt-2">
                          <div className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wide mb-1.5">
                            会話タグ
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {tags.map((t) => (
                              <span
                                key={`${s.id}-${t.tag}`}
                                className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium border ${conversationTagBadgeClass(
                                  t.category
                                )}`}
                              >
                                {t.tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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
              );
            })}
          </div>
        )}
      </div>

      {latest.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">最近の会話傾向</h2>
          <p className="text-zinc-400 text-xs mb-4">
            直近5回のセッションに基づくタグの出現回数（多い順・最大5件）
          </p>
          {tagRanking.length === 0 ? (
            <p className="text-zinc-500 text-sm">
              直近5回の会話からタグを検出できませんでした
            </p>
          ) : (
            <ol className="space-y-2">
              {tagRanking.map((row, idx) => (
                <li
                  key={row.tag}
                  className="flex items-center justify-between gap-3 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-zinc-600 text-xs font-mono w-5 shrink-0">
                      {idx + 1}.
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border shrink-0 ${conversationTagBadgeClass(
                        row.category
                      )}`}
                    >
                      {row.tag}
                    </span>
                  </div>
                  <span className="text-zinc-300 text-sm font-semibold tabular-nums shrink-0">
                    ×{row.count}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
