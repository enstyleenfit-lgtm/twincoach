import { Member } from "@/types";
import { getStoreSummaries, type StoreSummary } from "./storeSummary";
import { getFirst90DaysRiskSummary } from "./first90Days";
import { getReservationAnalysis } from "./reservationAnalysis";

export interface SuccessFactor {
  factor: string;
  description: string;
}

export interface SuccessfulStore {
  storeName: string;
  successScore: number;
  successFactors: SuccessFactor[];
  recommendedReplicationActions: string[];
  metrics: {
    estimatedRetentionRate: number;
    highRiskMembers: number;
    annualRevenueAtRisk: number;
    monthlyRevenue: number;
    first90DaysHighRiskCount: number;
    reservationRiskMembersCount: number;
  };
}

export interface StoreSuccessAnalysis {
  topStores: SuccessfulStore[];
}

/**
 * 成功店舗の再現AI
 * 成果が出ている店舗の特徴を抽出し、他店舗へ展開できる行動を提案する
 * @param members 全会員リスト
 * @returns 成功店舗分析結果
 */
export function analyzeSuccessfulStores(
  members: Member[]
): StoreSuccessAnalysis {
  // 店舗サマリーを取得
  const storeSummaries = getStoreSummaries(members);

  // 各店舗の追加指標を計算
  const storeDetails = storeSummaries.map((summary: StoreSummary) => {
    const storeMembers = members.filter(
      (m: Member) => m.storeName === summary.storeName
    );

    const first90DaysSummary = getFirst90DaysRiskSummary(storeMembers);
    const reservationAnalysis = getReservationAnalysis(storeMembers);

    return {
      summary,
      first90DaysHighRiskCount:
        first90DaysSummary.highRiskFirst90DaysMembers.length,
      reservationRiskMembersCount:
        reservationAnalysis.reservationRiskMembers.length,
    };
  });

  // 成功スコアを計算
  // 指標を正規化してスコア化
  const allRetentionRates = storeSummaries.map((s) => s.estimatedRetentionRate);
  const maxRetentionRate = Math.max(...allRetentionRates, 1);
  const minRetentionRate = Math.min(...allRetentionRates, 100);

  const allHighRiskCounts = storeSummaries.map((s) => s.highRiskMembers);
  const maxHighRisk = Math.max(...allHighRiskCounts, 1);
  const minHighRisk = Math.min(...allHighRiskCounts, 0);

  const allRevenueAtRisk = storeSummaries.map((s) => s.annualRevenueAtRisk);
  const maxRevenueAtRisk = Math.max(...allRevenueAtRisk, 1);
  const minRevenueAtRisk = Math.min(...allRevenueAtRisk, 0);

  const allMonthlyRevenue = storeSummaries.map((s) => s.monthlyRevenue);
  const maxMonthlyRevenue = Math.max(...allMonthlyRevenue, 1);
  const minMonthlyRevenue = Math.min(...allMonthlyRevenue, 0);

  const successfulStores: SuccessfulStore[] = storeDetails.map((detail) => {
    const { summary } = detail;

    // 成功スコアを計算（0-100）
    // 継続率が高いほど高スコア
    const retentionScore =
      maxRetentionRate > minRetentionRate
        ? ((summary.estimatedRetentionRate - minRetentionRate) /
            (maxRetentionRate - minRetentionRate)) *
          40
        : 0;

    // 高リスク会員が少ないほど高スコア
    const lowRiskScore =
      maxHighRisk > minHighRisk
        ? (1 - (summary.highRiskMembers - minHighRisk) / (maxHighRisk - minHighRisk)) * 30
        : 0;

    // リスク売上が低いほど高スコア
    const lowRevenueRiskScore =
      maxRevenueAtRisk > minRevenueAtRisk
        ? (1 - (summary.annualRevenueAtRisk - minRevenueAtRisk) / (maxRevenueAtRisk - minRevenueAtRisk)) * 20
        : 0;

    // 月間売上が高いほど高スコア
    const revenueScore =
      maxMonthlyRevenue > minMonthlyRevenue
        ? ((summary.monthlyRevenue - minMonthlyRevenue) /
            (maxMonthlyRevenue - minMonthlyRevenue)) *
          10
        : 0;

    const successScore = Math.round(
      retentionScore + lowRiskScore + lowRevenueRiskScore + revenueScore
    );

    // 成功要因を抽出
    const successFactors: SuccessFactor[] = [];

    if (summary.estimatedRetentionRate >= 80) {
      successFactors.push({
        factor: "推定継続率が高い",
        description: `継続率${summary.estimatedRetentionRate.toFixed(1)}%は全店舗平均を上回っています`,
      });
    }

    if (summary.highRiskMembers === 0 || summary.highRiskMembers / summary.totalMembers < 0.1) {
      successFactors.push({
        factor: "高リスク会員数が少ない",
        description: `高リスク会員は${summary.highRiskMembers}人（${((summary.highRiskMembers / summary.totalMembers) * 100).toFixed(1)}%）です`,
      });
    }

    if (detail.first90DaysHighRiskCount === 0 || detail.first90DaysHighRiskCount / summary.totalMembers < 0.05) {
      successFactors.push({
        factor: "90日以内高リスク会員が少ない",
        description: `入会後90日以内の高リスク会員が${detail.first90DaysHighRiskCount}人と少ないです`,
      });
    }

    if (detail.reservationRiskMembersCount === 0 || detail.reservationRiskMembersCount / summary.totalMembers < 0.1) {
      successFactors.push({
        factor: "予約問題リスク会員が少ない",
        description: `予約問題リスク会員は${detail.reservationRiskMembersCount}人です`,
      });
    }

    if (summary.annualRevenueAtRisk < summary.monthlyRevenue * 2) {
      successFactors.push({
        factor: "リスク売上が低い",
        description: `年間リスク売上は¥${summary.annualRevenueAtRisk.toLocaleString()}と低水準です`,
      });
    }

    if (summary.monthlyRevenue >= 500000) {
      successFactors.push({
        factor: "月間売上が高い",
        description: `月間売上¥${summary.monthlyRevenue.toLocaleString()}は高水準です`,
      });
    }

    // 再現アクションを生成
    const recommendedReplicationActions: string[] = [];

    if (summary.estimatedRetentionRate >= 80) {
      recommendedReplicationActions.push("初期90日会員への面談強化");
      recommendedReplicationActions.push("週1来店の定着支援");
    }

    if (summary.highRiskMembers === 0 || summary.highRiskMembers / summary.totalMembers < 0.1) {
      recommendedReplicationActions.push("高リスク会員の早期フォロー");
      recommendedReplicationActions.push("リスク上昇前の予防的介入");
    }

    if (detail.first90DaysHighRiskCount === 0 || detail.first90DaysHighRiskCount / summary.totalMembers < 0.05) {
      recommendedReplicationActions.push("入会後30日・60日・90日の定期フォロー");
      recommendedReplicationActions.push("初期定着プログラムの徹底");
    }

    if (detail.reservationRiskMembersCount === 0 || detail.reservationRiskMembersCount / summary.totalMembers < 0.1) {
      recommendedReplicationActions.push("予約取りづらい会員への代替時間帯提案");
      recommendedReplicationActions.push("予約システムの使い方サポート");
    }

    if (summary.annualRevenueAtRisk < summary.monthlyRevenue * 2) {
      recommendedReplicationActions.push("高LTV会員の優先フォロー");
      recommendedReplicationActions.push("退会リスクの早期発見と対応");
    }

    return {
      storeName: summary.storeName,
      successScore,
      successFactors,
      recommendedReplicationActions: recommendedReplicationActions.slice(0, 5), // 最大5個
      metrics: {
        estimatedRetentionRate: summary.estimatedRetentionRate,
        highRiskMembers: summary.highRiskMembers,
        annualRevenueAtRisk: summary.annualRevenueAtRisk,
        monthlyRevenue: summary.monthlyRevenue,
        first90DaysHighRiskCount: detail.first90DaysHighRiskCount,
        reservationRiskMembersCount: detail.reservationRiskMembersCount,
      },
    };
  });

  // 成功スコア順にソート
  successfulStores.sort((a, b) => b.successScore - a.successScore);

  return {
    topStores: successfulStores.slice(0, 5), // Top 5
  };
}

/**
 * 特定店舗の成功要因を取得
 * @param members 全会員リスト
 * @param storeName 店舗名
 * @returns 成功要因と再現アクション
 */
export function getStoreSuccessFactors(
  members: Member[],
  storeName: string
): {
  successFactors: SuccessFactor[];
  recommendedReplicationActions: string[];
  successScore: number;
} | null {
  const analysis = analyzeSuccessfulStores(members);
  const store = analysis.topStores.find((s) => s.storeName === storeName);

  if (!store) {
    return null;
  }

  return {
    successFactors: store.successFactors,
    recommendedReplicationActions: store.recommendedReplicationActions,
    successScore: store.successScore,
  };
}



