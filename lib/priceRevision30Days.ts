import { Member } from "@/types";
import { calculateRiskScore } from "./riskScore";
import { getRevenueRiskForecast } from "./revenueForecast";
import { getChurnPrediction } from "./churnPrediction";
import { getPriorityQueue } from "./priorityQueue";
import { getInterventionSuggestion } from "./interventionSuggestion";

export interface PriceRevision30DaysSummary {
  targetMembers: number;
  highRiskMembersAfterRevision: number;
  increasedRiskMembers: number;
  visitDropMembers: number;
  expectedLoss30Days: number;
  protectedRevenueEstimate: number;
}

/**
 * 価格改定後30日モニターサマリーを生成
 * 価格改定後30日間で会員のリスク・来店・売上がどう変化しているかを追跡
 * @param members 会員リスト
 * @returns 価格改定後30日モニターサマリー
 */
export function getPriceRevision30DaysSummary(
  members: Member[]
): PriceRevision30DaysSummary {
  // 価格改定対象会員を取得
  const targetMembers = members.filter(
    (member) => member.isPriceRevisionTarget === true
  );

  if (targetMembers.length === 0) {
    return {
      targetMembers: 0,
      highRiskMembersAfterRevision: 0,
      increasedRiskMembers: 0,
      visitDropMembers: 0,
      expectedLoss30Days: 0,
      protectedRevenueEstimate: 0,
    };
  }

  // 改定前後のリスクスコアを計算
  const memberRiskAnalysis = targetMembers.map((member) => {
    const beforeRiskResult = calculateRiskScore(member);
    // 価格改定によるリスク上昇を考慮（簡易的に+10ポイント）
    const afterRiskScore = Math.min(100, beforeRiskResult.score + 10);
    const afterRiskLevel: "low" | "medium" | "high" =
      afterRiskScore >= 70
        ? "high"
        : afterRiskScore >= 50
        ? "medium"
        : "low";

    // 来店間隔の変化を検出（簡易的に、来店間隔が長い場合は来店減少と判定）
    const visitIntervalDays = parseInt(
      member.visitInterval?.match(/(\d+)/)?.[1] || "0",
      10
    );
    const hasVisitDrop = visitIntervalDays >= 15;

    return {
      member,
      beforeRiskLevel: beforeRiskResult.level,
      afterRiskLevel,
      afterRiskScore,
      hasVisitDrop,
    };
  });

  // 改定後高リスク会員数
  const highRiskMembersAfterRevision = memberRiskAnalysis.filter(
    (item) => item.afterRiskLevel === "high"
  ).length;

  // リスク上昇会員数（改定前は低・中リスクだったが、改定後高リスクになった）
  const increasedRiskMembers = memberRiskAnalysis.filter(
    (item) =>
      (item.beforeRiskLevel === "low" || item.beforeRiskLevel === "medium") &&
      item.afterRiskLevel === "high"
  ).length;

  // 来店減少会員数
  const visitDropMembers = memberRiskAnalysis.filter(
    (item) => item.hasVisitDrop
  ).length;

  // 30日損失予測（改定後のリスクを考慮）
  const expectedLoss30Days = targetMembers.reduce((sum, member) => {
    const forecast = getRevenueRiskForecast(member);
    const prediction = getChurnPrediction(member);
    // 価格改定によるリスク上昇を考慮
    const adjustedProbability30Days = Math.min(
      100,
      prediction.probability30Days + 10
    );
    const adjustedExpectedLoss =
      forecast.monthlyRevenue * (adjustedProbability30Days / 100);
    return sum + adjustedExpectedLoss;
  }, 0);

  // 守れた売上見込み（改定対象会員の改定後売上の合計から、高リスク会員の損失予測を引いたもの）
  const totalAfterRevenue = targetMembers.reduce((sum, member) => {
    const afterRevenue =
      member.priceRevisionAfterRevenue ?? member.monthlyRevenue ?? 0;
    return sum + afterRevenue;
  }, 0);

  const highRiskLoss = memberRiskAnalysis
    .filter((item) => item.afterRiskLevel === "high")
    .reduce((sum, item) => {
      const afterRevenue =
        item.member.priceRevisionAfterRevenue ??
        item.member.monthlyRevenue ??
        0;
      const prediction = getChurnPrediction(item.member);
      const adjustedProbability30Days = Math.min(
        100,
        prediction.probability30Days + 10
      );
      return sum + afterRevenue * (adjustedProbability30Days / 100);
    }, 0);

  const protectedRevenueEstimate = totalAfterRevenue - highRiskLoss;

  return {
    targetMembers: targetMembers.length,
    highRiskMembersAfterRevision,
    increasedRiskMembers,
    visitDropMembers,
    expectedLoss30Days,
    protectedRevenueEstimate,
  };
}

/**
 * 価格改定対象会員の退会予測ランキング（上位5名）を取得
 */
export function getPriceRevisionChurnRanking(members: Member[]) {
  const targetMembers = members.filter(
    (member) => member.isPriceRevisionTarget === true
  );

  return targetMembers
    .map((member) => {
      const prediction = getChurnPrediction(member);
      const riskResult = calculateRiskScore(member);
      // 価格改定によるリスク上昇を考慮
      const adjustedRiskScore = Math.min(100, riskResult.score + 10);
      const adjustedPrediction = {
        ...prediction,
        probability30Days: Math.min(100, prediction.probability30Days + 10),
        probability60Days: Math.min(100, prediction.probability60Days + 10),
      };
      const intervention = getInterventionSuggestion(member);
      return {
        member,
        prediction: adjustedPrediction,
        riskScore: adjustedRiskScore,
        riskLevel:
          adjustedRiskScore >= 70
            ? "high"
            : adjustedRiskScore >= 50
            ? "medium"
            : "low",
        intervention,
      };
    })
    .sort(
      (a, b) =>
        b.prediction.probability30Days - a.prediction.probability30Days
    )
    .slice(0, 5);
}

/**
 * 価格改定対象会員の介入優先キュー（上位5名）を取得
 */
export function getPriceRevisionPriorityQueue(members: Member[]) {
  const targetMembers = members.filter(
    (member) => member.isPriceRevisionTarget === true
  );

  return getPriorityQueue(targetMembers).slice(0, 5);
}




