import { Member } from "@/types";
import { calculateRiskScore } from "./riskScore";
import { getReservationAnalysis } from "./reservationAnalysis";
import { getFirst90DaysRiskSummary } from "./first90Days";
import { getStoreRevenueDefenseSimulation } from "./revenueDefenseSimulation";
import { getInterventionSuggestion } from "./interventionSuggestion";
import { getPriorityQueue } from "./priorityQueue";

export interface StoreActionPlan {
  topIssue: string;
  actionItems: string[];
  priorityLabel: "high" | "medium" | "low";
  expectedImpact: string;
}

/**
 * 店舗別アクションプランを生成
 * 店舗状況に応じて優先すべき改善行動を自動生成
 * @param members 全会員リスト
 * @param storeName 店舗名
 * @returns アクションプラン
 */
export function getStoreActionPlan(
  members: Member[],
  storeName: string
): StoreActionPlan {
  // 店舗の会員をフィルタリング
  const storeMembers = members.filter(
    (member) => member.storeName === storeName
  );

  if (storeMembers.length === 0) {
    return {
      topIssue: "会員データがありません",
      actionItems: ["新規会員獲得を検討してください"],
      priorityLabel: "low",
      expectedImpact: "データ不足のため効果を測定できません",
    };
  }

  // 各種分析データを取得
  const highRiskMembers = storeMembers.filter(
    (member) => calculateRiskScore(member).level === "high"
  );
  const highRiskRatio = highRiskMembers.length / storeMembers.length;

  const reservationAnalysis = getReservationAnalysis(storeMembers);
  const reservationRiskCount = reservationAnalysis.reservationRiskMembers.length;
  const reservationRiskRatio = reservationRiskCount / storeMembers.length;

  const first90DaysSummary = getFirst90DaysRiskSummary(storeMembers);
  const first90DaysHighRiskCount =
    first90DaysSummary.highRiskFirst90DaysMembers.length;
  const first90DaysHighRiskRatio =
    first90DaysHighRiskCount / storeMembers.length;

  const revenueDefenseSimulation = getStoreRevenueDefenseSimulation(
    members,
    storeName
  );
  const monthlyLossForecast = revenueDefenseSimulation.monthlyLossForecast30Days;

  // 優先度の高い課題を判定
  // 1. 収益損失予測が高い（月間50万円以上）
  if (monthlyLossForecast >= 500000) {
    const priorityQueue = getPriorityQueue(storeMembers);
    const top3Members = priorityQueue.slice(0, 3);

    return {
      topIssue: "収益防衛が最優先",
      actionItems: [
        `高損失予測会員上位3名へ本日連絡（合計¥${Math.round(
          top3Members.reduce(
            (sum, item) =>
              sum +
              revenueDefenseSimulation.protectedRevenueIfTop3Saved /
                top3Members.length,
            0
          )
        ).toLocaleString()}の防衛可能）`,
        `来月損失予測¥${Math.round(monthlyLossForecast).toLocaleString()}を${Math.round(
          (revenueDefenseSimulation.protectedRevenueIfTop3Saved /
            monthlyLossForecast) *
            100
        )}%防衛するため、優先キュー上位会員から順に対応`,
        `収益リスクランキング上位5名の面談を今週中に実施`,
        `各会員の退会理由をヒアリングし、個別対応プランを策定`,
      ],
      priorityLabel: "high",
      expectedImpact: `上位3名を守ることで¥${Math.round(
        revenueDefenseSimulation.protectedRevenueIfTop3Saved
      ).toLocaleString()}の売上を防衛可能`,
    };
  }

  // 2. 90日以内高リスク会員が多い（全体の20%以上）
  if (first90DaysHighRiskRatio >= 0.2) {
    const first90DaysHighRiskMembers =
      first90DaysSummary.highRiskFirst90DaysMembers.slice(0, 5);

    return {
      topIssue: "初期継続改善が最優先",
      actionItems: [
        `入会後90日以内の高リスク会員${first90DaysHighRiskCount}名へ本日連絡`,
        `入会後30日以内会員${first90DaysSummary.membersInFirst30Days.length}名の面談を今週中に実施`,
        `入会後60日以内会員${first90DaysSummary.membersIn31to60Days.length}名の目標設定見直しを実施`,
        `新規会員の初期サポート体制を強化（担当トレーナーとの接点を増やす）`,
        `入会後90日会員の継続率を${Math.round(
          (first90DaysHighRiskCount / storeMembers.length) * 100
        )}%から85%以上に改善`,
      ],
      priorityLabel: "high",
      expectedImpact: `初期継続率を改善することで、年間売上を${Math.round(
        (first90DaysHighRiskCount * 10000 * 12) / 10000
      )}万円以上確保可能`,
    };
  }

  // 3. 予約問題リスク会員が多い（全体の15%以上）
  if (reservationRiskRatio >= 0.15) {
    const reservationRiskMembers = reservationAnalysis.reservationRiskMembers.slice(
      0,
      5
    );
    const difficultReservationMembersCount =
      reservationAnalysis.difficultReservationMembers.length;

    return {
      topIssue: "予約詰まり改善が最優先",
      actionItems: [
        `予約問題リスク会員${reservationRiskCount}名へ別時間帯・店舗の提案を実施`,
        `予約詰まりが疑われる会員${difficultReservationMembersCount}名へ柔軟なスケジュール調整を提案`,
        `混雑時間帯（${reservationAnalysis.busyTimeSlots
          .slice(0, 3)
          .map((s) => s.timeSlot)
          .join("、")}）の分散を促進`,
        `キャンセル履歴がある会員への予約サポートを強化`,
        `予約システムの使いやすさ改善を検討`,
      ],
      priorityLabel: "high",
      expectedImpact: `予約問題を解決することで、${reservationRiskCount}名の継続率を改善し、月間売上を¥${Math.round(
        (reservationRiskCount * 10000)
      ).toLocaleString()}以上確保可能`,
    };
  }

  // 4. 高リスク会員が多い（全体の30%以上）
  if (highRiskRatio >= 0.3) {
    const topHighRiskMembers = highRiskMembers
      .map((member) => ({
        member,
        riskScore: calculateRiskScore(member).score,
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);

    return {
      topIssue: "継続率改善が最優先",
      actionItems: [
        `高リスク会員上位${Math.min(5, highRiskMembers.length)}名へ本日連絡`,
        `リスクスコア80以上の会員${highRiskMembers.filter(
          (m) => calculateRiskScore(m).score >= 80
        ).length}名の緊急面談を今週中に実施`,
        `各会員の退会リスク要因を分析し、個別対応プランを策定`,
        `継続率を${Math.round(
          ((storeMembers.length - highRiskMembers.length) /
            storeMembers.length) *
            100
        )}%から85%以上に改善`,
        `月間リスク売上¥${Math.round(
          highRiskMembers.reduce(
            (sum, m) =>
              sum +
              (m.monthly_revenue || 0) *
                (calculateRiskScore(m).score / 100),
            0
          )
        ).toLocaleString()}を防衛`,
      ],
      priorityLabel: "high",
      expectedImpact: `高リスク会員の継続率を改善することで、年間売上を${Math.round(
        (highRiskMembers.length * 10000 * 12) / 10000
      )}万円以上確保可能`,
    };
  }

  // 5. デフォルト（中リスク）
  const mediumRiskMembers = storeMembers.filter(
    (member) => calculateRiskScore(member).level === "medium"
  );

  return {
    topIssue: "継続率維持・改善",
    actionItems: [
      `中リスク会員${mediumRiskMembers.length}名の状況確認を実施`,
      `来店間隔が長い会員へのリマインドを強化`,
      `会員満足度調査を実施し、改善点を特定`,
      `継続率を${Math.round(
        ((storeMembers.length - highRiskMembers.length) /
          storeMembers.length) *
          100
      )}%から90%以上に向上`,
      `月次で会員状況をレビューし、早期対応を徹底`,
    ],
    priorityLabel: "medium",
    expectedImpact: `継続率を維持・改善することで、年間売上を安定確保`,
  };
}

