import { Member } from "@/types";
import { calculateRiskScore } from "./riskScore";
import { getDaysSinceDate, parseVisitIntervalDays } from "@/lib/memberDateUtils";

export interface RetentionDriver {
  factor: string;
  impactScore: number;
  description: string;
  suggestion: string;
}

export interface RetentionDriverAnalysis {
  positiveDrivers: RetentionDriver[];
  negativeDrivers: RetentionDriver[];
}

/**
 * 継続率ドライバー分析AI
 * 継続会員（low/medium risk）と高リスク会員（high risk）を比較し、
 * 継続率に影響する要因を分析する
 * @param members 全会員リスト
 * @returns 継続率ドライバー分析結果
 */
export function analyzeRetentionDrivers(
  members: Member[]
): RetentionDriverAnalysis {
  // 継続会員（low/medium risk）と高リスク会員（high risk）を分類
  const retainedMembers: Member[] = [];
  const atRiskMembers: Member[] = [];

  members.forEach((member: Member) => {
    const riskResult = calculateRiskScore(member);
    if (riskResult.level === "low" || riskResult.level === "medium") {
      retainedMembers.push(member);
    } else {
      atRiskMembers.push(member);
    }
  });

  // データが不足している場合はデフォルト値を返す
  if (retainedMembers.length === 0 || atRiskMembers.length === 0) {
    return {
      positiveDrivers: [
        {
          factor: "データ不足",
          impactScore: 0,
          description: "継続会員または高リスク会員のデータが不足しています",
          suggestion: "より多くのデータを収集してください",
        },
      ],
      negativeDrivers: [],
    };
  }

  const drivers: RetentionDriver[] = [];

  // 1. 来店間隔の分析
  const retainedAvgInterval = retainedMembers.reduce((sum: number, m: Member) => {
    return sum + parseVisitIntervalDays(m.visitInterval);
  }, 0) / retainedMembers.length;

  const atRiskAvgInterval = atRiskMembers.reduce((sum: number, m: Member) => {
    return sum + parseVisitIntervalDays(m.visitInterval);
  }, 0) / atRiskMembers.length;

  const intervalDiff = atRiskAvgInterval - retainedAvgInterval;
  if (intervalDiff > 0) {
    drivers.push({
      factor: `来店間隔${Math.round(retainedAvgInterval)}日以下`,
      impactScore: Math.min(100, Math.round((intervalDiff / retainedAvgInterval) * 50 + 50)),
      description: `継続会員の平均来店間隔は${Math.round(retainedAvgInterval)}日、高リスク会員は${Math.round(atRiskAvgInterval)}日です`,
      suggestion: "週1回以上の安定来店を定着させる",
    });
  }

  // 2. 週1回以上の来店率
  const retainedWeeklyVisitors = retainedMembers.filter((m: Member) => {
    return parseVisitIntervalDays(m.visitInterval) <= 7;
  }).length;
  const retainedWeeklyRate = (retainedWeeklyVisitors / retainedMembers.length) * 100;

  const atRiskWeeklyVisitors = atRiskMembers.filter((m: Member) => {
    return parseVisitIntervalDays(m.visitInterval) <= 7;
  }).length;
  const atRiskWeeklyRate = (atRiskWeeklyVisitors / atRiskMembers.length) * 100;

  if (retainedWeeklyRate > atRiskWeeklyRate) {
    drivers.push({
      factor: "週1回以上の安定来店",
      impactScore: Math.min(100, Math.round((retainedWeeklyRate - atRiskWeeklyRate) * 1.5 + 60)),
      description: `継続会員の${Math.round(retainedWeeklyRate)}%が週1回以上来店、高リスク会員は${Math.round(atRiskWeeklyRate)}%です`,
      suggestion: "初期90日で週1来店を定着させる",
    });
  }

  // 3. 来店間隔15日以上の割合
  const retainedLongInterval = retainedMembers.filter((m: Member) => {
    return parseVisitIntervalDays(m.visitInterval) >= 15;
  }).length;
  const retainedLongIntervalRate = (retainedLongInterval / retainedMembers.length) * 100;

  const atRiskLongInterval = atRiskMembers.filter((m: Member) => {
    return parseVisitIntervalDays(m.visitInterval) >= 15;
  }).length;
  const atRiskLongIntervalRate = (atRiskLongInterval / atRiskMembers.length) * 100;

  if (atRiskLongIntervalRate > retainedLongIntervalRate) {
    drivers.push({
      factor: "来店間隔15日以上",
      impactScore: Math.min(100, Math.round((atRiskLongIntervalRate - retainedLongIntervalRate) * 2 + 70)),
      description: `高リスク会員の${Math.round(atRiskLongIntervalRate)}%が15日以上空いています`,
      suggestion: "14日以上空く前にリマインドと次回予約取得を行う",
    });
  }

  // 4. キャンセル履歴の有無
  const retainedWithCancel = retainedMembers.filter((m: Member) => m.hasCancellationHistory).length;
  const retainedCancelRate = (retainedWithCancel / retainedMembers.length) * 100;

  const atRiskWithCancel = atRiskMembers.filter((m: Member) => m.hasCancellationHistory).length;
  const atRiskCancelRate = (atRiskWithCancel / atRiskMembers.length) * 100;

  if (atRiskCancelRate > retainedCancelRate) {
    drivers.push({
      factor: "キャンセル履歴なし",
      impactScore: Math.min(100, Math.round((atRiskCancelRate - retainedCancelRate) * 1.5 + 65)),
      description: `高リスク会員の${Math.round(atRiskCancelRate)}%にキャンセル履歴があります`,
      suggestion: "キャンセル理由を分析し、事前防止策を実施する",
    });
  }

  // 5. 入会後90日以内の割合
  const retainedNewMembers = retainedMembers.filter((m: Member) => {
    return getDaysSinceDate(m.joinDate) <= 90;
  }).length;
  const retainedNewRate = (retainedNewMembers / retainedMembers.length) * 100;

  const atRiskNewMembers = atRiskMembers.filter((m: Member) => {
    return getDaysSinceDate(m.joinDate) <= 90;
  }).length;
  const atRiskNewRate = (atRiskNewMembers / atRiskMembers.length) * 100;

  if (atRiskNewRate > retainedNewRate) {
    drivers.push({
      factor: "入会後90日を超えた継続",
      impactScore: Math.min(100, Math.round((atRiskNewRate - retainedNewRate) * 1.2 + 70)),
      description: `高リスク会員の${Math.round(atRiskNewRate)}%が入会後90日以内です`,
      suggestion: "入会後90日間は集中的にフォローし、定着を図る",
    });
  }

  // 6. 最終来店から7日以内の割合
  const retainedRecentVisitors = retainedMembers.filter((m: Member) => {
    return getDaysSinceDate(m.lastVisitDate) <= 7;
  }).length;
  const retainedRecentRate = (retainedRecentVisitors / retainedMembers.length) * 100;

  const atRiskRecentVisitors = atRiskMembers.filter((m: Member) => {
    return getDaysSinceDate(m.lastVisitDate) <= 7;
  }).length;
  const atRiskRecentRate = (atRiskRecentVisitors / atRiskMembers.length) * 100;

  if (retainedRecentRate > atRiskRecentRate) {
    drivers.push({
      factor: "最終来店から7日以内",
      impactScore: Math.min(100, Math.round((retainedRecentRate - atRiskRecentRate) * 1.3 + 60)),
      description: `継続会員の${Math.round(retainedRecentRate)}%が7日以内に来店しています`,
      suggestion: "最終来店から7日以内に次回予約を取得する",
    });
  }

  // 7. 最終来店から14日以上経過の割合
  const retainedLongAbsence = retainedMembers.filter((m: Member) => {
    return getDaysSinceDate(m.lastVisitDate) >= 14;
  }).length;
  const retainedLongAbsenceRate = (retainedLongAbsence / retainedMembers.length) * 100;

  const atRiskLongAbsence = atRiskMembers.filter((m: Member) => {
    return getDaysSinceDate(m.lastVisitDate) >= 14;
  }).length;
  const atRiskLongAbsenceRate = (atRiskLongAbsence / atRiskMembers.length) * 100;

  if (atRiskLongAbsenceRate > retainedLongAbsenceRate) {
    drivers.push({
      factor: "最終来店から14日未満",
      impactScore: Math.min(100, Math.round((atRiskLongAbsenceRate - retainedLongAbsenceRate) * 2 + 75)),
      description: `高リスク会員の${Math.round(atRiskLongAbsenceRate)}%が14日以上来店していません`,
      suggestion: "14日以上空く前に緊急フォローを実施する",
    });
  }

  // ポジティブドライバーとネガティブドライバーに分類
  const positiveDrivers: RetentionDriver[] = [];
  const negativeDrivers: RetentionDriver[] = [];

  drivers.forEach((driver: RetentionDriver) => {
    if (driver.factor.includes("週1回") || driver.factor.includes("7日以内") || driver.factor.includes("90日を超えた")) {
      positiveDrivers.push(driver);
    } else {
      negativeDrivers.push(driver);
    }
  });

  // スコア順にソート
  positiveDrivers.sort((a: RetentionDriver, b: RetentionDriver) => b.impactScore - a.impactScore);
  negativeDrivers.sort((a: RetentionDriver, b: RetentionDriver) => b.impactScore - a.impactScore);

  return {
    positiveDrivers: positiveDrivers.slice(0, 5), // Top 5
    negativeDrivers: negativeDrivers.slice(0, 5), // Top 5
  };
}

