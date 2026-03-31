"use client";

import { useEffect, useState } from "react";
import { sessionWithConversationTags } from "@/lib/conversationTagAI";
import { analyzeSuccessfulSessions } from "@/lib/successSessionAI";
import { getSessionsForMemberName } from "@/lib/importStore";
import type { Member, SuccessSessionAnalysis } from "@/types";

type Props = {
  member: Member;
};

export function MemberSuccessSessionInsight({ member }: Props) {
  const [insight, setInsight] = useState<SuccessSessionAnalysis>(() =>
    analyzeSuccessfulSessions([member], [])
  );
  const [sessionNote, setSessionNote] = useState(false);

  useEffect(() => {
    const sessions = getSessionsForMemberName(member.name).map(sessionWithConversationTags);
    setSessionNote(sessions.length > 0);
    setInsight(analyzeSuccessfulSessions([member], sessions));
  }, [member]);

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-2">成功セッション観点</h2>
      <p className="text-slate-600 text-xs mb-4">
        継続につながる成功パターンの観点から、今回セッションで意識したいポイントです
        {sessionNote ? (
          <span className="block mt-1 text-emerald-500/90">
            取り込みセッション履歴を反映しています
          </span>
        ) : null}
      </p>
      {insight.commonPatterns.length === 0 ? (
        <p className="text-slate-500 text-sm">分析データが不足しています</p>
      ) : (
        <div className="space-y-2">
          {insight.commonPatterns.slice(0, 2).map((pattern) => (
            <div key={pattern.title} className="bg-slate-50 border border-green-500/25 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-900 text-sm font-medium">{pattern.title}</span>
                <span className="text-green-300 text-xs font-semibold">{pattern.impactScore}</span>
              </div>
              <p className="mt-1 text-slate-600 text-xs">{pattern.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
