import { Member } from "@/types";
import { calculateRiskScore } from "./riskScore";
import { getChurnPrediction } from "./churnPrediction";
import { getRevenueAtRisk } from "./revenueRisk";

export interface MemberLTV {
  estimatedLTV: number;
  expectedMonths: number;
  monthlyValue: number;
  riskAdjustedLTV: number;
}

/**
 * 会員LTV予測エンジン
 * 各会員の将来売上（LTV）を予測し、重要顧客とリスク顧客を可視化する
 * @param member 会員情報
 * @returns LTV予測結果
 */
export function estimateMemberLTV(member: Member): MemberLTV {
  // 月額売上を取得
  const revenue = getRevenueAtRisk(member);
  const monthlyValue = revenue.monthlyRevenue;

  // リスクレベルから継続予測月数を決定
  const riskResult = calculateRiskScore(member);
  let expectedMonths: number;

  switch (riskResult.level) {
    case "low":
      expectedMonths = 18;
      break;
    case "medium":
      expectedMonths = 10;
      break;
    case "high":
      expectedMonths = 4;
      break;
  }

  // 基本LTV = 月額 × 継続予測月数
  const estimatedLTV = monthlyValue * expectedMonths;

  // 退会確率を取得（30日確率を使用）
  const churnPrediction = getChurnPrediction(member);
  const churnProbability = churnPrediction.probability30Days / 100;

  // リスク調整後LTV = estimatedLTV × (1 - churnProbability)
  const riskAdjustedLTV = estimatedLTV * (1 - churnProbability);

  return {
    estimatedLTV: Math.round(estimatedLTV),
    expectedMonths,
    monthlyValue,
    riskAdjustedLTV: Math.round(riskAdjustedLTV),
  };
}

/**
 * LTVレベルを判定（高/中/低）
 * @param ltv LTV値
 * @returns LTVレベル
 */
export function getLTVLevel(ltv: number): "high" | "medium" | "low" {
  if (ltv >= 500000) {
    return "high";
  } else if (ltv >= 200000) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * LTVレベルの色を取得
 * @param level LTVレベル
 * @returns Tailwind CSSクラス
 */
export function getLTVLevelColor(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "low":
      return "text-red-400";
  }
}

/**
 * LTVレベルのバッジ色を取得
 * @param level LTVレベル
 * @returns Tailwind CSSクラス
 */
export function getLTVLevelBadgeColor(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high":
      return "text-green-400 bg-green-400/10 border-green-400/20";
    case "medium":
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "low":
      return "text-red-400 bg-red-400/10 border-red-400/20";
  }
}



