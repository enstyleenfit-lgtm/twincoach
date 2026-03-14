import { Member } from "@/types";
import { calculateRiskScore } from "./riskScore";
import { getRevenueAtRisk } from "./revenueRisk";
import { getRevenueDefenseSimulation } from "./revenueDefenseSimulation";
import { getStoreSummaries, StoreSummary } from "./storeSummary";
import { getTrainerMetrics, TrainerMetrics } from "./trainerMetrics";
import { getFirst90DaysRiskSummary } from "./first90Days";

export interface MonthlyReportSummary {
  totalMembers: number;
  highRiskMembers: number;
  estimatedRetentionRate: number;
  monthlyRevenue: number;
  monthlyLossForecast30Days: number;
  monthlyLossForecast60Days: number;
  membersToSaveForGoal: number;
  top3Stores: StoreSummary[];
  top3Trainers: TrainerMetrics[];
  summaryComment: string;
  actionProposal: string;
}

/**
 * 月次レポートサマリーを生成
 * @param members 会員リスト
 * @returns 月次レポートサマリー
 */
export function getMonthlyReportSummary(
  members: Member[]
): MonthlyReportSummary {
  // 基本統計
  const totalMembers = members.length;
  const highRiskMembers = members.filter((member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "high";
  }).length;

  // 継続率
  const lowRiskMembers = members.filter((member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "low";
  }).length;
  const mediumRiskMembers = members.filter((member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "medium";
  }).length;
  const safeMembers = lowRiskMembers + mediumRiskMembers;
  const estimatedRetentionRate =
    totalMembers > 0 ? (safeMembers / totalMembers) * 100 : 0;

  // 月間売上
  const monthlyRevenue = members.reduce((sum, member) => {
    const revenue = getRevenueAtRisk(member);
    return sum + revenue.monthlyRevenue;
  }, 0);

  // 収益防衛シミュレーション
  const defenseSimulation = getRevenueDefenseSimulation(members);

  // 店舗別リスク上位3店舗
  const storeSummaries = getStoreSummaries(members);
  const top3Stores = storeSummaries
    .sort((a, b) => b.annualRevenueAtRisk - a.annualRevenueAtRisk)
    .slice(0, 3);

  // トレーナー別リスク上位3名
  const trainerMetrics = getTrainerMetrics(members);
  const top3Trainers = trainerMetrics.slice(0, 3);

  // サマリーコメント生成
  const summaryComment = generateSummaryComment(
    highRiskMembers,
    totalMembers,
    top3Stores,
    estimatedRetentionRate
  );

  // アクション提案生成
  const actionProposal = generateActionProposal(
    defenseSimulation,
    members,
    top3Stores
  );

  return {
    totalMembers,
    highRiskMembers,
    estimatedRetentionRate,
    monthlyRevenue,
    monthlyLossForecast30Days: defenseSimulation.monthlyLossForecast30Days,
    monthlyLossForecast60Days: defenseSimulation.monthlyLossForecast60Days,
    membersToSaveForGoal: defenseSimulation.membersToSaveForGoal,
    top3Stores,
    top3Trainers,
    summaryComment,
    actionProposal,
  };
}

/**
 * サマリーコメントを生成
 */
function generateSummaryComment(
  highRiskMembers: number,
  totalMembers: number,
  top3Stores: StoreSummary[],
  retentionRate: number
): string {
  const highRiskRatio = totalMembers > 0 ? highRiskMembers / totalMembers : 0;
  const topStore = top3Stores[0];

  if (highRiskRatio >= 0.3) {
    return `今月は高リスク会員が${highRiskMembers}名（全体の${Math.round(
      highRiskRatio * 100
    )}%）と増加しており、特に${topStore?.storeName || "一部店舗"}で収益リスクが高まっています。継続率は${retentionRate.toFixed(
      1
    )}%となっており、早期の介入が必要です。`;
  } else if (highRiskRatio >= 0.2) {
    return `今月は高リスク会員が${highRiskMembers}名とやや増加傾向にあります。${topStore?.storeName || "一部店舗"}でのリスク管理を強化することで、継続率${retentionRate.toFixed(
      1
    )}%の維持・改善が期待できます。`;
  } else {
    return `今月の継続率は${retentionRate.toFixed(
      1
    )}%と良好な状態です。高リスク会員${highRiskMembers}名への継続的なサポートにより、さらなる改善が期待できます。`;
  }
}

/**
 * アクション提案を生成
 */
