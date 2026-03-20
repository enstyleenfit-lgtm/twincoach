import { Member } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";
import { getMemberSegment } from "@/lib/memberSegmentation";

export interface PlanTransitionRecommendation {
  trainingFitScore: number;
  pilatesFitScore: number;
  recommendedNextPlan: "トレーニング月8" | "ピラティス月8";
  reason: string[];
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
 * デュアル会員の推奨移行先プランを計算
 * @param member 会員情報（デュアル月8の会員）
 * @returns 推奨移行先プランと適性スコア
 */
export function getRecommendedNextPlan(
  member: Member
): PlanTransitionRecommendation {
  const riskResult = calculateRiskScore(member);
  const segment = getMemberSegment(member);
  const daysSinceJoin = getDaysSince(member.joinDate);
  const visitIntervalDays = parseVisitInterval(member.visitInterval);

  let trainingScore = 50; // ベーススコア
  let pilatesScore = 50; // ベーススコア
  const reasons: string[] = [];

  // ① 会員タイプによる判定
  if (segment === "short_term_result") {
    // 短期成果型 → トレーニング寄り
    trainingScore += 30;
    pilatesScore -= 10;
    reasons.push("短期成果を求める傾向があるため、トレーニングが適しています");
  } else if (segment === "habit_builder") {
    // 習慣型 → ピラティス寄り
    trainingScore -= 10;
    pilatesScore += 30;
    reasons.push("習慣化ができているため、ピラティスで継続しやすいです");
  } else {
    // 離脱危険型 → 両方にマイナス
    trainingScore -= 5;
    pilatesScore -= 5;
  }

  // ② 来店頻度による判定
  if (visitIntervalDays <= 3) {
    // 頻繁に来店 → トレーニング寄り（結果を求める傾向）
    trainingScore += 15;
    pilatesScore += 5;
    reasons.push("来店頻度が高いため、トレーニングで成果を出しやすいです");
  } else if (visitIntervalDays >= 7) {
    // 来店間隔が長い → ピラティス寄り（継続重視）
    trainingScore -= 10;
    pilatesScore += 15;
    reasons.push("来店間隔が長いため、ピラティスで無理なく継続できます");
  }

  // ③ リスクスコアによる判定
  if (riskResult.score >= 70) {
    // 高リスク → ピラティス寄り（継続重視）
    trainingScore -= 15;
    pilatesScore += 10;
    reasons.push("リスクが高いため、ピラティスで継続率を改善できます");
  } else if (riskResult.score <= 30) {
    // 低リスク → トレーニング寄り（成果重視）
    trainingScore += 10;
    pilatesScore += 5;
    reasons.push("リスクが低く安定しているため、トレーニングで成果を出せます");
  }

  // ④ 入会からの日数による判定
  if (daysSinceJoin <= 90) {
    // 入会後90日以内 → トレーニング寄り（早期成果）
    trainingScore += 10;
    pilatesScore -= 5;
    reasons.push("入会後90日以内の重要期間のため、トレーニングで早期成果を出せます");
  } else if (daysSinceJoin > 180) {
    // 入会後180日以上 → ピラティス寄り（長期継続）
    trainingScore -= 5;
    pilatesScore += 10;
    reasons.push("長期継続しているため、ピラティスで更なる継続が期待できます");
  }

  // ⑤ キャンセル履歴による判定
  if (member.hasCancellationHistory) {
    // キャンセル履歴あり → ピラティス寄り（柔軟性）
    trainingScore -= 10;
    pilatesScore += 15;
    reasons.push("キャンセル履歴があるため、ピラティスの柔軟なスケジュールが適しています");
  }

  // スコアを0〜100の範囲に制限
  trainingScore = Math.max(0, Math.min(100, trainingScore));
  pilatesScore = Math.max(0, Math.min(100, pilatesScore));

  // 推奨プランを決定
  const recommendedNextPlan: "トレーニング月8" | "ピラティス月8" =
    trainingScore > pilatesScore ? "トレーニング月8" : "ピラティス月8";

  // 理由が空の場合はデフォルト理由を追加
  if (reasons.length === 0) {
    if (recommendedNextPlan === "トレーニング月8") {
      reasons.push("トレーニングの適性が高いです");
    } else {
      reasons.push("ピラティスの適性が高いです");
    }
  }

  return {
    trainingFitScore: trainingScore,
    pilatesFitScore: pilatesScore,
    recommendedNextPlan,
    reason: reasons,
  };
}

/**
 * デュアル会員を取得
 */
export function getDualMembers(members: Member[]): Member[] {
  return members.filter(
    (member) =>
      member.plan === "デュアル月8" ||
      member.currentPlan === "デュアル月8"
  );
}







