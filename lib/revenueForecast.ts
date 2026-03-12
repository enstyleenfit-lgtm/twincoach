import { Member } from "@/types";
import { getRevenueAtRisk } from "./revenueRisk";
import { getChurnPrediction } from "./churnPrediction";

export interface RevenueRiskForecast {
  monthlyRevenue: number;
  annualRevenue: number;
  probability30Days: number;
  probability60Days: number;
  expectedLoss30Days: number;
  expectedLoss60Days: number;
}

/**
 * 収益リスク予測を計算
 * 退会確率をもとに、失う可能性のある売上を試算
 * @param member 会員情報
 * @returns 収益リスク予測データ
 */
export function getRevenueRiskForecast(member: Member): RevenueRiskForecast {
  // 月額売上を取得
  const revenue = getRevenueAtRisk(member);
  const monthlyRevenue = revenue.monthlyRevenue;
  const annualRevenue = monthlyRevenue * 12;

  // 退会予測を取得
  const prediction = getChurnPrediction(member);
  const probability30Days = prediction.probability30Days;
  const probability60Days = prediction.probability60Days;

  // 期待損失額を計算
  // expectedLoss = monthlyRevenue * (probability / 100)
  const expectedLoss30Days = monthlyRevenue * (probability30Days / 100);
  const expectedLoss60Days = monthlyRevenue * (probability60Days / 100);

  return {
    monthlyRevenue,
    annualRevenue,
    probability30Days,
    probability60Days,
    expectedLoss30Days,
    expectedLoss60Days,
  };
}

