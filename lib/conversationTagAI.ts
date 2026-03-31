import type { ConversationTag, Session } from "@/types";

type Rule = { keywords: string[]; tag: string; category: ConversationTag["category"] };

/**
 * 会話要約テキストからルールベースでタグを抽出（LLM不要）
 */
const TAG_RULES: Rule[] = [
  {
    keywords: ["仕事", "忙しい", "残業", "仕事忙", "オーバーワーク"],
    tag: "仕事ストレス",
    category: "生活",
  },
  {
    keywords: ["睡眠", "寝不足", "眠れ", "眠り"],
    tag: "睡眠不足",
    category: "体調",
  },
  {
    keywords: ["痛い", "痛み", "腰", "肩", "膝", "首", "背中", "股関節"],
    tag: "身体不調",
    category: "体調",
  },
  {
    keywords: ["食事", "飲み会", "間食", "暴飲", "食欲", "カロリー"],
    tag: "食事課題",
    category: "食事",
  },
  {
    keywords: ["やる気", "モチベ", "もちべ", "モチベーション", "気分が乗ら"],
    tag: "モチベ低下",
    category: "心理",
  },
  {
    keywords: ["姿勢", "猫背", "反り腰", "ストレートネック"],
    tag: "姿勢課題",
    category: "姿勢",
  },
  {
    keywords: ["ダイエット", "体重", "減量", "リバウンド", "体型"],
    tag: "減量課題",
    category: "目標",
  },
];

export function extractConversationTags(conversationSummary: string): ConversationTag[] {
  const text = (conversationSummary || "").trim();
  if (!text) return [];

  const seen = new Set<string>();
  const out: ConversationTag[] = [];

  for (const rule of TAG_RULES) {
    if (seen.has(rule.tag)) continue;
    const hit = rule.keywords.some((kw) => {
      const k = kw.trim();
      if (!k) return false;
      return text.includes(k);
    });
    if (hit) {
      seen.add(rule.tag);
      out.push({ tag: rule.tag, category: rule.category });
    }
  }

  return out;
}

/**
 * セッションに tags を付与。既に tags がある場合はそのまま（手動上書き予定にも対応）
 */
export function sessionWithConversationTags(session: Session): Session {
  const existing = session.tags;
  if (existing && existing.length > 0) {
    return session;
  }
  const tags = extractConversationTags(session.conversationSummary);
  return { ...session, tags };
}

/** UI用: カテゴリごとのバッジ（ダーク背景向け） */
export function conversationTagBadgeClass(category: ConversationTag["category"]): string {
  switch (category) {
    case "生活":
      return "text-amber-900 bg-amber-500/15 border-amber-400/35";
    case "体調":
      return "text-rose-200 bg-rose-500/15 border-rose-400/35";
    case "食事":
      return "text-emerald-200 bg-emerald-500/15 border-emerald-400/35";
    case "心理":
      return "text-violet-200 bg-violet-500/15 border-violet-400/35";
    case "姿勢":
      return "text-sky-800 bg-sky-500/15 border-sky-400/35";
    case "目標":
      return "text-teal-200 bg-teal-500/15 border-teal-400/35";
    default:
      return "text-slate-800 bg-slate-200/90 border-slate-300/70";
  }
}
