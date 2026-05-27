"use client";

import { useState } from "react";
import { useResolvedAppRole } from "@/components/sidebar/useResolvedAppRole";

type NotificationCategory =
  | "アップデート"
  | "リマインド"
  | "新機能予定"
  | "操作マニュアル"
  | "セキュリティ"
  | "PoC確認";

type NotificationPriority = "high" | "normal" | "done";

type AppRole = "hq" | "owner" | "store" | "trainer";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  date: string;
  isRead: boolean;
  targetRoles?: AppRole[];
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "セッション入力UIを改善しました",
    body: "会員別のセッション入力画面がカード形式になりました。トレーニング内容の見出しカード化・角丸の統一・保存ボタンの文字色修正を実施しました。",
    category: "アップデート",
    priority: "normal",
    date: "2025/05/27",
    isRead: false,
  },
  {
    id: "2",
    title: "介入タスクの表示を2段階アコーディオンに変更しました",
    body: "未対応・対応中・完了の各ステータスグループをクリックで開閉できるようになりました。タスクをクリックすると詳細が展開されます。",
    category: "アップデート",
    priority: "normal",
    date: "2025/05/26",
    isRead: false,
  },
  {
    id: "3",
    title: "5/30 MTG向けにPoC確認項目を整理してください",
    body: "次回のPoC確認MTGに向け、以下の項目を確認してください：①会員継続率の計算ロジック　②高リスク判定基準　③セッション入力フローの操作感",
    category: "PoC確認",
    priority: "high",
    date: "2025/05/25",
    isRead: false,
    targetRoles: ["hq", "owner"],
  },
  {
    id: "4",
    title: "新機能：サイドバーカスタマイズを準備中です",
    body: "各ロールでよく使う機能をサイドバーに固定したり、不要なメニューを非表示にできる機能を準備しています。設定ページからカスタマイズできる予定です。",
    category: "新機能予定",
    priority: "normal",
    date: "2025/05/24",
    isRead: true,
  },
  {
    id: "5",
    title: "CSV/API連携設定は今後追加予定です",
    body: "hacomono・kintoneとのAPI連携、CSVインポート機能を順次対応予定です。実装前にセキュリティ要件の確認が必要です。準備が整い次第お知らせします。",
    category: "新機能予定",
    priority: "normal",
    date: "2025/05/22",
    isRead: true,
  },
  {
    id: "6",
    title: "権限設計とデータスコープを確認してください",
    body: "店舗ロールでは自店舗データのみが表示されること、他店舗データが取得されないことを改めて確認しています。操作中に不審な表示があれば報告してください。",
    category: "セキュリティ",
    priority: "high",
    date: "2025/05/20",
    isRead: true,
    targetRoles: ["hq", "owner"],
  },
  {
    id: "7",
    title: "本部ダッシュボードのレイアウトを改善しました",
    body: "HQダッシュボードのKPIカードを最上部に移動し、本部向け改善提案AIを2カラムレイアウト内に配置しました。",
    category: "アップデート",
    priority: "normal",
    date: "2025/05/20",
    isRead: true,
    targetRoles: ["hq"],
  },
  {
    id: "8",
    title: "操作マニュアルを整備予定です",
    body: "本部/オーナー/店舗それぞれ向けの操作マニュアルおよび動画を整備予定です。準備が整い次第、設定ページから確認できるようになります。",
    category: "操作マニュアル",
    priority: "normal",
    date: "2025/05/18",
    isRead: true,
  },
];

const CATEGORY_FILTERS = [
  "すべて",
  "アップデート",
  "リマインド",
  "新機能予定",
  "PoC確認",
  "セキュリティ",
  "操作マニュアル",
] as const;

function getPriorityBadge(priority: NotificationPriority) {
  if (priority === "high")
    return { label: "重要", className: "bg-red-50 text-red-700 border-red-200" };
  if (priority === "done")
    return { label: "完了", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  return { label: "通常", className: "bg-blue-50 text-blue-700 border-blue-200" };
}

function getCategoryClass(category: NotificationCategory): string {
  const map: Record<NotificationCategory, string> = {
    アップデート: "bg-slate-100 text-slate-700 border-slate-200",
    リマインド: "bg-amber-50 text-amber-700 border-amber-200",
    新機能予定: "bg-violet-50 text-violet-700 border-violet-200",
    操作マニュアル: "bg-sky-50 text-sky-700 border-sky-200",
    セキュリティ: "bg-red-50 text-red-700 border-red-200",
    PoC確認: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return map[category];
}

export default function NotificationsClient() {
  const role = useResolvedAppRole();
  const [filter, setFilter] = useState<(typeof CATEGORY_FILTERS)[number]>("すべて");
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(MOCK_NOTIFICATIONS.filter((n) => n.isRead).map((n) => n.id))
  );

  const filtered = MOCK_NOTIFICATIONS.filter((n) => {
    if (filter !== "すべて" && n.category !== filter) return false;
    return true;
  });

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = () => {
    setReadIds(new Set(MOCK_NOTIFICATIONS.map((n) => n.id)));
  };

  const markRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-bold text-slate-900">お知らせ</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="shrink-0 mt-1 text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            すべて既読にする
          </button>
        )}
      </div>
      <p className="text-slate-500 text-sm mb-6">
        TwinCoachからのアップデート・重要連絡・運用リマインド
      </p>

      {/* フィルタータブ */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              filter === f
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 通知カード一覧 */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center">
            <p className="text-slate-500 text-sm">該当するお知らせはありません</p>
          </div>
        ) : (
          filtered.map((n) => {
            const isRead = readIds.has(n.id);
            const pBadge = getPriorityBadge(n.priority);
            const cClass = getCategoryClass(n.category);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n.id)}
                className={`w-full text-left rounded-xl border bg-white shadow-sm p-4 sm:p-5 transition-colors hover:bg-slate-50 ${
                  isRead ? "border-slate-200 opacity-80" : "border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 未読ドット */}
                  <div className="mt-2 shrink-0 w-2">
                    {!isRead && (
                      <span className="block w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold ${cClass}`}
                      >
                        {n.category}
                      </span>
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold ${pBadge.className}`}
                      >
                        {pBadge.label}
                      </span>
                      <span className="ml-auto text-[11px] text-slate-400 shrink-0">
                        {n.date}
                      </span>
                    </div>
                    <p
                      className={`text-sm font-semibold leading-snug mb-1 ${
                        isRead ? "text-slate-600" : "text-slate-900"
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {n.body}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        {filtered.length}件表示中
        {role && (
          <span className="ml-1">（ロール：{role}）</span>
        )}
      </p>
    </div>
  );
}
