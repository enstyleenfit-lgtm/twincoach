import { calculateRiskScore } from "@/lib/riskScore";
import { estimateChurnReasons } from "@/lib/churnReasonAI";
import { sessionWithConversationTags } from "@/lib/conversationTagAI";
import type {
  ChurnReasonEstimate,
  Member,
  NextActionItem,
  NextActionSuggestion,
  Session,
} from "@/types";

export function generateNextActions(
  member: Member,
  sessions?: Session[],
  churnReasons?: ChurnReasonEstimate
): NextActionSuggestion {
  const risk = calculateRiskScore(member);
  const reasons = churnReasons ?? estimateChurnReasons(member, sessions);
  const actions: NextActionItem[] = [];
  const add = (item: NextActionItem) => {
    if (!actions.some((a) => a.title === item.title)) actions.push(item);
  };

  const tags = collectConversationTagNames(member.name, sessions);
  const reasonTags = new Set(reasons.reasons.map((r) => r.tag));

  if (reasonTags.has("来店間隔拡大")) {
    add({
      type: "行動",
      title: "次回予約をその場で確定",
      description: "来店間隔が空きやすいため、退館前に次回予約を確定します。",
    });
  }
  if (reasonTags.has("仕事ストレス") || tags.has("仕事ストレス")) {
    add({
      type: "会話",
      title: "仕事状況ヒアリング",
      description: "仕事負荷を確認し、無理のない頻度と内容を合意します。",
    });
  }
  if (reasonTags.has("体調悪化") || tags.has("睡眠不足")) {
    add({
      type: "体調",
      title: "軽めメニュー提案",
      description: "睡眠不足や疲労を考慮し、フォーム重視の軽負荷に調整します。",
    });
  }
  if (reasonTags.has("モチベーション低下") || tags.has("モチベ低下")) {
    add({
      type: "心理",
      title: "成功体験の振り返り",
      description: "過去の変化を言語化し、次回までの小さな達成目標を設定します。",
    });
  }
  if (reasonTags.has("目標停滞") || tags.has("減量課題")) {
    add({
      type: "目標",
      title: "食事改善ヒアリング",
      description: "食習慣のボトルネックを特定し、実行しやすい1つの改善に絞ります。",
    });
  }
  if (reasonTags.has("初期離脱")) {
    add({
      type: "継続",
      title: "目標再確認",
      description: "入会時目標とのギャップを確認し、90日の達成ロードマップを再設定します。",
    });
  }

  if (actions.length === 0) {
    add({
      type: "会話",
      title: "コンディション確認",
      description: "直近の体調・生活状況を確認し、次回までの実行項目を1つ決めます。",
    });
  }

  const priority: NextActionSuggestion["priority"] =
    risk.level === "high" ? "high" : risk.level === "medium" ? "medium" : "low";

  return {
    priority,
    actions: actions.slice(0, 5),
  };
}

function collectConversationTagNames(memberName: string, sessions?: Session[]): Set<string> {
  if (!sessions || sessions.length === 0) return new Set<string>();
  const tags = sessions
    .filter((s) => (s.memberName || "").trim() === memberName.trim())
    .sort((a, b) => (b.sessionDate || "").localeCompare(a.sessionDate || ""))
    .slice(0, 5)
    .flatMap((s) => sessionWithConversationTags(s).tags ?? [])
    .map((t) => t.tag);
  return new Set(tags);
}
