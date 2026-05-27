"use client";

import { useState } from "react";
import { parseCsv, mapCsvToVisits } from "@/lib/csvImport";
import { parseCSV as parseSimpleMemberCsv } from "@/lib/csvParser";
import { mapHacomonoCsvToMembers } from "@/lib/hacomonoCsvMapper";
import type { MemberCreateInput } from "@/types";
import {
  toMemberFromCreateInput,
  upsertImportedMembers,
  upsertImportedSessions,
} from "@/lib/importStore";
import {
  addImportHistoryEntry,
  clearImportHistory,
  loadImportHistory,
  type ImportHistoryEntry,
} from "@/lib/importHistory";
import { mapSessionCsvToSessions } from "@/lib/sessionCsvMapper";

type ImportTarget = "members" | "visits" | "tasks" | "sessions";
type MembersFormat = "twincoach" | "hacomono";

type CsvCardId =
  | "members_twincoach"
  | "members_hacomono"
  | "visits"
  | "sessions"
  | "tasks"
  | "counseling_soon";

interface CsvTypeCard {
  id: CsvCardId;
  label: string;
  sublabel?: string;
  description: string;
  requiredColumns: string[];
  optionalColumns?: string[];
  comingSoon: boolean;
  target?: ImportTarget;
  membersFormat?: MembersFormat;
}

interface PreviewRow {
  [key: string]: string;
}

const CSV_TYPE_CARDS: CsvTypeCard[] = [
  {
    id: "members_twincoach",
    label: "会員情報",
    sublabel: "TwinCoach標準",
    description: "TwinCoach標準フォーマットの会員データを取り込みます。Supabaseへの保存に対応しています。",
    requiredColumns: ["name", "plan", "lastVisit", "visitInterval"],
    optionalColumns: ["storeName", "assignedTrainer", "hasCancellationHistory", "monthlyRevenue", "joinDate"],
    comingSoon: false,
    target: "members",
    membersFormat: "twincoach",
  },
  {
    id: "members_hacomono",
    label: "会員情報",
    sublabel: "hacomono想定",
    description: "hacomonoからエクスポートした会員CSVを取り込みます。Supabaseへの保存に対応しています。",
    requiredColumns: ["member_name", "plan_name", "last_visit_date", "store_name", "trainer_name", "join_date", "cancellation_flag"],
    comingSoon: false,
    target: "members",
    membersFormat: "hacomono",
  },
  {
    id: "visits",
    label: "来店履歴",
    description: "会員の来店履歴CSVを取り込みます（プレビュー確認のみ・DB保存は準備中）",
    requiredColumns: ["memberId", "visitDate"],
    comingSoon: false,
    target: "visits",
  },
  {
    id: "sessions",
    label: "セッション履歴",
    description: "トレーニングセッション記録CSVを取り込みます（ローカルに保存されます）",
    requiredColumns: ["member_name", "session_date", "menu_summary", "conversation_summary", "next_action", "trainer_name", "store_name"],
    comingSoon: false,
    target: "sessions",
  },
  {
    id: "tasks",
    label: "タスク",
    description: "介入タスクCSVを取り込みます（プレビュー確認のみ・DB保存は準備中）",
    requiredColumns: [],
    comingSoon: false,
    target: "tasks",
  },
  {
    id: "counseling_soon",
    label: "カウンセリング",
    description: "カウンセリング記録のCSV取り込みは準備中です",
    requiredColumns: [],
    comingSoon: true,
  },
];

const FORMAT_LABEL: Record<string, string> = {
  twincoach: "TwinCoach標準CSV",
  hacomono: "hacomono想定CSV",
  visits: "来店履歴CSV",
  sessions: "セッション履歴CSV",
  tasks: "タスクCSV",
};

