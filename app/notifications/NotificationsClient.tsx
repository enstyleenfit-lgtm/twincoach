"use client";

import { useState } from "react";
import Link from "next/link";

type NotificationKind = "要対応" | "本部連絡" | "タスク" | "システム" | "店舗運営";
type NotificationPriority = "urgent" | "high" | "normal";

type NotificationItem = {
  id: string;
  kind: NotificationKind;
  priority: NotificationPriority;
  title: string;
  body: string;
  date: string;
  time: string;
  isRead: boolean;
  actionLabel?: string;
  actionHref?: string;
};

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    kind: "要対応",
    priority: "urgent",
    title: "来店間隔が空いている会員がいます",
    body: "田中 さくら さんが前回来店から21日経過しています。退会リスクが高まっています。早めに連絡・次回予約の確認をお願いします。",
    date: "6/24",
    time: "9:15",
    isRead: false,
    actionLabel: "会員を確認する",
    actionHref: "/members",
  },
  {
    id: "2",
    kind: "本部連絡",
    priority: "high",
    title: "今月の退会予防重点項目",
    body: "6月は入会3ヶ月前後の会員が離脱しやすい時期です。セッション後のフォロー声がけと次回予約確認を徹底してください。",
    date: "6/23",
    time: "10:00",
    isRead: false,
    actionLabel: "詳細を確認",
    actionHref: "/notifications",
  },
  {
    id: "3",
    kind: "タスク",
    priority: "normal",
    title: "未完了の介入タスクがあります",
    body: "「次回予約を確認する」「フォローアップ連絡」など3件のタスクが未完了です。本日中の対応をお願いします。",
    date: "6/24",
    time: "8:00",
    isRead: false,
    actionLabel: "タスク一覧へ",
    actionHref: "/tasks",
  },
  {
    id: "4",
    kind: "店舗運営",
    priority: "normal",
    title: "プロテイン在庫の確認が必要です",
    body: "ホエイプロテイン（バニラ）の残数が少なくなっています。在庫管理ページで現在の在庫を確認し、必要であれば発注手配をお願いします。",
    date: "6/23",
    time: "16:30",
    isRead: false,
    actionLabel: "在庫を確認",
    actionHref: "/store/inventory",
  },
  {
    id: "5",
    kind: "システム",
    priority: "normal",
    title: "CSV取り込みが完了しました",
    body: "会員データ（2026/06/20分）のCSV取り込みが正常に完了しました。会員一覧で最新データをご確認ください。",
    date: "6/20",
    time: "12:05",
    isRead: true,
    actionLabel: "会員一覧を確認",
    actionHref: "/members",
  },
  {
    id: "6",
    kind: "本部連絡",
    priority: "normal",
    title: "6月の注力施策：体験セッションの成約率向上",
    body: "今月は体験セッション後の成約トークスクリプトを見直しています。次の体験セッションから活用してください。",
    date: "6/18",
    time: "10:00",
    isRead: true,
  },
  {
    id: "7",
    kind: "システム",
    priority: "normal",
    title: "セッション入力UIを更新しました",
    body: "セッション入力画面のUIを改善しました。種目選択がカード形式になり、保存ボタンが常に画面下部に表示されるようになりました。",
    date: "6/15",
    time: "9:00",
    isRead: true,
  },
  {
    id: "8",
    kind: "要対応",
    priority: "high",
    title: "退会リスク会員が5名います",
    body: "今月の来店数が0〜1回の会員が5名確認されています。早めに次回予約の促進を行ってください。",
    date: "6/10",
    time: "9:00",
    isRead: true,
    actionLabel: "会員を確認する",
    actionHref: "/members",
  },
];

const FILTERS = ["すべて", "未読", "要対応", "本部連絡", "システム", "店舗運営", "タスク"] as const;
type FilterType = (typeof FILTERS)[number];

