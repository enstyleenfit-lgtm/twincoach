import { Member } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";
import { getDaysSinceDate, parseVisitIntervalDays } from "@/lib/memberDateUtils";

export interface InterventionSuggestion {
  type: "reservation" | "motivation" | "lifestyle";
  title: string;
  action: string;
  priority: "low" | "medium" | "high";
}

/**
 * 会員の状態に応じて推奨介入を提案
 * @param member 会員情報
 * @returns 介入提案
 */
export function getInterventionSuggestion(
  member: Member
): InterventionSuggestion {
  const riskResult = calculateRiskScore(member);
  const visitIntervalDays = parseVisitIntervalDays(member.visitInterval);
  const daysSinceJoin = getDaysSinceDate(member.joinDate);
  const daysSinceLastVisit = getDaysSinceDate(member.lastVisitDate);

  // ① 予約型
  // 条件: visitIntervalが15日以上 または hasCancellationHistoryがtrue
  if (visitIntervalDays >= 15 || member.hasCancellationHistory) {
    return {
      type: "reservation",
      title: "予約サポートが必要",
      action: "別の時間帯や店舗を提案する",
      priority: "high",
    };
  }

  // ② モチベーション型
  // 条件: riskScoreが50以上 かつ visitIntervalが8〜14日 かつ入会後90日以内
  if (
    riskResult.score >= 50 &&
    visitIntervalDays >= 8 &&
    visitIntervalDays <= 14 &&
    daysSinceJoin <= 90
  ) {
    return {
      type: "motivation",
      title: "モチベーション低下",
      action: "目標を見直し、進捗を可視化し、短期成果を強化する",
      priority: "medium",
    };
  }

  // ③ 生活変化型
  // 条件: lastVisitDateから22日以上経過 または joinDateから時間が経っていて来店が途切れている
  const hasLongGapSinceLastVisit = daysSinceLastVisit >= 22;
  const hasLongGapSinceJoin = daysSinceJoin > 180 && visitIntervalDays >= 15;
  
  if (hasLongGapSinceLastVisit || hasLongGapSinceJoin) {
    return {
      type: "lifestyle",
      title: "生活リズム変化",
      action: "軽いスケジュールや固定の週次ルーティンを提案する",
      priority: "high",
    };
  }

  // ④ デフォルト
  return {
    type: "motivation",
    title: "状況確認推奨",
    action: "確認メッセージを送信し、次の予約を確認する",
    priority: "low",
  };
}

