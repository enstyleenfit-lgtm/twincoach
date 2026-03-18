import { Member } from "@/types";
import { getRevenueRiskForecast } from "./revenueForecast";
import { calculateRiskScore } from "./riskScore";

export interface RevenueDefenseSimulation {
  targetProtectedRevenue: number;
  revenueGap: number;
  membersToSaveForGoal: number;
  protectedRevenueIfTop3Saved: number;
  protectedRevenueIfTop5Saved: number;
  protectedRevenueIfHighRiskSaved: number;
  monthlyLossForecast30Days: number;
  monthlyLossForecast60Days: number;
}

/**
 * 収益防衛シミュレーション（全体版）
 * 優先度の高い会員から守った場合に防衛できる売上を試算
 * @param members 会員リスト
 * @returns 収益防衛シミュレーション結果
 */
export function getRevenueDefenseSimulation(
  members: Member[]
): RevenueDefenseSimulation {
  // 各会員の損失予測を計算
  const memberForecasts = members.map((member) => ({
    member,
    forecast: getRevenueRiskForecast(member),
    riskResult: calculateRiskScore(member),
  }));

  // 30日・60日損失予測の合計
  const monthlyLossForecast30Days = memberForecasts.reduce(
    (sum, { forecast }) => sum + forecast.expectedLoss30Days,
    0
  );
  const monthlyLossForecast60Days = memberForecasts.reduce(
    (sum, { forecast }) => sum + forecast.expectedLoss60Days,
    0
  );

  // 30日期待損失額が高い順にソート
  const sortedByLoss = memberForecasts
    .slice()
    .sort(
      (a, b) =>
        b.forecast.expectedLoss30Days - a.forecast.expectedLoss30Days
    );

  // 上位3人を守った場合の防衛額
  const protectedRevenueIfTop3Saved = sortedByLoss
    .slice(0, 3)
    .reduce((sum, { forecast }) => sum + forecast.expectedLoss30Days, 0);

  // 上位5人を守った場合の防衛額
  const protectedRevenueIfTop5Saved = sortedByLoss
    .slice(0, 5)
    .reduce((sum, { forecast }) => sum + forecast.expectedLoss30Days, 0);

  // 高リスク全体を守った場合の防衛額
  const protectedRevenueIfHighRiskSaved = memberForecasts
    .filter(({ riskResult }) => riskResult.level === "high")
    .reduce((sum, { forecast }) => sum + forecast.expectedLoss30Days, 0);

  // 目標防衛額（損失予測の80%を防衛することを目標とする）
  const targetProtectedRevenue = monthlyLossForecast30Days * 0.8;

  // 防衛ギャップ（目標防衛額 - 現在の防衛額）
  // 現在は防衛していないので、目標防衛額そのものがギャップ
  const revenueGap = targetProtectedRevenue;

  // 目標防衛額を達成するために必要な人数
  let membersToSaveForGoal = 0;
  let accumulatedProtected = 0;
  for (const item of sortedByLoss) {
    membersToSaveForGoal += 1;
    accumulatedProtected += item.forecast.expectedLoss30Days;
    if (accumulatedProtected >= targetProtectedRevenue) {
      break;
    }
  }

  return {
    targetProtectedRevenue,
    revenueGap,
    membersToSaveForGoal,
    protectedRevenueIfTop3Saved,
    protectedRevenueIfTop5Saved,
    protectedRevenueIfHighRiskSaved,
    monthlyLossForecast30Days,
    monthlyLossForecast60Days,
  };
}

/**
 * 収益防衛シミュレーション（店舗版）
 * この店舗で優先的に対応すべき会員を守った場合の防衛売上
 * @param members 全会員リスト
 * @param storeName 店舗名
 * @returns 収益防衛シミュレーション結果
 */
export function getStoreRevenueDefenseSimulation(
  members: Member[],
  storeName: string
): RevenueDefenseSimulation {
  // 店舗の会員をフィルタリング
  const storeMembers = members.filter(
    (member) => member.storeName === storeName
  );

  return getRevenueDefenseSimulation(storeMembers);
}





