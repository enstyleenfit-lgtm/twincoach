"use client";

import { useState } from "react";
import Link from "next/link";
import { parseCsv, mapCsvToMembers, mapCsvToVisits } from "@/lib/csvImport";
import { parseCSV as parseSimpleMemberCsv } from "@/lib/csvParser";
import { mapHacomonoCsvToMembers } from "@/lib/hacomonoCsvMapper";
import { MemberCreateInput } from "@/types";
import { toMemberFromCreateInput, upsertImportedMembers, upsertImportedSessions } from "@/lib/importStore";
import { addImportHistoryEntry, clearImportHistory, loadImportHistory, type ImportHistoryEntry } from "@/lib/importHistory";
import { mapSessionCsvToSessions } from "@/lib/sessionCsvMapper";

type ImportTarget = "members" | "visits" | "tasks" | "sessions";
type MembersFormat = "twincoach" | "hacomono";

interface PreviewRow {
  [key: string]: string;
}

export default function CsvImportPage() {
  const [fileName, setFileName] = useState<string>("");
  const [target, setTarget] = useState<ImportTarget>("members");
  const [membersFormat, setMembersFormat] = useState<MembersFormat>("twincoach");
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
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[]>([]);

  // 初回だけ履歴をロード
  useState(() => {
    setImportHistory(loadImportHistory());
  });

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

      let preview: PreviewRow[] = [];

      if (target === "members") {
        if (membersFormat === "twincoach") {
          // TwinCoach標準CSV: name,plan,lastVisit,visitInterval (+ optional)
          const simpleRows = parseSimpleMemberCsv(text);
          const today = new Date().toISOString().slice(0, 10);
          const membersData: MemberCreateInput[] = simpleRows.map((row) => ({
            name: row.name,
            plan: row.plan,
            // joinDateは任意。なければ lastVisit → 今日の順で埋める（壊さない）
            joinDate: row.joinDate || row.lastVisit || today,
            // storeNameは任意。なければ暫定値（既存仕様を壊さない）
            storeName: row.storeName || "三軒茶屋本店",
            assignedTrainer: row.assignedTrainer,
            lastVisitDate: row.lastVisit || today,
            visitInterval: row.visitInterval || "0 days",
            hasCancellationHistory: row.hasCancellationHistory,
            monthlyRevenue: row.monthlyRevenue,
          }));

          setParsedMembersData(membersData);
          // 実際のCSVヘッダーは自由なので、ここはテンプレ表示として固定
          setRawHeaders([
            "name",
            "plan",
            "lastVisit",
            "visitInterval",
            "storeName",
            "assignedTrainer",
            "hasCancellationHistory",
            "monthlyRevenue",
            "joinDate",
          ]);

          const membersPreview = simpleRows.map((r) => ({
            名前: r.name,
            プラン: r.plan,
            最終来店日: r.lastVisit,
            来店間隔: r.visitInterval,
            店舗名: r.storeName ?? "",
            担当トレーナー: r.assignedTrainer ?? "",
          }));
          preview = membersPreview;
          setInfoMessage(
            `会員CSV（TwinCoach標準）として読み込みました（${membersData.length}件、まだDBには保存されていません）`
          );
        } else {
          // hacomono想定CSV
      const parsed = parseCsv(text);
      setRawHeaders(parsed.headers);

      if (parsed.rows.length === 0) {
        setInfoMessage("CSVにデータ行がありません");
        setPreviewRows([]);
        return;
      }

          const membersData = mapHacomonoCsvToMembers(parsed.rows);
        setParsedMembersData(membersData);

        const membersPreview = membersData.map((m) => ({
          名前: m.name,
          プラン: m.plan,
            最終来店日: m.lastVisitDate ?? "",
            来店間隔: m.visitInterval ?? "",
          店舗名: m.storeName,
          担当トレーナー: m.assignedTrainer ?? "",
            退会履歴: String(Boolean(m.hasCancellationHistory)),
        }));
        preview = membersPreview;
        setInfoMessage(
            `会員CSV（hacomono想定）として読み込みました（${membersData.length}件、まだDBには保存されていません）`
        );
        }
      } else if (target === "visits") {
        const parsed = parseCsv(text);
        setRawHeaders(parsed.headers);

        if (parsed.rows.length === 0) {
          setInfoMessage("CSVにデータ行がありません");
          setPreviewRows([]);
          return;
        }
        const visitsPreview = mapCsvToVisits(parsed.rows).map((v) => ({
          会員ID: v.memberId,
          来店日: v.visitDate,
        }));
        preview = visitsPreview;
        setInfoMessage(
          "来店履歴CSVとして読み込みました（まだDBには保存されていません）"
        );
      } else if (target === "sessions") {
        const parsed = parseCsv(text);
        setRawHeaders(parsed.headers);

        if (parsed.rows.length === 0) {
          setInfoMessage("CSVにデータ行がありません");
          setPreviewRows([]);
          return;
        }

        const sessions = mapSessionCsvToSessions(parsed.rows);
        // セッションはlocalStorageに保存（PoCでは即反映）
        upsertImportedSessions(sessions);

        preview = sessions.map((s) => ({
          会員名: s.memberName,
          セッション日付: s.sessionDate,
          メニュー要約: s.menuSummary,
          会話要約: s.conversationSummary,
          次回アクション: s.nextAction,
          担当トレーナー: s.trainerName,
          店舗名: s.storeName,
        }));

        setInfoMessage(
          `セッション履歴CSVとして読み込みました（${sessions.length}件、ローカルに保存されました）`
        );

        // 履歴に記録
        setImportHistory(
          addImportHistoryEntry({
            fileFormat: "sessions",
            count: sessions.length,
            successCount: sessions.length,
            errorCount: 0,
          })
        );
      } else {
        const parsed = parseCsv(text);
        setRawHeaders(parsed.headers);

        if (parsed.rows.length === 0) {
          setInfoMessage("CSVにデータ行がありません");
          setPreviewRows([]);
          return;
        }

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
      const msg = e instanceof Error ? e.message : "CSVの読み込み中にエラーが発生しました";
      setError(msg);
      // エラーも履歴に残す（形式/件数は推定）
      const fileFormat =
        target === "members"
          ? membersFormat
          : target === "visits"
          ? "visits"
          : target === "sessions"
          ? "sessions"
          : "tasks";
      setImportHistory(
        addImportHistoryEntry({
          fileFormat,
          count: 0,
          successCount: 0,
          errorCount: 1,
          message: msg,
        })
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

      // ローカル永続（Dashboard/Members/Stores に即反映させる）
      // 保存が成功した分だけ厳密に反映するのは将来対応。PoCでは「読み込んだ会員を反映」で十分。
      try {
        const localMembers = parsedMembersData.map(toMemberFromCreateInput);
        upsertImportedMembers(localMembers);
      } catch (e) {
        console.warn("Failed to persist imported members to localStorage:", e);
      }

      // 履歴に記録（成功/部分成功/失敗を含む）
      setImportHistory(
        addImportHistoryEntry({
          fileFormat: membersFormat,
          count: parsedMembersData.length,
          successCount: Number(result.successCount ?? 0),
          errorCount: Number(result.errorCount ?? 0),
          message:
            Number(result.errorCount ?? 0) > 0
              ? "一部または全件でエラーが発生しました"
              : undefined,
        })
      );

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
      const msg = e instanceof Error ? e.message : "保存中にエラーが発生しました";
      setError(msg);
      // 保存エラーも履歴に記録
      setImportHistory(
        addImportHistoryEntry({
          fileFormat: membersFormat,
          count: parsedMembersData.length,
          successCount: 0,
          errorCount: parsedMembersData.length || 1,
          message: msg,
        })
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

      {/* サンプルCSV形式 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-[280px]">
            <h2 className="text-xl font-semibold mb-2">サンプルCSV形式（会員）</h2>
            <p className="text-zinc-400 text-sm">
              PoCで誰でも迷わず使えるように、取り込み形式を明確化しています。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/sample-members.csv"
              className="px-4 py-2 text-sm bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
              download
            >
              サンプルCSVをダウンロード
            </a>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm font-semibold text-zinc-200 mb-2">
              必須カラム
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {["name", "plan", "lastVisit", "visitInterval"].map((c) => (
                <span
                  key={c}
                  className="px-2 py-1 rounded border border-zinc-800 bg-zinc-900 text-zinc-200"
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              ※ ヘッダーの順番は自由です（必須カラムは必ず含めてください）
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <div className="text-sm font-semibold text-zinc-200 mb-2">
              任意カラム
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                "storeName",
                "assignedTrainer",
                "hasCancellationHistory",
                "monthlyRevenue",
                "joinDate",
              ].map((c) => (
                <span
                  key={c}
                  className="px-2 py-1 rounded border border-zinc-800 bg-zinc-900 text-zinc-200"
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              ※ 任意カラムは未指定でもOKです（指定すると精度が上がります）
            </p>
          </div>
        </div>

        <div className="mt-6 bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm font-semibold text-zinc-200 mb-2">
            サンプル行
          </div>
          <div className="text-xs text-zinc-400 space-y-2">
            <div className="overflow-x-auto">
              <pre className="min-w-max whitespace-pre text-zinc-300">
name,plan,lastVisit,visitInterval,storeName,assignedTrainer,hasCancellationHistory,monthlyRevenue,joinDate
佐藤,月8,2026-03-01,7日,人形町店,田中,false,26000,2025-12-10
              </pre>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-zinc-500">
              <div>
                <span className="text-zinc-300 font-semibold">lastVisit</span>
                : YYYY-MM-DD（例: 2026-03-01）
              </div>
              <div>
                <span className="text-zinc-300 font-semibold">visitInterval</span>
                : 例「7日」「3 days」など（文字列として保持）
              </div>
              <div>
                <span className="text-zinc-300 font-semibold">
                  hasCancellationHistory
                </span>
                : true/false（true, false, 1, 0, yes, no も可）
              </div>
              <div>
                <span className="text-zinc-300 font-semibold">monthlyRevenue</span>
                : 数値（例: 26000）
              </div>
            </div>
          </div>
        </div>
      </div>

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
            <div className="flex gap-2 flex-wrap">
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
              <button
                type="button"
                onClick={() => setTarget("sessions")}
                className={`flex-1 px-3 py-2 rounded-md border text-sm ${
                  target === "sessions"
                    ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                    : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                セッション履歴
              </button>
            </div>

            {target === "members" && (
              <div className="mt-3">
                <div className="text-xs text-zinc-500 mb-2">取り込み種類</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMembersFormat("twincoach")}
                    className={`flex-1 px-3 py-2 rounded-md border text-sm ${
                      membersFormat === "twincoach"
                        ? "bg-zinc-800/60 border-zinc-600 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    TwinCoach標準CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setMembersFormat("hacomono")}
                    className={`flex-1 px-3 py-2 rounded-md border text-sm ${
                      membersFormat === "hacomono"
                        ? "bg-zinc-800/60 border-zinc-600 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    hacomono想定CSV
                  </button>
                </div>
                {membersFormat === "hacomono" && (
                  <p className="text-xs text-zinc-500 mt-2">
                    必須カラム例: member_name, plan_name, last_visit_date,
                    store_name, trainer_name, join_date, cancellation_flag
                  </p>
                )}
              </div>
            )}

            {target === "sessions" && (
              <p className="text-xs text-zinc-500 mt-3">
                必須カラム: member_name, session_date, menu_summary, conversation_summary,
                next_action, trainer_name, store_name
              </p>
            )}
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

      {/* インポート履歴 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mt-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h2 className="text-xl font-semibold">インポート履歴</h2>
            <p className="text-zinc-400 text-sm">
              いつ・何件・どの形式で取り込んだかをローカルに保存します
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearImportHistory();
              setImportHistory([]);
            }}
            className="px-4 py-2 text-sm bg-zinc-950 text-zinc-200 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors"
          >
            履歴をクリア
          </button>
        </div>

        {importHistory.length === 0 ? (
          <p className="text-zinc-400 text-sm">履歴はまだありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800 border-b border-zinc-700">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-300">
                    取り込み日時
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-300">
                    ファイル形式
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-zinc-300">
                    取り込み件数
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-zinc-300">
                    成功
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-zinc-300">
                    エラー
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {importHistory.map((h) => {
                  const date = new Date(h.importedAt);
                  const dateText = Number.isNaN(date.getTime())
                    ? h.importedAt
                    : date.toLocaleString("ja-JP");
                  const ok = h.errorCount === 0;
                  return (
                    <tr key={h.id} className="hover:bg-zinc-800/60 transition-colors">
                      <td className="px-4 py-2 text-zinc-200 whitespace-nowrap">
                        {dateText}
                      </td>
                      <td className="px-4 py-2 text-zinc-200 whitespace-nowrap">
                        {h.fileFormat === "twincoach"
                          ? "TwinCoach標準CSV"
                          : h.fileFormat === "hacomono"
                          ? "hacomono想定CSV"
                          : h.fileFormat === "visits"
                          ? "来店履歴CSV"
                          : "タスクCSV"}
                      </td>
                      <td className="px-4 py-2 text-right text-zinc-200">
                        {h.count.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="text-green-400 font-semibold">
                          {h.successCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-semibold ${ok ? "text-zinc-400" : "text-red-400"}`}>
                          {h.errorCount.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



