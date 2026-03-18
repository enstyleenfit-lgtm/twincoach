export interface SimpleMemberCsvRow {
  // 必須
  name: string;
  plan: string;
  lastVisit: string;
  visitInterval: string;
  // 任意
  storeName?: string;
  assignedTrainer?: string;
  hasCancellationHistory?: boolean;
  monthlyRevenue?: number;
  joinDate?: string;
}

const REQUIRED_COLUMNS = ["name", "plan", "lastVisit", "visitInterval"] as const;
const OPTIONAL_COLUMNS = [
  "storeName",
  "assignedTrainer",
  "hasCancellationHistory",
  "monthlyRevenue",
  "joinDate",
] as const;

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value == null) return undefined;
  const v = value.trim().toLowerCase();
  if (v === "") return undefined;
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return undefined;
}

function parseNumber(value: string | undefined): number | undefined {
  if (value == null) return undefined;
  const v = value.trim();
  if (v === "") return undefined;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * hacomono代替のシンプル会員CSVパーサー
 *
 * 想定フォーマット（1行目ヘッダー）:
 * 必須: name,plan,lastVisit,visitInterval
 * 任意: storeName,assignedTrainer,hasCancellationHistory,monthlyRevenue,joinDate
 *
 * - ヘッダー順は不問
 * - 任意カラムは含まれていなくてもOK
 * - 追加のカラムがあっても無視（壊さない）
 */
export function parseCSV(text: string): SimpleMemberCsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("CSVに有効な行がありません");
  }

  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim());
  if (headers.length === 0) {
    throw new Error("CSVヘッダー行が不正です");
  }

  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw new Error(
      `必須カラムが不足しています: ${missing.join(
        ", "
      )}（必須: ${REQUIRED_COLUMNS.join(", ")}）`
    );
  }

  const rows: SimpleMemberCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(",").map((c) => c.trim());
    if (columns.length !== headers.length) {
      throw new Error(
        `CSVの列数がヘッダーと一致しません（${i + 1}行目: ${
          columns.length
        }列 / ヘッダー: ${headers.length}列）`
      );
    }

    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? columns[idx] : undefined;
    };

    const row: SimpleMemberCsvRow = {
      name: get("name") ?? "",
      plan: get("plan") ?? "",
      lastVisit: get("lastVisit") ?? "",
      visitInterval: get("visitInterval") ?? "",
    };

    const storeName = get("storeName");
    if (storeName) row.storeName = storeName;
    const assignedTrainer = get("assignedTrainer");
    if (assignedTrainer) row.assignedTrainer = assignedTrainer;

    const hasCancellationHistory = parseBoolean(get("hasCancellationHistory"));
    if (hasCancellationHistory !== undefined) {
      row.hasCancellationHistory = hasCancellationHistory;
    }

    const monthlyRevenue = parseNumber(get("monthlyRevenue"));
    if (monthlyRevenue !== undefined) row.monthlyRevenue = monthlyRevenue;

    const joinDate = get("joinDate");
    if (joinDate) row.joinDate = joinDate;

    rows.push(row);
  }

  return rows;
}


