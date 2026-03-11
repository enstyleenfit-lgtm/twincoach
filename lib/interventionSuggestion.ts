import { Member } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";

export interface InterventionSuggestion {
  type: "reservation" | "motivation" | "lifestyle";
  title: string;
  action: string;
  priority: "low" | "medium" | "high";
}

/**
 * 日付文字列から現在日までの日数を計算
 */
function getDaysSince(dateString: string): number {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - date.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 来店間隔文字列（例: "3 days"）から日数を抽出
 */
function parseVisitInterval(visitInterval: string): number {
  const match = visitInterval.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
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
  const visitIntervalDays = parseVisitInterval(member.visitInterval);
  const daysSinceJoin = getDaysSince(member.joinDate);
  const daysSinceLastVisit = getDaysSince(member.lastVisitDate);

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

