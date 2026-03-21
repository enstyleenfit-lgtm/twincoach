import { calculateRiskScore } from "@/lib/riskScore";
import { estimateChurnReasons } from "@/lib/churnReasonAI";
import { sessionWithConversationTags } from "@/lib/conversationTagAI";
import type {
  ChurnReasonEstimate,
  Member,
  NextActionItem,
  NextActionPriority,
  NextActionSuggestion,
  Session,
} from "@/types";

/** セッション入力保存後に nextAction を会員単位で保持（ローカル） */
export const MEMBER_NEXT_ACTION_STORAGE_KEY = "twincoach:memberNextActionSuggestion:v1";

export type SessionInputRecordForNextAction = {
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  rest: number;
  formRating: "good" | "normal" | "bad";
  formIssues: string[];
  note?: string;
};

export type StoredNextActionPayload = {
  suggestion: NextActionSuggestion;
  updatedAt: string;
};

function isValidSuggestion(s: unknown): s is NextActionSuggestion {
  if (!s || typeof s !== "object") return false;
  const o = s as NextActionSuggestion;
  const pr = o.priority;
  if (pr !== "high" && pr !== "medium" && pr !== "low") return false;
  if (!Array.isArray(o.actions)) return false;
  return o.actions.every(
    (a) =>
      a &&
      typeof a === "object" &&
      typeof (a as NextActionItem).type === "string" &&
      typeof (a as NextActionItem).title === "string" &&
      typeof (a as NextActionItem).description === "string"
  );
}

/**
 * 会員IDに紐づく、セッション入力保存済みの次回提案を読み込む（クライアント専用）
 */
export function readStoredNextActionSuggestion(memberId: string): StoredNextActionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MEMBER_NEXT_ACTION_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, unknown>;
    const entry = map[memberId];
    if (!entry || typeof entry !== "object") return null;
    const payload = entry as { suggestion?: unknown; updatedAt?: string };
    if (typeof payload.updatedAt !== "string" || !isValidSuggestion(payload.suggestion)) return null;
    return { suggestion: payload.suggestion, updatedAt: payload.updatedAt };
  } catch {
    return null;
  }
}

function ratingToJa(r: SessionInputRecordForNextAction["formRating"]): string {
  if (r === "good") return "良い";
  if (r === "normal") return "やや崩れ";
  return "崩れあり";
}

function buildConversationSummaryFromRecords(records: SessionInputRecordForNextAction[]): string {
  const parts: string[] = [];
  for (const r of records) {
    parts.push(`種目:${r.exercise}`);
    parts.push(`動作評価:${ratingToJa(r.formRating)}`);
    if (r.formIssues.length > 0) parts.push(`フォームの癖:${r.formIssues.join("、")}`);
    if (r.note?.trim()) parts.push(`メモ:${r.note.trim()}`);
  }
  parts.push("次回予約: 退館前に確定");
  return parts.join(" / ");
}

function buildMenuSummaryFromRecords(records: SessionInputRecordForNextAction[]): string {
  return records
    .map((r) => {
      const issues = r.formIssues.length ? ` / 癖:${r.formIssues.join("、")}` : "";
      const note = r.note ? ` / メモ:${r.note}` : "";
      return `${r.exercise}: ${r.weight}kg x ${r.reps} x ${r.sets}${issues} / 休憩:${r.rest}s / 評価:${ratingToJa(r.formRating)}${note}`;
    })
    .join("\n");
}

function mergePriority(a: NextActionPriority, b: NextActionPriority): NextActionPriority {
  const order: Record<NextActionPriority, number> = { low: 0, medium: 1, high: 2 };
  return order[a] >= order[b] ? a : b;
}

function appendSessionRecordActions(
  base: NextActionSuggestion,
  records: SessionInputRecordForNextAction[]
): NextActionSuggestion {
  const actions = [...base.actions];
  const add = (item: NextActionItem) => {
    if (!actions.some((a) => a.title === item.title)) actions.push(item);
  };

  const issueSet = new Set<string>();
  for (const r of records) {
    for (const i of r.formIssues) issueSet.add(i);
  }
  if (issueSet.has("肩が前に出る")) {
    add({
      type: "トレーニング",
      title: "肩のフォーム修正を優先",
      description: "肩前方化が継続しているため、可動域と意識づけを優先します。",
    });
  }
  if (issueSet.has("腰が反る")) {
    add({
      type: "トレーニング",
      title: "体幹・股関節の安定化",
      description: "反り腰が出やすいため、ブレーキングと腹圧を優先します。",
    });
  }
  if (issueSet.has("可動域が浅い")) {
    add({
      type: "トレーニング",
      title: "可動域を段階的に拡張",
      description: "重量より関節可動域の確保を優先し、無理のない範囲で深めます。",
    });
  }
  if (issueSet.has("バランス崩れる")) {
    add({
      type: "トレーニング",
      title: "姿勢コントロールの強化",
      description: "バランス崩れを抑えるため、セットアップと片脚の安定を確認します。",
    });
  }

  const badCount = records.filter((r) => r.formRating === "bad").length;
  const normalCount = records.filter((r) => r.formRating === "normal").length;
  if (badCount > 0 || (records.length > 0 && normalCount >= Math.ceil(records.length / 2))) {
    add({
      type: "トレーニング",
      title: "負荷を抑えてフォーム優先",
      description: "動作評価が崩れ気味のため、重量より再現性を優先します。",
    });
  }

  let priority = base.priority;
  if (badCount > 0) priority = mergePriority(priority, "high");
  else if (normalCount > 0 && records.length > 0) priority = mergePriority(priority, "medium");

  return {
    priority,
    actions: actions.slice(0, 5),
  };
}

function buildSyntheticSession(
  member: Member,
  records: SessionInputRecordForNextAction[],
  meta: { sessionId: string; sessionDate: string; trainerName: string }
): Session {
  return {
    id: meta.sessionId,
    memberName: member.name,
    sessionDate: meta.sessionDate,
    menuSummary: buildMenuSummaryFromRecords(records),
    conversationSummary: buildConversationSummaryFromRecords(records),
    nextAction: "最新セッション入力を反映",
    trainerName: meta.trainerName,
    storeName: member.storeName,
  };
}

/**
 * セッション入力保存直後に、最新レコードを反映した次回提案を生成する。
 */
export function generateNextActionsAfterSessionInput(
  member: Member,
  records: SessionInputRecordForNextAction[],
  meta: { sessionId: string; sessionDate: string; trainerName: string }
): NextActionSuggestion {
  if (records.length === 0) {
    return generateNextActions(member, undefined, undefined);
  }
  const synthetic = buildSyntheticSession(member, records, meta);
  const churn = estimateChurnReasons(member, [synthetic]);
  const base = generateNextActions(member, [synthetic], churn);
  return appendSessionRecordActions(base, records);
}

export function persistNextActionSuggestion(memberId: string, suggestion: NextActionSuggestion): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(MEMBER_NEXT_ACTION_STORAGE_KEY);
    const map: Record<string, StoredNextActionPayload> = raw ? (JSON.parse(raw) as Record<string, StoredNextActionPayload>) : {};
    map[memberId] = { suggestion, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(MEMBER_NEXT_ACTION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // 永続化失敗は握りつぶす（入力自体は別キーで保存済み）
  }
}

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
