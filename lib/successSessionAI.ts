import { estimateChurnReasons } from "@/lib/churnReasonAI";
import { sessionWithConversationTags } from "@/lib/conversationTagAI";
import { estimateMemberLTV, getLTVLevel } from "@/lib/ltvPrediction";
import { generateNextActions } from "@/lib/nextActionAI";
import { calculateRiskScore } from "@/lib/riskScore";
import { getChurnPrediction } from "@/lib/churnPrediction";
import type {
  HighPerformingSessionTrait,
  Member,
  Session,
  SuccessSessionAnalysis,
  SuccessSessionPattern,
} from "@/types";

function parseVisitInterval(visitInterval: string): number {
  const match = (visitInterval || "").match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function impactFromRatio(ratio: number, base: number): number {
  return Math.max(40, Math.min(95, Math.round(base + ratio * 45)));
}

export function analyzeSuccessfulSessions(
  members: Member[],
  sessions: Session[] = []
): SuccessSessionAnalysis {
  if (members.length === 0) {
    return {
      commonPatterns: [],
      highPerformingSessionTraits: [],
      recommendedActions: [],
    };
  }

  const successfulMembers = members.filter((member) => {
    const risk = calculateRiskScore(member);
    const churn = getChurnPrediction(member);
    const ltv = estimateMemberLTV(member);
    const ltvLevel = getLTVLevel(ltv.riskAdjustedLTV);
    return risk.level === "low" || churn.label30Days === "low" || ltvLevel === "high";
  });

  const targetMembers = successfulMembers.length > 0 ? successfulMembers : members;
  const targetMemberNames = new Set(targetMembers.map((m) => m.name));
  const targetSessions = sessions
    .filter((s) => targetMemberNames.has((s.memberName || "").trim()))
    .map(sessionWithConversationTags);

  const commonPatterns: SuccessSessionPattern[] = [];
  const highPerformingSessionTraits: HighPerformingSessionTrait[] = [];

  const weeklyVisitMembers = targetMembers.filter((m) => {
    const days = parseVisitInterval(m.visitInterval);
    return days > 0 && days <= 7;
  }).length;
  if (weeklyVisitMembers > 0) {
    const ratio = weeklyVisitMembers / targetMembers.length;
    commonPatterns.push({
      title: "週1回来店の維持",
      description: "継続会員で来店頻度が安定しているパターンです。",
      impactScore: impactFromRatio(ratio, 58),
    });
  }

  const reservationActionCount = targetSessions.filter((s) =>
    /(予約|次回|確定|リマインド)/.test(`${s.nextAction} ${s.conversationSummary}`)
  ).length;
  if (reservationActionCount > 0) {
    const ratio = reservationActionCount / Math.max(1, targetSessions.length);
    commonPatterns.push({
      title: "次回予約をその場で確定",
      description: "成功セッションで次回予約取得を明示している割合が高いです。",
      impactScore: impactFromRatio(ratio, 55),
    });
  }

  const tagCounts = new Map<string, number>();
  for (const session of targetSessions) {
    for (const tag of session.tags ?? []) {
      tagCounts.set(tag.tag, (tagCounts.get(tag.tag) ?? 0) + 1);
    }
  }
  const topTag = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topTag) {
    commonPatterns.push({
      title: `${topTag[0]}の定期ヒアリング`,
      description: "会話タグの継続的なフォローが、離脱予防に寄与している可能性があります。",
      impactScore: impactFromRatio(topTag[1] / Math.max(1, targetSessions.length), 52),
    });
  }

  const menuSupportCount = targetSessions.filter((s) =>
    /(フォーム|軽め|調整|姿勢|可動域)/.test(s.menuSummary || "")
  ).length;
  if (menuSupportCount > 0) {
    commonPatterns.push({
      title: "状態に合わせたメニュー調整",
      description: "会員状態に合わせた負荷調整メニューが多く見られます。",
      impactScore: impactFromRatio(menuSupportCount / Math.max(1, targetSessions.length), 50),
    });
  }

  const actionTraitCounts = new Map<string, { trait: string; description: string; count: number }>();
  for (const member of targetMembers) {
    const reasons = estimateChurnReasons(member, targetSessions);
    const nextActions = generateNextActions(member, targetSessions, reasons);
    for (const action of nextActions.actions.slice(0, 2)) {
      const key = action.title;
      const prev = actionTraitCounts.get(key);
      if (prev) {
        prev.count += 1;
      } else {
        actionTraitCounts.set(key, {
          trait: action.title,
          description: `成功会員で再現性が高い対応（${action.type}）`,
          count: 1,
        });
      }
    }
  }
  highPerformingSessionTraits.push(
    ...Array.from(actionTraitCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((x) => ({ trait: x.trait, description: x.description }))
  );

  if (highPerformingSessionTraits.length === 0) {
    highPerformingSessionTraits.push({
      trait: "次回アクションの明確化",
      description: "セッション後に1つの実行項目を決める運用が有効です。",
    });
  }

  const sortedPatterns = commonPatterns
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 3);

  const recommendedActions = [
    sortedPatterns[0]?.title ? `「${sortedPatterns[0].title}」を標準手順に追加` : null,
    highPerformingSessionTraits[0]?.trait
      ? `「${highPerformingSessionTraits[0].trait}」を担当者間でロールプレイ`
      : null,
    "セッション記録に会話タグと次回アクションを必ず残す",
  ].filter((v): v is string => Boolean(v));

  return {
    commonPatterns: sortedPatterns,
    highPerformingSessionTraits: highPerformingSessionTraits.slice(0, 3),
    recommendedActions,
  };
}
