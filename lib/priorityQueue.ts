import { Member } from "@/types";
import { calculateRiskScore } from "./riskScore";
import { getInterventionSuggestion } from "./interventionSuggestion";
import { getChurnPrediction } from "./churnPrediction";
import { getMemberSegment } from "./memberSegmentation";

export interface PriorityQueueItem {
  id: string;
  name: string;
  riskScore: number;
  probability30Days: number;
  probability60Days: number;
  priority: "low" | "medium" | "high";
  suggestedAction: string;
  segment: string;
  member: Member;
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
 * 優先順位スコアを計算
 * @param member 会員情報
 * @returns 優先順位スコア（高いほど優先）
 */
function calculatePriorityScore(member: Member): number {
  const riskResult = calculateRiskScore(member);
  const prediction = getChurnPrediction(member);
  const suggestion = getInterventionSuggestion(member);
  const daysSinceLastVisit = getDaysSince(member.lastVisitDate);

  let score = 0;

  // ① リスクスコア（0-100）をそのまま加算（重み: 1.0）
  score += riskResult.score;

  // ② 30日退会確率（0-100）を加算（重み: 0.8）
  score += prediction.probability30Days * 0.8;

  // ③ 60日退会確率（0-100）を加算（重み: 0.5）
  score += prediction.probability60Days * 0.5;

  // ④ 介入優先度（high: 30, medium: 15, low: 0）
  const priorityScore = suggestion.priority === "high" ? 30 : suggestion.priority === "medium" ? 15 : 0;
  score += priorityScore;

  // ⑤ 最終来店からの日数（長いほど優先、最大20ポイント）
  if (daysSinceLastVisit >= 21) {
    score += 20;
  } else if (daysSinceLastVisit >= 14) {
    score += 15;
  } else if (daysSinceLastVisit >= 7) {
    score += 10;
  }

  // ⑥ 高リスク会員かどうか（high risk なら追加ボーナス: 20ポイント）
  if (riskResult.level === "high") {
    score += 20;
  }

  // ⑦ 30日予測が high なら追加ボーナス: 15ポイント
  if (prediction.label30Days === "high") {
    score += 15;
  }

  return score;
}

/**
 * 介入優先キューを取得
 * @param members 会員リスト
 * @returns 優先順位でソートされた会員リスト（上位5名）
 */
export function getPriorityQueue(members: Member[]): PriorityQueueItem[] {
  const queueItems = members.map((member) => {
    const riskResult = calculateRiskScore(member);
    const prediction = getChurnPrediction(member);
    const suggestion = getInterventionSuggestion(member);
    const segment = getMemberSegment(member);

    return {
      id: member.id,
      name: member.name,
      riskScore: riskResult.score,
      probability30Days: prediction.probability30Days,
      probability60Days: prediction.probability60Days,
      priority: suggestion.priority,
      suggestedAction: suggestion.title,
      segment,
      member,
    };
  });

  // 優先順位スコアでソート（高い順）
  const sortedItems = queueItems.sort((a, b) => {
    const scoreA = calculatePriorityScore(a.member);
    const scoreB = calculatePriorityScore(b.member);
    return scoreB - scoreA;
  });

  // 上位5名を返す
  return sortedItems.slice(0, 5);
}




