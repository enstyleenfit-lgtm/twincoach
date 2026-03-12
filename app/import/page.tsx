"use client";

import { useState } from "react";
import Link from "next/link";
import { parseCsv, mapCsvToMembers, mapCsvToVisits } from "@/lib/csvImport";
import { MemberCreateInput } from "@/types";

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
  const [isSaving, setIsSaving] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errorCount: number;
    errors: Array<{ index: number; data: MemberCreateInput; error: string }>;
  } | null>(null);
  const [parsedMembersData, setParsedMembersData] = useState<MemberCreateInput[]>([]);

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
    setImportResult(null);
    setParsedMembersData([]);
  };

  const handleReadClick = async () => {
    setError(null);
    setInfoMessage(null);
    setRawHeaders([]);
    setPreviewRows([]);
    setImportResult(null);
    setParsedMembersData([]);

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
        const membersData = mapCsvToMembers(parsed.rows);
        setParsedMembersData(membersData);
        const membersPreview = membersData.map((m) => ({
          名前: m.name,
          プラン: m.plan,
          入会日: m.joinDate,
          店舗名: m.storeName,
          担当トレーナー: m.assignedTrainer ?? "",
        }));
        preview = membersPreview;
        setInfoMessage(
          `会員CSVとして読み込みました（${membersData.length}件、まだDBには保存されていません）`
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

  const handleSaveClick = async () => {
    if (target !== "members") {
      setError("現在、会員データの保存のみ対応しています");
      return;
    }

    if (parsedMembersData.length === 0) {
      setError("保存するデータがありません。先にCSVを読み込んでください");
      return;
    }

    setIsSaving(true);
    setError(null);
    setInfoMessage(null);
    setImportResult(null);

    try {
      const response = await fetch("/api/import-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedMembersData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "保存に失敗しました");
      }

      const result = await response.json();
      setImportResult(result);

      if (result.errorCount === 0) {
        setInfoMessage(
          `インポート成功: ${result.successCount}件の会員データを保存しました`
        );
      } else if (result.successCount > 0) {
        setInfoMessage(
          `部分成功: ${result.successCount}件を保存しましたが、${result.errorCount}件でエラーが発生しました`
        );
      } else {
        setError(`インポート失敗: ${result.errorCount}件すべてでエラーが発生しました`);
      }
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "保存中にエラーが発生しました"
      );
    } finally {
      setIsSaving(false);
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
        CSVを読み込んでプレビューを確認後、保存ボタンでSupabaseに保存できます。
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

      {/* 保存ボタン */}
      {previewRows.length > 0 && target === "members" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">データ保存</h2>
              <p className="text-zinc-400 text-sm">
                {parsedMembersData.length}件の会員データをSupabaseに保存します
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={isSaving || parsedMembersData.length === 0}
              className="px-6 py-3 text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      )}

      {/* インポート結果 */}
      {importResult && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">インポート結果</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded p-4">
                <div className="text-green-400 text-sm font-semibold mb-1">
                  成功
                </div>
                <div className="text-2xl font-bold text-green-300">
                  {importResult.successCount}件
                </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded p-4">
                <div className="text-red-400 text-sm font-semibold mb-1">
                  エラー
                </div>
                <div className="text-2xl font-bold text-red-300">
                  {importResult.errorCount}件
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">
                  エラー詳細
                </h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {importResult.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm"
                    >
                      <div className="text-red-400 font-semibold mb-1">
                        行 {err.index + 1}: {err.error}
                      </div>
                      <div className="text-zinc-400 text-xs">
                        名前: {err.data.name || "(未入力)"}, プラン:{" "}
                        {err.data.plan || "(未入力)"}, 店舗名:{" "}
                        {err.data.storeName || "(未入力)"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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



