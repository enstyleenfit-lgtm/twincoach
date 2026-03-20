import { Session } from "@/types";

type CsvRow = Record<string, string>;

const REQUIRED_COLUMNS = [
  "member_name",
  "session_date",
  "menu_summary",
  "conversation_summary",
  "next_action",
  "trainer_name",
  "store_name",
] as const;

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getColumnsFromRows(rows: CsvRow[]): string[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]);
}

/**
 * セッション履歴CSVの rows を Session[] に変換
 *
 * 想定カラム:
 * - member_name
 * - session_date
 * - menu_summary
 * - conversation_summary
 * - next_action
 * - trainer_name
 * - store_name
 */
export function mapSessionCsvToSessions(rows: CsvRow[]): Session[] {
  if (rows.length === 0) return [];

  const columns = getColumnsFromRows(rows);
  const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length > 0) {
    throw new Error(
      missing.length === 1
        ? `${missing[0]} カラムが見つかりません`
        : `必須カラムが不足しています: ${missing.join(", ")}`
    );
  }

  return rows.map((row) => ({
    id: generateId(),
    memberName: row["member_name"] ?? "",
    sessionDate: row["session_date"] ?? "",
    menuSummary: row["menu_summary"] ?? "",
    conversationSummary: row["conversation_summary"] ?? "",
    nextAction: row["next_action"] ?? "",
    trainerName: row["trainer_name"] ?? "",
    storeName: row["store_name"] ?? "",
  }));
}



