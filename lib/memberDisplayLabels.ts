/**
 * 会員データは内部で英語のまま保持し、画面表示のみ日本語に揃える
 */

const PLAN_LABEL_MAP: Record<string, string> = {
  Premium: "プレミアム",
  Standard: "スタンダード",
  Basic: "ベーシック",
};

const INTERVENTION_STATUS_LABEL_MAP: Record<string, string> = {
  "High Priority": "高優先",
  Monitor: "経過観察",
  Normal: "通常",
  Urgent: "緊急",
};

export function formatPlanForDisplay(plan: string | null | undefined): string {
  if (plan == null || plan === "") return "-";
  return PLAN_LABEL_MAP[plan] ?? plan;
}

export function formatInterventionStatusForDisplay(
  status: string | null | undefined
): string {
  if (status == null || status === "") return "-";
  return INTERVENTION_STATUS_LABEL_MAP[status] ?? status;
}

/** 例: "3 days" / "1 day" → "3日" / "1日"（数値以外はそのまま） */
export function formatVisitIntervalForDisplay(
  interval: string | null | undefined
): string {
  if (interval == null || interval === "") return "-";
  const trimmed = interval.trim();
  const m = trimmed.match(/^(\d+)\s*days?$/i);
  if (m) return `${m[1]}日`;
  return trimmed;
}
