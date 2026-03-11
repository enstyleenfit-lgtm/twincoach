"use client";

import { useState } from "react";
import Link from "next/link";
import { parseCsv, mapCsvToMembers, mapCsvToVisits } from "@/lib/csvImport";

type ImportTarget = "members" | "visits" | "tasks";

interface PreviewRow {
  [key: string]: string;
}

export default function CsvImportPage() {
  const [fileName, setFileName] = useState<string>("");
  const [target, setTarget] = useState<ImportTarget>("members");
  const [error, setError] = useState<string | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName("");
      return;
    }
    setFileName(file.name);
    setError(null);
    setInfoMessage(null);
    setRawHeaders([]);
    setPreviewRows([]);
  };

  const handleReadClick = async () => {
    setError(null);
    setInfoMessage(null);
    setRawHeaders([]);
    setPreviewRows([]);

    const input = document.getElementById(
      "csv-file-input"
    ) as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      setError("CSVファイルが選択されていません");
      return;
    }

    setIsLoading(true);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      setRawHeaders(parsed.headers);

      if (parsed.rows.length === 0) {
        setInfoMessage("CSVにデータ行がありません");
        setPreviewRows([]);
        return;
      }

      let preview: PreviewRow[] = [];

      if (target === "members") {
        const membersPreview = mapCsvToMembers(parsed.rows).map((m) => ({
          名前: m.name,
          プラン: m.plan,
          入会日: m.joinDate,
          店舗名: m.storeName,
          担当トレーナー: m.assignedTrainer ?? "",
        }));
        preview = membersPreview;
        setInfoMessage(
          "会員CSVとして読み込みました（まだDBには保存されていません）"
        );
      } else if (target === "visits") {
        const visitsPreview = mapCsvToVisits(parsed.rows).map((v) => ({
          会員ID: v.memberId,
          来店日: v.visitDate,
        }));
        preview = visitsPreview;
        setInfoMessage(
          "来店履歴CSVとして読み込みました（まだDBには保存されていません）"
        );
      } else {
        // tasks: 今は汎用プレビュー（ヘッダーそのまま表示）
        preview = parsed.rows.map((row) => {
          const obj: PreviewRow = {};
          parsed.headers.forEach((h) => {
            obj[h] = row[h] ?? "";
          });
          return obj;
        });
        setInfoMessage(
          "タスクCSVとして読み込みました（まだDBには保存されていません）"
        );
      }

      setPreviewRows(preview);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "CSVの読み込み中にエラーが発生しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const previewHeaders =
    previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 hover:underline text-sm"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-2">CSVインポート</h1>
      <p className="text-zinc-400 text-sm mb-8">
        hacomono や手元のCSVデータを読み込み、TwinCoachに取り込むための基盤です。
        現在はプレビュー表示のみを行い、DBへの保存は行いません。
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              CSVファイル
            </label>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-500/20 file:text-blue-300
                hover:file:bg-blue-500/30
              "
            />
            {fileName && (
              <p className="text-zinc-500 text-xs mt-1">選択中: {fileName}</p>
            )}
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              インポート対象
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTarget("members")}
                className={`flex-1 px-3 py-2 rounded-md border text-sm ${
                  target === "members"
                    ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                    : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                会員
              </button>
              <button
                type="button"
                onClick={() => setTarget("visits")}
                className={`flex-1 px-3 py-2 rounded-md border text-sm ${
                  target === "visits"
                    ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                    : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                来店履歴
              </button>
              <button
                type="button"
                onClick={() => setTarget("tasks")}
                className={`flex-1 px-3 py-2 rounded-md border text-sm ${
                  target === "tasks"
                    ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                    : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                タスク
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReadClick}
              disabled={isLoading}
              className="self-end px-5 py-2 text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "読み込み中..." : "読み込み"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
            {error}
          </div>
        )}

        {infoMessage && !error && (
          <div className="mt-4 text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded px-3 py-2">
            {infoMessage}
          </div>
        )}

        {rawHeaders.length > 0 && (
          <div className="mt-4 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-400">CSVヘッダー:</span>{" "}
            {rawHeaders.join(", ")}
          </div>
        )}
      </div>

      {/* プレビュー */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">読み込み結果プレビュー</h2>
        {previewRows.length === 0 ? (
          <p className="text-zinc-400 text-sm">
            CSVを読み込むとここに最初の数件が表示されます。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800 border-b border-zinc-700">
                <tr>
                  {previewHeaders.map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 text-left font-semibold text-zinc-300"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {previewRows.slice(0, 20).map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/60 transition-colors">
                    {previewHeaders.map((header) => (
                      <td
                        key={header}
                        className="px-4 py-2 text-zinc-200 whitespace-nowrap"
                      >
                        {row[header] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {previewRows.length > 20 && (
              <p className="text-xs text-zinc-500 mt-2">
                {previewRows.length}件中20件を表示しています。
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


