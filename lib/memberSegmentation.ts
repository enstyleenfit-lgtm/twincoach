import { Member } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";
import { getDaysSinceDate, parseVisitIntervalDays } from "@/lib/memberDateUtils";

export type MemberSegment =
  | "short_term_result"
  | "habit_builder"
  | "at_risk_dropout";

export interface MemberSegmentInfo {
  segment: MemberSegment;
  label: string;
  description: string;
}

/**
 * 会員のセグメントを判定
 * @param member 会員情報
 * @returns 会員セグメント
 */
export function getMemberSegment(member: Member): MemberSegment {
  const riskResult = calculateRiskScore(member);
  const daysSinceJoin = getDaysSinceDate(member.joinDate);
  const daysSinceLastVisit = getDaysSinceDate(member.lastVisitDate);
  const visitIntervalDays = parseVisitIntervalDays(member.visitInterval);

  // 1. at_risk_dropout (最優先判定)
  // 条件: lastVisitDateから15日以上 または hasCancellationHistoryがtrue
  if (daysSinceLastVisit >= 15 || member.hasCancellationHistory) {
    return "at_risk_dropout";
  }

  // 2. short_term_result
  // 条件: joinDateから90日以内、riskScoreが50以上、visitIntervalが8〜14日以上
  if (
    daysSinceJoin <= 90 &&
    riskResult.score >= 50 &&
    visitIntervalDays >= 8 &&
    visitIntervalDays <= 14
  ) {
    return "short_term_result";
  }

  // 3. habit_builder
  // 条件: joinDateから90日以上、visitIntervalが7日以内、riskScoreがlowまたはmedium
  if (
    daysSinceJoin > 90 &&
    visitIntervalDays <= 7 &&
    (riskResult.level === "low" || riskResult.level === "medium")
  ) {
    return "habit_builder";
  }

  // デフォルト: at_risk_dropout
  return "at_risk_dropout";
}

/**
 * セグメント情報を取得
 * @param segment セグメントタイプ
 * @returns セグメント情報
 */
export function getSegmentInfo(segment: MemberSegment): MemberSegmentInfo {
  switch (segment) {
    case "short_term_result":
      return {
        segment: "short_term_result",
        label: "短期成果型",
        description: "早く結果を求める短期成果型",
      };
    case "habit_builder":
      return {
        segment: "habit_builder",
        label: "習慣型",
        description: "習慣化型",
      };
    case "at_risk_dropout":
      return {
        segment: "at_risk_dropout",
        label: "離脱危険型",
        description: "離脱危険型",
      };
  }
}

/**
 * セグメントの色分けクラスを取得
 * @param segment セグメントタイプ
 * @returns Tailwind CSSクラス
 */
export function getSegmentColor(segment: MemberSegment): string {
  switch (segment) {
    case "short_term_result":
      return "text-orange-700 bg-orange-400/10 border-orange-400/20";
    case "habit_builder":
      return "text-green-700 bg-green-400/10 border-green-400/20";
    case "at_risk_dropout":
      return "text-red-600 bg-red-400/10 border-red-400/20";
  }
}