export default function HQImportPage() {
  const [selectedCardId, setSelectedCardId] = useState<CsvCardId | null>(null);
  const [fileName, setFileName] = useState("");
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
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[]>(() => loadImportHistory());

  const selectedCard = CSV_TYPE_CARDS.find((c) => c.id === selectedCardId) ?? null;

  const resetFileState = () => {
    setFileName("");
    setError(null);
    setInfoMessage(null);
    setRawHeaders([]);
    setPreviewRows([]);
    setImportResult(null);
    setParsedMembersData([]);
  };

  const handleCardSelect = (cardId: CsvCardId) => {
    const card = CSV_TYPE_CARDS.find((c) => c.id === cardId);
    if (!card || card.comingSoon) return;
    setSelectedCardId(cardId);
    resetFileState();
  };

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
    if (!selectedCard || selectedCard.comingSoon || !selectedCard.target) return;

    setError(null);
    setInfoMessage(null);
    setRawHeaders([]);
    setPreviewRows([]);
    setImportResult(null);
    setParsedMembersData([]);

    const input = document.getElementById("hq-csv-file-input") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setError("CSVファイルが選択されていません");
      return;
    }

    const { target, membersFormat } = selectedCard;
    setIsLoading(true);

    try {
      const text = await file.text();
      let preview: PreviewRow[] = [];

      if (target === "members") {
        if (membersFormat === "twincoach") {
          const simpleRows = parseSimpleMemberCsv(text);
          const today = new Date().toISOString().slice(0, 10);
          const membersData: MemberCreateInput[] = simpleRows.map((row) => ({
            name: row.name,
            plan: row.plan,
            joinDate: row.joinDate || row.lastVisit || today,
            storeName: row.storeName || "三軒茶屋本店",
            assignedTrainer: row.assignedTrainer,
            lastVisitDate: row.lastVisit || today,
            visitInterval: row.visitInterval || "0 days",
            hasCancellationHistory: row.hasCancellationHistory,
            monthlyRevenue: row.monthlyRevenue,
          }));
          setParsedMembersData(membersData);
          setRawHeaders(["name", "plan", "lastVisit", "visitInterval", "storeName", "assignedTrainer", "hasCancellationHistory", "monthlyRevenue", "joinDate"]);
          preview = simpleRows.map((r) => ({
            名前: r.name,
            プラン: r.plan,
            最終来店日: r.lastVisit,
            来店間隔: r.visitInterval,
            店舗名: r.storeName ?? "",
            担当トレーナー: r.assignedTrainer ?? "",
          }));
          setInfoMessage(`会員CSV（TwinCoach標準）を読み込みました（${membersData.length}件、まだDBには保存されていません）`);
        } else {
          const parsed = parseCsv(text);
          setRawHeaders(parsed.headers);
          if (parsed.rows.length === 0) {
            setInfoMessage("CSVにデータ行がありません");
            setPreviewRows([]);
            return;
          }
          const membersData = mapHacomonoCsvToMembers(parsed.rows);
          setParsedMembersData(membersData);
          preview = membersData.map((m) => ({
            名前: m.name,
            プラン: m.plan,
            最終来店日: m.lastVisitDate ?? "",
            来店間隔: m.visitInterval ?? "",
            店舗名: m.storeName,
            担当トレーナー: m.assignedTrainer ?? "",
            退会履歴: String(Boolean(m.hasCancellationHistory)),
          }));
          setInfoMessage(`会員CSV（hacomono想定）を読み込みました（${membersData.length}件、まだDBには保存されていません）`);
        }
      } else if (target === "visits") {
        const parsed = parseCsv(text);
        setRawHeaders(parsed.headers);
        if (parsed.rows.length === 0) {
          setInfoMessage("CSVにデータ行がありません");
          setPreviewRows([]);
          return;
        }
        preview = mapCsvToVisits(parsed.rows).map((v) => ({
          会員ID: v.memberId,
          来店日: v.visitDate,
        }));
        setInfoMessage("来店履歴CSVを読み込みました（プレビューのみ・まだDBには保存されていません）");
      } else if (target === "sessions") {
        const parsed = parseCsv(text);
        setRawHeaders(parsed.headers);
        if (parsed.rows.length === 0) {
          setInfoMessage("CSVにデータ行がありません");
          setPreviewRows([]);
          return;
        }
        const sessions = mapSessionCsvToSessions(parsed.rows);
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
        setInfoMessage(`セッション履歴CSVを読み込みました（${sessions.length}件、ローカルに保存されました）`);
        setImportHistory(
          addImportHistoryEntry({ fileFormat: "sessions", count: sessions.length, successCount: sessions.length, errorCount: 0 })
        );
      } else {
        const parsed = parseCsv(text);
        setRawHeaders(parsed.headers);
        if (parsed.rows.length === 0) {
          setInfoMessage("CSVにデータ行がありません");
          setPreviewRows([]);
          return;
        }
        preview = parsed.rows.map((row) => {
          const obj: PreviewRow = {};
          parsed.headers.forEach((h) => { obj[h] = row[h] ?? ""; });
          return obj;
        });
        setInfoMessage("タスクCSVを読み込みました（プレビューのみ・まだDBには保存されていません）");
      }

      setPreviewRows(preview);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "CSVの読み込み中にエラーが発生しました";
      setError(msg);
      const fileFormat = target === "members"
        ? (membersFormat ?? "twincoach")
        : target;
      setImportHistory(
        addImportHistoryEntry({ fileFormat, count: 0, successCount: 0, errorCount: 1, message: msg })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClick = async () => {
    if (!selectedCard || selectedCard.target !== "members" || parsedMembersData.length === 0) return;

    setIsSaving(true);
    setError(null);
    setInfoMessage(null);
    setImportResult(null);

    try {
      const response = await fetch("/api/import-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedMembersData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "保存に失敗しました");
      }
      const result = await response.json();
      setImportResult(result);

      try {
        const localMembers = parsedMembersData.map(toMemberFromCreateInput);
        upsertImportedMembers(localMembers);
      } catch (e) {
        console.warn("Failed to persist imported members to localStorage:", e);
      }

      const fmt = selectedCard.membersFormat ?? "twincoach";
      setImportHistory(
        addImportHistoryEntry({
          fileFormat: fmt,
          count: parsedMembersData.length,
          successCount: Number(result.successCount ?? 0),
          errorCount: Number(result.errorCount ?? 0),
          message: Number(result.errorCount ?? 0) > 0 ? "一部または全件でエラーが発生しました" : undefined,
        })
      );

      if (result.errorCount === 0) {
        setInfoMessage(`インポート成功：${result.successCount}件の会員データを保存しました`);
      } else if (result.successCount > 0) {
        setInfoMessage(`部分成功：${result.successCount}件を保存しましたが、${result.errorCount}件でエラーが発生しました`);
      } else {
        setError(`インポート失敗：${result.errorCount}件すべてでエラーが発生しました`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "保存中にエラーが発生しました";
      setError(msg);
      setImportHistory(
        addImportHistoryEntry({
          fileFormat: selectedCard.membersFormat ?? "twincoach",
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

  const previewHeaders = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];
  const canSave =
    selectedCard?.target === "members" && parsedMembersData.length > 0 && previewRows.length > 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">CSVインポート</h1>
      <p className="text-slate-500 text-sm mb-4">
        PoC開始前に必要な会員・予約・来店履歴データをCSVで準備します
      </p>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-8">
        <p className="text-xs text-amber-700 font-medium">
          現在はPoC準備用です。本番保存・hacomono API連携は今後追加予定です。
        </p>
      </div>

      <div className="space-y-6">
        {/* CSV種別カード */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">CSV種別を選択</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CSV_TYPE_CARDS.map((card) => {
              const isSelected = selectedCardId === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={card.comingSoon}
                  onClick={() => handleCardSelect(card.id)}
                  className={`relative rounded-lg border p-4 text-left transition-colors ${
                    card.comingSoon
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                      : isSelected
                      ? "border-slate-900 bg-slate-900 ring-2 ring-slate-900 ring-offset-1"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {card.comingSoon && (
                    <span className="absolute top-2 right-2 inline-flex items-center rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                      準備中
                    </span>
                  )}
                  <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {card.label}
                  </p>
                  {card.sublabel && (
                    <p className={`mt-0.5 text-[10px] ${isSelected ? "text-white/70" : "text-slate-500"}`}>
                      {card.sublabel}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* サンプル項目 + ファイル選択（種別選択後に表示） */}
        {selectedCard && !selectedCard.comingSoon && (
          <>
            {(selectedCard.requiredColumns.length > 0 || (selectedCard.optionalColumns && selectedCard.optionalColumns.length > 0)) && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                <h2 className="text-base font-bold text-slate-900 mb-1">
                  {selectedCard.label}
                  {selectedCard.sublabel ? `（${selectedCard.sublabel}）` : ""}のCSV形式
                </h2>
                <p className="text-xs text-slate-500 mb-4">{selectedCard.description}</p>
                <div className={`grid gap-4 ${selectedCard.optionalColumns && selectedCard.optionalColumns.length > 0 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                  {selectedCard.requiredColumns.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-700 mb-2">必須カラム</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCard.requiredColumns.map((c) => (
                          <span key={c} className="inline-flex items-center rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCard.optionalColumns && selectedCard.optionalColumns.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-700 mb-2">任意カラム</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCard.optionalColumns.map((c) => (
                          <span key={c} className="inline-flex items-center rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">ファイル選択</h2>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-slate-700 mb-2">CSVファイル</label>
                  <input
                    id="hq-csv-file-input"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-700 file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-slate-200 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                  />
                  {fileName && (
                    <p className="mt-1.5 text-xs text-slate-500">選択中: {fileName}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleReadClick}
                  disabled={isLoading || !fileName}
                  className="shrink-0 rounded-lg border border-slate-900 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? "読み込み中..." : "読み込む"}
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              {infoMessage && !error && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm text-emerald-700">{infoMessage}</p>
                </div>
              )}
              {rawHeaders.length > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">CSVヘッダー: </span>
                  {rawHeaders.join(", ")}
                </p>
              )}
            </div>
          </>
        )}

        {/* プレビュー */}
        {previewRows.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              読み込み結果プレビュー
              <span className="ml-2 text-sm font-normal text-slate-400">（最大20件表示）</span>
            </h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {previewHeaders.map((header) => (
                      <th key={header} className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold text-slate-600">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-slate-50">
                      {previewHeaders.map((header) => (
                        <td key={header} className="whitespace-nowrap px-4 py-2 text-xs text-slate-700">
                          {row[header] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewRows.length > 20 && (
              <p className="mt-2 text-xs text-slate-400">{previewRows.length}件中20件を表示中</p>
            )}
          </div>
        )}

        {/* 保存ボタン（会員のみ） */}
        {canSave && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-bold text-slate-900">Supabaseに保存</p>
                <p className="mt-0.5 text-sm text-slate-500">{parsedMembersData.length}件の会員データを保存します</p>
              </div>
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={isSaving}
                className="shrink-0 rounded-lg border border-emerald-600 bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "保存中..." : "保存する"}
              </button>
            </div>
          </div>
        )}

        {/* インポート結果 */}
        {importResult && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">インポート結果</h2>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-emerald-700 mb-1">成功</p>
                <p className="text-2xl font-bold text-emerald-700">{importResult.successCount}件</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-semibold text-red-700 mb-1">エラー</p>
                <p className="text-2xl font-bold text-red-700">{importResult.errorCount}件</p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700">エラー詳細</p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {importResult.errors.map((err, idx) => (
                    <div key={idx} className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-semibold text-red-700">行 {err.index + 1}: {err.error}</p>
                      <p className="mt-0.5 text-xs text-slate-600">名前: {err.data.name || "(未入力)"}, プラン: {err.data.plan || "(未入力)"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* hacomono API連携 準備中 */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">hacomono API連携</h2>
              <p className="text-sm text-slate-500">
                予約・会費管理システムとの直接連携。セキュリティ要件確認後に実装します。
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center rounded border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
              準備中
            </span>
          </div>
        </div>

        {/* PoC運用方針カード */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">PoCでの運用方針</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            PoC中はCSVで小さく検証し、PoC後にAPI連携範囲を決めます。まずは手元のデータをCSV化してTwinCoachに取り込み、継続率・リスク分析の動作確認を進めてください。本番連携（hacomono API等）はPoC評価後に設計します。
          </p>
        </div>

        {/* インポート履歴 */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">インポート履歴</h2>
              <p className="mt-0.5 text-xs text-slate-500">いつ・何件・どの形式で取り込んだかをローカルに保存します</p>
            </div>
            {importHistory.length > 0 && (
              <button
                type="button"
                onClick={() => { clearImportHistory(); setImportHistory([]); }}
                className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              >
                履歴をクリア
              </button>
            )}
          </div>
          {importHistory.length === 0 ? (
            <p className="text-sm text-slate-400">履歴はまだありません</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">取り込み日時</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">ファイル形式</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">件数</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">成功</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">エラー</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importHistory.map((h) => {
                    const date = new Date(h.importedAt);
                    const dateText = Number.isNaN(date.getTime()) ? h.importedAt : date.toLocaleString("ja-JP");
                    const ok = h.errorCount === 0;
                    return (
                      <tr key={h.id} className="transition-colors hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-700">{dateText}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-700">
                          {FORMAT_LABEL[h.fileFormat] ?? h.fileFormat}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-slate-700">{h.count.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-xs font-semibold text-emerald-700">{h.successCount.toLocaleString()}</td>
                        <td className={`px-4 py-2 text-right text-xs font-semibold ${ok ? "text-slate-400" : "text-red-600"}`}>
                          {h.errorCount.toLocaleString()}
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
    </div>
  );
}
