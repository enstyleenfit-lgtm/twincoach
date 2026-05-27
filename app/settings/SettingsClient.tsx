"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useResolvedAppRole } from "@/components/sidebar/useResolvedAppRole";

const ROLE_LABEL: Record<string, string> = {
  hq: "本部",
  owner: "オーナー",
  store: "店舗",
  trainer: "トレーナー",
};

const ROLE_SCOPE: Record<string, string> = {
  hq: "全店舗",
  owner: "管轄店舗",
  store: "自店舗",
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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
      <h2 className="text-base font-bold text-slate-900 mb-4">{title}</h2>
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
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ComingSoon({ label = "準備中" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
      {label}
    </span>
  );
}

export default function SettingsClient() {
  const role = useResolvedAppRole();

  const [notif, setNotif] = useState({
    updates: true,
    newFeatures: true,
    taskReminder: true,
    unpaidTask: true,
    security: true,
  });

  const [display, setDisplay] = useState({
    kpiCards: true,
    frequentFeatures: true,
    riskPriority: true,
  });

  const toggleNotif = (key: keyof typeof notif) =>
    setNotif((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleDisplay = (key: keyof typeof display) =>
    setDisplay((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">設定</h1>
      <p className="text-slate-500 text-sm mb-4">
        通知・表示・権限・連携設定を管理します
      </p>

      {/* デモ注記 */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-8">
        <p className="text-xs text-amber-700 font-medium">
          現在はデモ設定です。実際の保存機能は今後追加予定です。
        </p>
      </div>

      <div className="space-y-6">
        {/* A. アカウント・閲覧範囲 */}
        <SectionCard title="アカウント・閲覧範囲">
          <SettingRow label="現在のロール">
            <span className="inline-flex items-center rounded border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {ROLE_LABEL[role] ?? role}
            </span>
          </SettingRow>
          <SettingRow
            label="閲覧範囲"
            description="このロールで参照できるデータの範囲"
          >
            <span className="text-sm font-medium text-slate-700">
              {ROLE_SCOPE[role] ?? "—"}
            </span>
          </SettingRow>
          <SettingRow
            label="ロール切替"
            description="サイドバー上部のロールバッジから切替できます"
          >
            <span className="text-xs text-slate-400">サイドバーから変更</span>
          </SettingRow>
        </SectionCard>

        {/* B. 通知設定 */}
        <SectionCard title="通知設定">
          <SettingRow
            label="アップデート通知"
            description="UIや機能の変更お知らせを受け取る"
          >
            <Toggle enabled={notif.updates} onToggle={() => toggleNotif("updates")} />
          </SettingRow>
          <SettingRow
            label="新機能リリース通知"
            description="新機能追加予告・リリース情報を受け取る"
          >
            <Toggle enabled={notif.newFeatures} onToggle={() => toggleNotif("newFeatures")} />
          </SettingRow>
          <SettingRow
            label="介入タスクリマインド"
            description="未対応の介入タスクを定期的にリマインド"
          >
            <Toggle enabled={notif.taskReminder} onToggle={() => toggleNotif("taskReminder")} />
          </SettingRow>
          <SettingRow
            label="未対応タスク通知"
            description="長期未対応タスクが発生したとき通知"
          >
            <Toggle enabled={notif.unpaidTask} onToggle={() => toggleNotif("unpaidTask")} />
          </SettingRow>
          <SettingRow
            label="セキュリティ・運用通知"
            description="権限・セキュリティに関する重要連絡"
          >
            <Toggle enabled={notif.security} onToggle={() => toggleNotif("security")} />
          </SettingRow>
        </SectionCard>

        {/* C. ダッシュボード表示設定 */}
        <SectionCard title="ダッシュボード表示設定">
          <SettingRow
            label="KPIカード表示"
            description="ダッシュボード上部にKPIカードを表示する"
          >
            <Toggle enabled={display.kpiCards} onToggle={() => toggleDisplay("kpiCards")} />
          </SettingRow>
          <SettingRow
            label="よく見る機能を上に表示"
            description="アクセス頻度の高い機能を優先表示する"
          >
            <Toggle
              enabled={display.frequentFeatures}
              onToggle={() => toggleDisplay("frequentFeatures")}
            />
          </SettingRow>
          <SettingRow
            label="リスク・タスクを優先表示"
            description="高リスク会員・未対応タスクを目立たせる"
          >
            <Toggle
              enabled={display.riskPriority}
              onToggle={() => toggleDisplay("riskPriority")}
            />
          </SettingRow>
          <SettingRow
            label="表示順カスタマイズ"
            description="KPIカードや各セクションの並び順を変更する"
          >
            <ComingSoon />
          </SettingRow>
        </SectionCard>

        {/* D. サイドバー設定 */}
        <SectionCard title="サイドバー設定">
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 mb-3">
            <p className="text-xs text-slate-500">
              サイドバーのカスタマイズ（よく使う機能の固定・非表示設定・ロール別メニュー調整）は今後追加予定です。
            </p>
          </div>
          <SettingRow label="よく使う機能の固定">
            <ComingSoon />
          </SettingRow>
          <SettingRow label="不要メニューの非表示">
            <ComingSoon />
          </SettingRow>
          <SettingRow label="ロール別メニュー調整">
            <ComingSoon />
          </SettingRow>
        </SectionCard>

        {/* E. CSV/API連携設定 */}
        <SectionCard title="CSV・API連携設定">
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 mb-3">
            <p className="text-xs text-slate-500">
              本番連携前にセキュリティ要件の確認が必要です。実装準備が整い次第お知らせします。
            </p>
          </div>
          <SettingRow
            label="CSVインポート設定"
            description="会員データ・セッションデータの一括取込"
          >
            <ComingSoon />
          </SettingRow>
          <SettingRow
            label="hacomono API連携"
            description="予約・会費管理システムとの連携"
          >
            <ComingSoon />
          </SettingRow>
          <SettingRow label="kintone連携" description="kintoneとのデータ同期">
            <ComingSoon label="検討中" />
          </SettingRow>
        </SectionCard>

        {/* F. 操作マニュアル */}
        <SectionCard title="操作マニュアル">
          <div className="space-y-2">
            {[
              "本部向けマニュアル",
              "オーナー向けマニュアル",
              "店舗向けマニュアル",
              "トレーナー向けマニュアル",
              "操作動画",
            ].map((label) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <span className="text-xs text-slate-400">準備中</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">今後リンクを追加予定です</p>
        </SectionCard>
      </div>
    </div>
  );
}