function generateActionProposal(
  defenseSimulation: ReturnType<typeof getRevenueDefenseSimulation>,
  members: Member[],
  top3Stores: StoreSummary[]
): string {
  const first90DaysSummary = getFirst90DaysRiskSummary(members);
  const first90DaysHighRiskCount =
    first90DaysSummary.highRiskFirst90DaysMembers.length;

  const proposals: string[] = [];

  if (defenseSimulation.monthlyLossForecast30Days >= 500000) {
    proposals.push(
      `来月損失予測が¥${Math.round(
        defenseSimulation.monthlyLossForecast30Days
      ).toLocaleString()}と高いため、高損失予測会員${defenseSimulation.membersToSaveForGoal}名への優先介入が必要です。`
    );
  }

  if (first90DaysHighRiskCount >= 5) {
    proposals.push(
      `入会後90日以内の高リスク会員が${first90DaysHighRiskCount}名いるため、初期定着フォローの強化が推奨されます。`
    );
  }

  if (top3Stores.length > 0 && top3Stores[0].annualRevenueAtRisk >= 5000000) {
    proposals.push(
      `${top3Stores[0].storeName}の年間リスク売上が¥${Math.round(
        top3Stores[0].annualRevenueAtRisk
      ).toLocaleString()}と高いため、店舗単位での重点的なサポートが必要です。`
    );
  }

  if (proposals.length === 0) {
    proposals.push(
      `継続率改善のためには、入会後90日会員と高LTV会員への優先介入が必要です。`
    );
  }

  return proposals.join(" ");
}

/**
 * 店舗別月次レポートを取得
 * @param members 全会員リスト
 * @param storeName 店舗名
 * @returns 店舗別月次レポート
 */
export function getStoreMonthlyReport(
  members: Member[],
  storeName: string
): {
  storeName: string;
  totalMembers: number;
  highRiskMembers: number;
  estimatedRetentionRate: number;
  monthlyRevenue: number;
  monthlyLossForecast30Days: number;
  monthlyLossForecast60Days: number;
  membersToSaveForGoal: number;
} {
  const storeMembers = members.filter(
    (member) => member.storeName === storeName
  );

  if (storeMembers.length === 0) {
    return {
      storeName,
      totalMembers: 0,
      highRiskMembers: 0,
      estimatedRetentionRate: 0,
      monthlyRevenue: 0,
      monthlyLossForecast30Days: 0,
      monthlyLossForecast60Days: 0,
      membersToSaveForGoal: 0,
    };
  }

  const summary = getMonthlyReportSummary(storeMembers);
  const storeSummary = getStoreSummaries(storeMembers).find(
    (s) => s.storeName === storeName
  );

  return {
    storeName,
    totalMembers: summary.totalMembers,
    highRiskMembers: summary.highRiskMembers,
    estimatedRetentionRate: storeSummary?.estimatedRetentionRate || 0,
    monthlyRevenue: summary.monthlyRevenue,
    monthlyLossForecast30Days: summary.monthlyLossForecast30Days,
    monthlyLossForecast60Days: summary.monthlyLossForecast60Days,
    membersToSaveForGoal: summary.membersToSaveForGoal,
  };
}

/**
 * トレーナー別月次レポートを取得
 * @param members 全会員リスト
 * @param trainerName トレーナー名
 * @returns トレーナー別月次レポート
 */
export function getTrainerMonthlyReport(
  members: Member[],
  trainerName: string
): {
  trainerName: string;
  totalMembers: number;
  highRiskMembers: number;
  estimatedRetentionRate: number;
  monthlyRevenue: number;
  annualRevenueAtRisk: number;
} {
  const trainerMembers = members.filter(
    (member) => member.assignedTrainer === trainerName
  );

  if (trainerMembers.length === 0) {
    return {
      trainerName,
      totalMembers: 0,
      highRiskMembers: 0,
      estimatedRetentionRate: 0,
      monthlyRevenue: 0,
      annualRevenueAtRisk: 0,
    };
  }

  const trainerMetrics = getTrainerMetrics(trainerMembers).find(
    (t) => t.trainerName === trainerName
  );

  return {
    trainerName,
    totalMembers: trainerMetrics?.totalMembers || 0,
    highRiskMembers: trainerMetrics?.highRiskMembers || 0,
    estimatedRetentionRate: trainerMetrics?.estimatedRetentionRate || 0,
    monthlyRevenue: trainerMetrics?.monthlyRevenue || 0,
    annualRevenueAtRisk: trainerMetrics?.annualRevenueAtRisk || 0,
  };
}



