import { calculateRiskScore } from "@/lib/riskScore";
import { getDaysSinceDate, parseVisitIntervalDays } from "@/lib/memberDateUtils";
import { sessionWithConversationTags } from "@/lib/conversationTagAI";
import type {
  ChurnReasonCategory,
  ChurnReasonEstimate,
  ChurnReasonTag,
  ConversationTag,
  Member,
  Session,
} from "@/types";

/**
 * 退会理由タグAI
 * 会員の行動データから推定される退会理由を自動タグとして表示
 * @param member 会員情報
 * @returns 推定退会理由タグ
 */
export function estimateChurnReasons(
  member: Member,
  sessions?: Session[]
): ChurnReasonEstimate {
  const reasons: ChurnReasonTag[] = [];
  const risk = calculateRiskScore(member);

  // 1. 来店間隔拡大
  const visitIntervalDays = parseVisitIntervalDays(member.visitInterval);
  const daysSinceLastVisit = getDaysSinceDate(member.lastVisitDate);

  if (visitIntervalDays > 14 || daysSinceLastVisit > 14) {
    const confidence = Math.min(0.95, 0.62 + (Math.max(visitIntervalDays, daysSinceLastVisit) - 14) / 30);
    pushReason(
      reasons,
      "来店間隔拡大",
      "行動",
      confidence,
      visitIntervalDays > 14
        ? `来店間隔が${visitIntervalDays}日以上空いています`
        : `最終来店から${daysSinceLastVisit}日経過しています`
    );
  }

  // 2. キャンセル履歴
  if (member.hasCancellationHistory === true || member.reservationDifficultyLevel === "difficult") {
    pushReason(
      reasons,
      "予約困難",
      "行動",
      member.reservationDifficultyLevel === "difficult" ? 0.84 : 0.72,
      "キャンセル履歴や予約状況から、予約の取りづらさが見られます"
    );
  }

  // 3. 入会90日以内 かつ high risk
  const daysSinceJoin = getDaysSinceDate(member.joinDate);
  if (daysSinceJoin <= 90 && risk.level === "high") {
    const confidence = Math.min(0.95, 0.73 + (90 - daysSinceJoin) / 300);
    pushReason(
      reasons,
      "初期離脱",
      "継続初期",
      confidence,
      `入会${daysSinceJoin}日以内かつ高リスク状態のため、初期離脱リスクが高まっています`
    );
  }

  // 4-8. 会話タグ由来の推定
  const conversationTags = getConversationTagsFromSessions(sessions, member.name);
  const tagSet = new Set(conversationTags.map((t) => t.tag));

  if (tagSet.has("仕事ストレス")) {
    pushReason(reasons, "仕事ストレス", "生活", 0.71, "会話ログから仕事負荷の上昇が見られます");
  }
  if (tagSet.has("睡眠不足")) {
    pushReason(reasons, "体調悪化", "体調", 0.7, "会話ログから睡眠不足傾向が見られます");
  }
  if (tagSet.has("モチベ低下")) {
    pushReason(reasons, "モチベーション低下", "心理", 0.68, "会話ログからモチベーション低下の兆候があります");
  }
  if (tagSet.has("食事課題")) {
    pushReason(reasons, "成果実感不足リスク", "食事", 0.66, "食事面の課題により成果の実感低下が懸念されます");
  }
  if (tagSet.has("減量課題")) {
    pushReason(reasons, "目標停滞", "目標", 0.67, "減量目標の進捗停滞が示唆されています");
  }

  // 信頼度順にソート（高い順）
  reasons.sort((a, b) => b.confidence - a.confidence);

  return {
    reasons,
    primaryReason: reasons[0]?.tag,
  };
}

function pushReason(
  reasons: ChurnReasonTag[],
  tag: string,
  category: ChurnReasonCategory,
  confidence: number,
  description: string
): void {
  const existing = reasons.find((r) => r.tag === tag);
  const normalizedConfidence = Math.max(0, Math.min(1, Math.round(confidence * 100) / 100));
  const severity: "high" | "medium" = normalizedConfidence >= 0.75 ? "high" : "medium";

  if (existing) {
    if (normalizedConfidence > existing.confidence) {
      existing.confidence = normalizedConfidence;
      existing.description = description;
      existing.category = category;
      existing.severity = severity;
    }
    return;
  }

  reasons.push({
    tag,
    category,
    confidence: normalizedConfidence,
    description,
    severity,
  });
}

function getConversationTagsFromSessions(sessions: Session[] | undefined, memberName: string): ConversationTag[] {
  if (!sessions || sessions.length === 0) return [];

  const recent = sessions
    .filter((s) => (s.memberName || "").trim() === memberName.trim())
    .sort((a, b) => (b.sessionDate || "").localeCompare(a.sessionDate || ""))
    .slice(0, 5)
    .map(sessionWithConversationTags);

  const map = new Map<string, ConversationTag>();
  for (const session of recent) {
    for (const tag of session.tags ?? []) {
      map.set(tag.tag, tag);
    }
  }
  return Array.from(map.values());
}






