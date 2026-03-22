import { Member } from "@/types";
import { calculateRiskScore } from "./riskScore";
import { getDaysSinceDate, parseVisitIntervalDays } from "@/lib/memberDateUtils";

export interface ChurnPrediction {
  probability30Days: number;
  probability60Days: number;
  label30Days: "low" | "medium" | "high";
  label60Days: "low" | "medium" | "high";
  reasons: string[];
}

/**
 * 未来退会予測を計算
 * @param member 会員情報
 * @returns 30日・60日の退会確率と予測ラベル
 */
export function getChurnPrediction(member: Member): ChurnPrediction {
  const riskResult = calculateRiskScore(member);
  const reasons: string[] = [];

  // ベーススコア（リスクスコアをベースに）
  let baseProbability = riskResult.score;

  // 来店間隔による加算
  const visitIntervalDays = parseVisitIntervalDays(member.visitInterval);
  if (visitIntervalDays >= 15) {
    baseProbability += 15;
    reasons.push("来店間隔が長い");
  } else if (visitIntervalDays >= 8) {
    baseProbability += 8;
  }

  // 最終来店からの日数による加算
  const daysSinceLastVisit = getDaysSinceDate(member.lastVisitDate);
  if (daysSinceLastVisit >= 21) {
    baseProbability += 20;
    reasons.push("最終来店から21日以上経過");
  } else if (daysSinceLastVisit >= 14) {
    baseProbability += 12;
    reasons.push("最終来店から14日以上経過");
  } else if (daysSinceLastVisit >= 7) {
    baseProbability += 5;
  }

  // キャンセル履歴による加算
  if (member.hasCancellationHistory) {
    baseProbability += 15;
    reasons.push("キャンセル履歴あり");
  }

  // 入会からの日数による調整（90日以内は30日予測を高める）
  const daysSinceJoin = getDaysSinceDate(member.joinDate);
  const isNewMember = daysSinceJoin <= 90;
  if (isNewMember) {
    baseProbability += 10;
    reasons.push("入会から90日以内の重要期間");
  }

  // 30日予測の計算
  // 30日はより近い未来なので、ベース確率をそのまま使用（やや高めに）
  let probability30Days = Math.min(100, Math.round(baseProbability * 1.1));

  // 60日予測の計算
  // 60日はより遠い未来なので、ベース確率をやや低めに調整
  let probability60Days = Math.min(100, Math.round(baseProbability * 0.9));

  // 新規会員の場合は30日予測をさらに高める
  if (isNewMember) {
    probability30Days = Math.min(100, probability30Days + 5);
  }

  // 確率を0〜100の範囲に制限し、整数に変換
  probability30Days = Math.max(0, Math.min(100, Math.round(probability30Days)));
  probability60Days = Math.max(0, Math.min(100, Math.round(probability60Days)));

  // ラベル判定（30日）
  let label30Days: "low" | "medium" | "high";
  if (probability30Days <= 39) {
    label30Days = "low";
  } else if (probability30Days <= 69) {
    label30Days = "medium";
  } else {
    label30Days = "high";
  }

  // ラベル判定（60日）
  let label60Days: "low" | "medium" | "high";
  if (probability60Days <= 39) {
    label60Days = "low";
  } else if (probability60Days <= 69) {
    label60Days = "medium";
  } else {
    label60Days = "high";
  }

  // 理由が空の場合はデフォルトメッセージを追加
  if (reasons.length === 0) {
    if (probability30Days >= 50 || probability60Days >= 50) {
      reasons.push("複数のリスク要因が重なっています");
    } else {
      reasons.push("現時点ではリスク要因が少ないです");
    }
  }

  return {
    probability30Days,
    probability60Days,
    label30Days,
    label60Days,
    reasons,
  };
}

/**
 * 未来退会予測の理由を取得
 * @param member 会員情報
 * @returns 予測理由の配列
 */
export function getChurnPredictionReasons(member: Member): string[] {
  const reasons: string[] = [];

  // 来店間隔による理由
  const visitIntervalDays = parseVisitIntervalDays(member.visitInterval);
  if (visitIntervalDays >= 15) {
    reasons.push("来店間隔が長くなっています");
  } else if (visitIntervalDays >= 8) {
    reasons.push("来店間隔がやや長くなっています");
  }

  // 最終来店からの日数による理由
  const daysSinceLastVisit = getDaysSinceDate(member.lastVisitDate);
  if (daysSinceLastVisit >= 21) {
    reasons.push("最終来店から日数が経過しています");
  } else if (daysSinceLastVisit >= 14) {
    reasons.push("最終来店から日数が経過しています");
  }

  // 入会からの日数による理由
  const daysSinceJoin = getDaysSinceDate(member.joinDate);
  if (daysSinceJoin <= 90) {
    reasons.push("入会後90日以内の重要期間です");
  }

  // キャンセル履歴による理由
  if (member.hasCancellationHistory) {
    reasons.push("キャンセル履歴があります");
  }

  // 理由が空の場合はデフォルトメッセージ
  if (reasons.length === 0) {
    const prediction = getChurnPrediction(member);
    if (prediction.probability30Days >= 50 || prediction.probability60Days >= 50) {
      reasons.push("複数のリスク要因が重なっています");
    } else {
      reasons.push("現時点ではリスク要因が少ないです");
    }
  }

  return reasons;
}

