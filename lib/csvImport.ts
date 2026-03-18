export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * シンプルなCSVパーサー
 * - 1行目をヘッダーとして扱う
 * - カンマ区切り（クオートやエスケープは最小限の対応）
 */
export function parseCsv(text: string): ParsedCsv {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("CSVに有効な行がありません");
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  if (headers.length === 0) {
    throw new Error("CSVヘッダー行が不正です");
  }

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(",").map((c) => c.trim());
    if (columns.length !== headers.length) {
      throw new Error(
        `CSVの列数がヘッダーと一致しません（${i + 1}行目: ${columns.length}列 / ヘッダー: ${headers.length}列）`
      );
    }
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = columns[idx];
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * CSV行を会員データにマッピング
 * 想定カラム:
 * - name
 * - plan
 * - join_date
 * - store_name
 * - assigned_trainer
 */
export function mapCsvToMembers(
  rows: Record<string, string>[]
): {
  name: string;
  plan: string;
  joinDate: string;
  storeName: string;
  assignedTrainer?: string;
}[] {
  return rows.map((row) => ({
    name: row["name"] ?? "",
    plan: row["plan"] ?? "",
    joinDate: row["join_date"] ?? "",
    storeName: row["store_name"] ?? "",
    assignedTrainer: row["assigned_trainer"] || undefined,
  }));
}

/**
 * CSV行を来店履歴データにマッピング
 * 想定カラム:
 * - member_id
 * - visit_date
 */
export function mapCsvToVisits(
  rows: Record<string, string>[]
): {
  memberId: string;
  visitDate: string;
}[] {
  return rows.map((row) => ({
    memberId: row["member_id"] ?? "",
    visitDate: row["visit_date"] ?? "",
  }));
}







