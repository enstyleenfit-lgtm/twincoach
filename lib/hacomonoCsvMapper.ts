import { MemberCreateInput } from "@/types";

type CsvRow = Record<string, string>;

const REQUIRED_COLUMNS = [
  "member_name",
  "plan_name",
  "last_visit_date",
  "store_name",
  "trainer_name",
  "join_date",
  "cancellation_flag",
] as const;

function getColumnsFromRows(rows: CsvRow[]): string[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]);
}

function parseBooleanLike(value: string | undefined): boolean | undefined {
  if (value == null) return undefined;
  const v = value.trim().toLowerCase();
  if (v === "") return undefined;
  if (v === "true" || v === "1" || v === "yes" || v === "y") return true;
  if (v === "false" || v === "0" || v === "no" || v === "n") return false;
  // hacomono想定: cancellation_flag が "1"/"0" 以外のケースもあるため、ここでは undefined
  return undefined;
}

function estimateVisitIntervalFromLastVisit(lastVisitDate: string | undefined): string {
  if (!lastVisitDate) return "";
  // YYYY-MM-DD を想定（違う場合は補完できないので空）
  const d = new Date(lastVisitDate);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  // 「不明」ではなく既定扱いに寄せる（空でもOK。ここでは簡易値を返す）
  return `${days}日`;
}

/**
 * hacomono想定CSVの rows を TwinCoach の MemberCreateInput に変換
 *
 * 入力カラム例:
 * - member_name
 * - plan_name
 * - last_visit_date
 * - store_name
 * - trainer_name
 * - join_date
 * - cancellation_flag
 */
export function mapHacomonoCsvToMembers(rows: CsvRow[]): MemberCreateInput[] {
  if (rows.length === 0) return [];

  const columns = getColumnsFromRows(rows);
  const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length > 0) {
    // 例: member_name カラムが見つかりません
    throw new Error(
      missing.length === 1
        ? `${missing[0]} カラムが見つかりません`
        : `必須カラムが不足しています: ${missing.join(", ")}`
    );
  }

  return rows.map((row) => {
    const name = row["member_name"] ?? "";
    const plan = row["plan_name"] ?? "";
    const lastVisit = row["last_visit_date"] ?? "";
    const storeName = row["store_name"] ?? "";
    const assignedTrainer = row["trainer_name"] || undefined;
    const joinDate = row["join_date"] ?? "";
    const hasCancellationHistory =
      parseBooleanLike(row["cancellation_flag"]) ?? false;

    return {
      name,
      plan,
      // TwinCoachの標準フィールド
      joinDate,
      storeName,
      assignedTrainer,
      // CSVインポート拡張
      lastVisitDate: lastVisit,
      visitInterval: estimateVisitIntervalFromLastVisit(lastVisit),
      hasCancellationHistory,
    };
  });
}


