import { Member } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";

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
 * 会員のセグメントを判定
 * @param member 会員情報
 * @returns 会員セグメント
 */
export function getMemberSegment(member: Member): MemberSegment {
  const riskResult = calculateRiskScore(member);
  const daysSinceJoin = getDaysSince(member.joinDate);
  const daysSinceLastVisit = getDaysSince(member.lastVisitDate);
  const visitIntervalDays = parseVisitInterval(member.visitInterval);

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
      return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    case "habit_builder":
      return "text-green-400 bg-green-400/10 border-green-400/20";
    case "at_risk_dropout":
      return "text-red-400 bg-red-400/10 border-red-400/20";
  }
}

