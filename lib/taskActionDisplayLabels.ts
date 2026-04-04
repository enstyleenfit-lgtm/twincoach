/**
 * タスクの action は内部で英語のまま保持し、画面表示のみ日本語に揃える
 */

const TASK_ACTION_LABEL_MAP: Record<string, string> = {
  "Follow-up consultation": "フォロー面談",
  "Nutrition plan review": "食事プラン見直し",
  "Progress check": "進捗確認",
  "Emergency intervention": "緊急対応",
  "Workout plan adjustment": "トレーニング内容調整",
  "Initial assessment": "初回評価",
  "Risk assessment review": "リスク見直し",
};

export function formatTaskActionForDisplay(action: string | null | undefined): string {
  if (action == null || action.trim() === "") return "-";
  return TASK_ACTION_LABEL_MAP[action] ?? action;
}
