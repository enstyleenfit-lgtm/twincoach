import { Member } from "@/types";
import { getDaysSinceDate, parseVisitIntervalDays } from "@/lib/memberDateUtils";

export interface RiskScoreResult {
  score: number;
  level: "low" | "medium" | "high";
}

/**
 * 会員の退会リスク理由（Explainable AI）
 * @param member 会員情報
 * @returns リスク理由の配列
 */
export function getRiskReasons(member: Member): string[] {
  const reasons: string[] = [];

  // ① 来店間隔
  const visitIntervalDays = parseVisitIntervalDays(member.visitInterval);
  if (visitIntervalDays >= 15) {
    reasons.push("来店間隔が長くなっています");
  }

  // ② 最終来店
  const daysSinceLastVisit = getDaysSinceDate(member.lastVisitDate);
  if (daysSinceLastVisit >= 14) {
    reasons.push("最終来店から日数が経過しています");
  }

  // ③ 入会期間
  const daysSinceJoin = getDaysSinceDate(member.joinDate);
  if (daysSinceJoin <= 90) {
    reasons.push("入会から90日以内の重要期間です");
  }

  // ④ キャンセル履歴
  if (member.hasCancellationHistory) {
    reasons.push("キャンセル履歴があります");
  }

  return reasons;
}

/**
 * 来店間隔によるスコア加算
 * 0〜7日 → +0
 * 8〜14日 → +20
 * 15〜21日 → +40
 * 22日以上 → +60
 */
function calculateVisitIntervalScore(visitInterval: string | undefined): number {
  const days = parseVisitIntervalDays(visitInterval);
  if (days <= 7) return 0;
  if (days <= 14) return 20;
  if (days <= 21) return 40;
  return 60;
}

/**
 * 入会からの日数によるスコア加算
 * 0〜90日 → +20
 * 91〜180日 → +10
 * 181日以上 → +0
 */
function calculateJoinDateScore(joinDate: string | undefined): number {
  const days = getDaysSinceDate(joinDate);
  if (days <= 90) return 20;
  if (days <= 180) return 10;
  return 0;
}

/**
 * 最終来店からの日数によるスコア加算
 * 0〜7日 → +0
 * 8〜14日 → +10
 * 15〜21日 → +20
 * 22日以上 → +40
 */
function calculateLastVisitScore(lastVisitDate: string | undefined): number {
  const days = getDaysSinceDate(lastVisitDate);
  if (days <= 7) return 0;
  if (days <= 14) return 10;
  if (days <= 21) return 20;
  return 40;
}

/**
 * 会員の退会リスクスコアを計算
 * @param member 会員情報
 * @returns リスクスコアとレベル
 */
export function calculateRiskScore(member: Member): RiskScoreResult {
  let score = 0;

  // ① 来店間隔
  score += calculateVisitIntervalScore(member.visitInterval);

  // ② 入会からの日数
  score += calculateJoinDateScore(member.joinDate);

  // ③ 最終来店からの日数
  score += calculateLastVisitScore(member.lastVisitDate);

  // ④ キャンセル履歴
  if (member.hasCancellationHistory) {
    score += 10;
  }

  // スコアを0〜100の範囲に制限
  score = Math.max(0, Math.min(100, score));

  // レベル判定
  let level: "low" | "medium" | "high";
  if (score <= 39) {
    level = "low";
  } else if (score <= 69) {
    level = "medium";
  } else {
    level = "high";
  }

  return {
    score,
    level,
  };
}

