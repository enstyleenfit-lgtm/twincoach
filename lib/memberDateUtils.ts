/**
 * 会員の日付・来店間隔のパース（Supabase 等で null が入っても落ちない）
 */

/**
 * 日付文字列から現在日までの日数を計算（無効・欠損は 0）
 */
export function getDaysSinceDate(dateString: string | null | undefined): number {
  if (dateString == null || dateString === "") return 0;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - date.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Number.isFinite(days) ? days : 0;
}

/**
 * 来店間隔文字列（例: "3 days"）から日数を抽出
 */
export function parseVisitIntervalDays(visitInterval: string | null | undefined): number {
  if (visitInterval == null || typeof visitInterval !== "string") return 0;
  const match = visitInterval.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
