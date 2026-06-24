"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useResolvedAppRole } from "@/components/sidebar/useResolvedAppRole";
import { LogoutButton } from "@/components/LogoutButton";

const ROLE_LABEL: Record<string, string> = {
  hq: "本部",
  owner: "オーナー",
  store: "店舗",
  trainer: "トレーナー",
};

const ROLE_SCOPE: Record<string, string> = {
  hq: "全店舗",
  owner: "管轄店舗",
  store: "自店舗のみ",
  trainer: "担当範囲",
};

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        enabled ? "bg-blue-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 sm:p-6">
      <h2 className="text-sm font-bold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function StatusBadge({ label }: { label: "PoC中" | "検討中" | "利用中" | "準備中" }) {
  const styles: Record<string, string> = {
    "PoC中": "bg-blue-50 border-blue-200 text-blue-700",
    "検討中": "bg-amber-50 border-amber-200 text-amber-700",
    "利用中": "bg-emerald-50 border-emerald-200 text-emerald-700",
    "準備中": "bg-slate-100 border-slate-200 text-slate-500",
  };
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold ${styles[label]}`}
    >
      {label}
    </span>
  );
}

export default function SettingsClient() {
  const role = useResolvedAppRole();

  const [notif, setNotif] = useState({
    withdrawalRisk: true,
    incompleteTask: true,
    hqMessage: true,
    csvImport: true,
  });

  const [display, setDisplay] = useState({
    kpiCards: true,
    memberRiskBadge: true,
    riskPriority: true,
  });

  const [session, setSession] = useState({
    historyCreate: true,
    supplementalMemo: true,
    exerciseTemplate: false,
    taskPrompt: true,
  });

  const toggleNotif = (key: keyof typeof notif) =>
    setNotif((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleDisplay = (key: keyof typeof display) =>
    setDisplay((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleSession = (key: keyof typeof session) =>
    setSession((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="w-full min-w-0 max-w-full bg-slate-50 min-h-full">
      {/* ページタイトル */}
      <div className="px-4 pt-5 pb-3 sm:px-6 lg:px-8 lg:pt-8">
        <Link
          href="/notifications"
          className="lg:hidden inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors"
        >
          ← お知らせ
        </Link>
        <h1 className="text-xl font-bold text-slate-900">設定</h1>
        <p className="text-sm text-slate-500 mt-0.5">店舗の通知・表示・連携設定を管理</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">

          {/* ===== LEFT COLUMN ===== */}
          <div className="space-y-4">

            {/* 店舗情報 */}
            <SectionCard title="店舗情報">
              <SettingRow label="店舗名">
                <span className="text-sm font-semibold text-slate-700">BodyMake Studio ZERO</span>
              </SettingRow>
              <SettingRow label="ログインロール">
                <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {ROLE_LABEL[role] ?? role}
                </span>
              </SettingRow>
              <SettingRow label="データ閲覧範囲">
                <span className="text-sm font-medium text-slate-600">
                  {ROLE_SCOPE[role] ?? "—"}
                </span>
              </SettingRow>
              <SettingRow label="ログインユーザー">
                <span className="text-sm text-slate-500">佐藤 健太</span>
              </SettingRow>
            </SectionCard>

            {/* 通知設定 */}
            <SectionCard title="通知設定">
              <SettingRow
                label="退会リスク通知"
                description="来店が途絶えた会員をお知らせ"
              >
                <Toggle
                  enabled={notif.withdrawalRisk}
                  onToggle={() => toggleNotif("withdrawalRisk")}
                />
              </SettingRow>
              <SettingRow
                label="未完了タスクリマインド"
                description="本日中に対応が必要なタスクを通知"
              >
                <Toggle
                  enabled={notif.incompleteTask}
                  onToggle={() => toggleNotif("incompleteTask")}
                />
              </SettingRow>
              <SettingRow
                label="本部連絡通知"
                description="本部からの施策・重要連絡を受け取る"
              >
                <Toggle
                  enabled={notif.hqMessage}
                  onToggle={() => toggleNotif("hqMessage")}
                />
              </SettingRow>
              <SettingRow
                label="CSV取り込み完了通知"
                description="データ取り込みが完了したときに通知"
              >
                <Toggle
                  enabled={notif.csvImport}
                  onToggle={() => toggleNotif("csvImport")}
                />
              </SettingRow>
            </SectionCard>

          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="space-y-4 mt-4 lg:mt-0">

            {/* 表示設定 */}
            <SectionCard title="表示設定">
              <SettingRow
                label="ダッシュボードKPIカード"
                description="上部に会員数・LTV・継続率などを表示"
              >
                <Toggle
                  enabled={display.kpiCards}
                  onToggle={() => toggleDisplay("kpiCards")}
                />
              </SettingRow>
              <SettingRow
                label="会員一覧のリスクバッジ"
                description="退会リスクがある会員に赤バッジを表示"
              >
                <Toggle
                  enabled={display.memberRiskBadge}
                  onToggle={() => toggleDisplay("memberRiskBadge")}
                />
              </SettingRow>
              <SettingRow
                label="退会リスク会員を優先表示"
                description="来店間隔が空いた会員を一覧の上位に表示"
              >
                <Toggle
                  enabled={display.riskPriority}
                  onToggle={() => toggleDisplay("riskPriority")}
                />
              </SettingRow>
            </SectionCard>

            {/* セッション入力設定 */}
            <SectionCard title="セッション入力設定">
              <SettingRow
                label="履歴から作成"
                description="前回のセッション内容をもとにメニューを展開"
              >
                <Toggle
                  enabled={session.historyCreate}
                  onToggle={() => toggleSession("historyCreate")}
                />
              </SettingRow>
              <SettingRow
                label="補足メモ欄を表示"
                description="セッション入力時にメモ欄を表示する"
              >
                <Toggle
                  enabled={session.supplementalMemo}
                  onToggle={() => toggleSession("supplementalMemo")}
                />
              </SettingRow>
              <SettingRow
                label="種目テンプレ使用"
                description="よく使う種目セットをテンプレとして登録・呼び出し"
              >
                <Toggle
                  enabled={session.exerciseTemplate}
                  onToggle={() => toggleSession("exerciseTemplate")}
                />
              </SettingRow>
              <SettingRow
                label="タスク作成を促す"
                description="セッション保存後にタスク作成の確認を表示"
              >
                <Toggle
                  enabled={session.taskPrompt}
                  onToggle={() => toggleSession("taskPrompt")}
                />
              </SettingRow>
            </SectionCard>

            {/* データ連携 */}
            <SectionCard title="データ連携">
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 mb-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  現在はPoC期間中です。連携機能の本格設定は今後実装予定です。
                </p>
              </div>
              <SettingRow
                label="CSVインポート"
                description="会員データ・セッションデータの一括取込"
              >
                <StatusBadge label="PoC中" />
              </SettingRow>
              <SettingRow
                label="hacomono連携"
                description="予約・会費管理システムとの自動連携"
              >
                <StatusBadge label="検討中" />
              </SettingRow>
              <SettingRow
                label="kintone連携"
                description="既存kintone環境とのデータ併用"
              >
                <StatusBadge label="検討中" />
              </SettingRow>
            </SectionCard>

            {/* 権限とセキュリティ */}
            <SectionCard title="権限とセキュリティ">
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-4 mb-2">
                <p className="text-xs font-bold text-slate-700 mb-3">ロール別データ閲覧範囲</p>
                <div className="space-y-2">
                  {[
                    {
                      role: "店舗",
                      desc: "自店舗の会員・セッション・タスクのみ",
                      color: "bg-slate-200 text-slate-700",
                    },
                    {
                      role: "オーナー",
                      desc: "管轄店舗すべての情報を閲覧可能",
                      color: "bg-blue-100 text-blue-800",
                    },
                    {
                      role: "本部",
                      desc: "全店舗・本部情報を閲覧可能",
                      color: "bg-indigo-100 text-indigo-800",
                    },
                  ].map((r) => (
                    <div key={r.role} className="flex items-start gap-2">
                      <span
                        className={`shrink-0 mt-0.5 inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${r.color}`}
                      >
                        {r.role}
                      </span>
                      <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <SettingRow
                label="データスコープ制御"
                description="他店舗・他ロールのデータは自動的に非表示"
              >
                <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  有効
                </span>
              </SettingRow>
            </SectionCard>

          </div>
        </div>

        {/* ログアウト */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <p className="text-xs text-slate-400 mb-3">アカウント操作</p>
          <LogoutButton className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50" />
        </div>
      </div>
    </div>
  );
}
