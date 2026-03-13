import { Member } from "@/types";

export interface ChurnReasonTag {
  tag: string;
  confidence: number; // 0-1の信頼度
  description: string;
  severity: "high" | "medium"; // 退会要因（high）または注意要因（medium）
}

export interface ChurnReasonEstimate {
  reasons: ChurnReasonTag[];
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
 * 退会理由タグAI
 * 会員の行動データから推定される退会理由を自動タグとして表示
 * @param member 会員情報
 * @returns 推定退会理由タグ
 */
export function estimateChurnReasons(
  member: Member
): ChurnReasonEstimate {
  const reasons: ChurnReasonTag[] = [];

  // 1. 来店間隔拡大
  const visitIntervalDays = parseVisitInterval(member.visitInterval);
  const daysSinceLastVisit = getDaysSince(member.lastVisitDate);

  if (visitIntervalDays > 14 || daysSinceLastVisit > 14) {
    const confidence = Math.min(
      1.0,
      0.5 + (Math.max(visitIntervalDays, daysSinceLastVisit) - 14) / 20
    );
    reasons.push({
      tag: "来店間隔拡大",
      confidence: Math.round(confidence * 100) / 100,
      description:
        visitIntervalDays > 14
          ? `来店間隔が${visitIntervalDays}日と長くなっています`
          : `最終来店から${daysSinceLastVisit}日経過しています`,
      severity: visitIntervalDays > 21 || daysSinceLastVisit > 21 ? "high" : "medium",
    });
  }

  // 2. 予約困難
  if (member.hasCancellationHistory) {
    reasons.push({
      tag: "予約困難",
      confidence: 0.64,
      description: "キャンセル履歴が多く予約が不安定です",
      severity: "high",
    });
  }

  // 予約の取りづらさも考慮
  if (member.reservationDifficultyLevel === "difficult") {
    reasons.push({
      tag: "予約困難",
      confidence: 0.75,
      description: "希望時間帯の予約が取りづらい状況です",
      severity: "high",
    });
  }

  // 3. 初期離脱
  const daysSinceJoin = getDaysSince(member.joinDate);
  if (daysSinceJoin <= 90) {
    const confidence = Math.min(1.0, 0.6 + (90 - daysSinceJoin) / 90 * 0.3);
    reasons.push({
      tag: "初期離脱",
      confidence: Math.round(confidence * 100) / 100,
      description: `入会から${daysSinceJoin}日目で、初期定着の重要期間です`,
      severity: daysSinceJoin <= 30 ? "high" : "medium",
    });
  }

  // 4. モチベーション低下
  if (visitIntervalDays > 10 && visitIntervalDays <= 14) {
    reasons.push({
      tag: "モチベーション低下",
      confidence: 0.58,
      description: `来店間隔が${visitIntervalDays}日と長めです`,
      severity: "medium",
    });
  }

  // 最終来店から7日以上空いている場合もモチベーション低下の可能性
  if (daysSinceLastVisit >= 7 && daysSinceLastVisit <= 14) {
    reasons.push({
      tag: "モチベーション低下",
      confidence: 0.55,
      description: `最終来店から${daysSinceLastVisit}日経過しています`,
      severity: "medium",
    });
  }

  // 5. 予約時間帯の不一致（希望時間帯と実際の予約時間帯が異なる）
  if (
    member.preferredTimeSlot &&
    member.bookedTimeSlot &&
    member.preferredTimeSlot !== member.bookedTimeSlot
  ) {
    reasons.push({
      tag: "予約困難",
      confidence: 0.68,
      description: "希望時間帯と実際の予約時間帯が異なります",
      severity: "medium",
    });
  }

  // 信頼度順にソート（高い順）
  reasons.sort((a, b) => b.confidence - a.confidence);

  return {
    reasons,
  };
}