function kindStyle(kind: NotificationKind): string {
  const map: Record<NotificationKind, string> = {
    要対応: "bg-red-50 border-red-200 text-red-700",
    本部連絡: "bg-blue-50 border-blue-200 text-blue-700",
    タスク: "bg-amber-50 border-amber-200 text-amber-700",
    システム: "bg-slate-100 border-slate-200 text-slate-600",
    店舗運営: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  return map[kind];
}

function priorityAccent(priority: NotificationPriority): string {
  if (priority === "urgent") return "border-l-4 border-l-red-400";
  if (priority === "high") return "border-l-4 border-l-orange-400";
  return "";
}

export default function NotificationsClient() {
  const [filter, setFilter] = useState<FilterType>("すべて");
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(NOTIFICATIONS.filter((n) => n.isRead).map((n) => n.id))
  );

  const markRead = (id: string) =>
    setReadIds((prev) => new Set([...prev, id]));

  const markAllRead = () =>
    setReadIds(new Set(NOTIFICATIONS.map((n) => n.id)));

  const filtered = NOTIFICATIONS.filter((n) => {
    if (filter === "未読") return !readIds.has(n.id);
    if (filter === "すべて") return true;
    return n.kind === filter;
  });

  const unreadCount = NOTIFICATIONS.filter((n) => !readIds.has(n.id)).length;
  const urgentCount = NOTIFICATIONS.filter((n) => !readIds.has(n.id) && n.kind === "要対応").length;
  const hqCount = NOTIFICATIONS.filter((n) => !readIds.has(n.id) && n.kind === "本部連絡").length;
  const sysCount = NOTIFICATIONS.filter((n) => !readIds.has(n.id) && (n.kind === "システム" || n.kind === "店舗運営")).length;

  return (
    <div className="w-full min-w-0 max-w-full bg-slate-50 min-h-full">
      {/* ページタイトル */}
      <div className="px-4 pt-5 pb-3 sm:px-6 lg:px-8 lg:pt-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">お知らせ</h1>
          <p className="text-sm text-slate-500 mt-0.5">店舗運営に必要な通知を確認</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="shrink-0 mt-1 text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            すべて既読
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 lg:pb-12">

        {/* サマリーカード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "未読", count: unreadCount, color: "text-slate-900", bg: "bg-white", border: "border-slate-100" },
            { label: "要対応", count: urgentCount, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
            { label: "本部連絡", count: hqCount, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
            { label: "システム通知", count: sysCount, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} ${s.border} border rounded-2xl shadow-sm px-4 py-3`}
            >
              <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* フィルタータブ */}
        <div className="flex gap-2 flex-wrap mb-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                filter === f
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f}
              {f === "未読" && unreadCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 通知カード一覧 */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
              <p className="text-slate-400 text-sm">該当するお知らせはありません</p>
            </div>
          ) : (
            filtered.map((n) => {
              const isRead = readIds.has(n.id);
              return (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`rounded-2xl border shadow-sm overflow-hidden cursor-pointer transition-colors ${
                    isRead
                      ? "bg-white border-slate-100"
                      : "bg-blue-50/50 border-blue-200/70"
                  } ${priorityAccent(n.priority)}`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      {/* 未読ドット */}
                      <div className="mt-1.5 shrink-0 w-2">
                        {!isRead && (
                          <span className="block w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* バッジ行 */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span
                            className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold ${kindStyle(n.kind)}`}
                          >
                            {n.kind}
                          </span>
                          {n.priority === "urgent" && (
                            <span className="inline-flex items-center rounded-lg border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              至急
                            </span>
                          )}
                          {n.priority === "high" && (
                            <span className="inline-flex items-center rounded-lg border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                              重要
                            </span>
                          )}
                          <span className="ml-auto text-[11px] text-slate-400 shrink-0">
                            {n.date} {n.time}
                          </span>
                        </div>

                        {/* タイトル */}
                        <p
                          className={`text-sm font-bold leading-snug mb-1 ${
                            isRead ? "text-slate-500" : "text-slate-900"
                          }`}
                        >
                          {n.title}
                        </p>

                        {/* 本文 */}
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {n.body}
                        </p>

                        {/* アクションボタン */}
                        {n.actionLabel && n.actionHref && (
                          <div className="mt-3">
                            <Link
                              href={n.actionHref}
                              onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                              className={`inline-flex items-center gap-1 rounded-xl border px-4 py-1.5 text-xs font-bold transition-colors ${
                                n.priority === "urgent"
                                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  : n.priority === "high"
                                    ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {n.actionLabel} →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          {filtered.length}件表示中
        </p>
      </div>
    </div>
  );
}
