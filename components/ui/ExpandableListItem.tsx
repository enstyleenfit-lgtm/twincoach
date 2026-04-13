"use client";

import { useId, type ReactNode } from "react";

export type ExpandableListItemProps = {
  /** 開いているか（親が管理） */
  expanded: boolean;
  onToggle: () => void;
  /** 折りたたみ時に見える要約行の中身 */
  summary: ReactNode;
  /** 展開時の中身 */
  children: ReactNode;
  /** ルートの追加クラス */
  className?: string;
  /** 開いたときのカード背景・枠線（Tailwind クラス文字列） */
  openClassName?: string;
  /** 閉じたときのカード背景・枠線 */
  closedClassName?: string;
};

/**
 * 一覧の1行をアコーディオン化。タスク行・会員行などモバイル一覧で再利用可能。
 */
export function ExpandableListItem({
  expanded,
  onToggle,
  summary,
  children,
  className = "",
  openClassName = "bg-slate-50 border-slate-200",
  closedClassName = "bg-white border-slate-200",
}: ExpandableListItemProps) {
  const contentId = useId();

  return (
    <div
      className={`rounded-lg border shadow-sm transition-colors overflow-hidden ${
        expanded ? openClassName : closedClassName
      } ${className}`}
    >
      <button
        type="button"
        className="w-full text-left flex items-start gap-3 px-3.5 py-3.5 min-h-[3.25rem] bg-slate-100/85 hover:bg-slate-100 active:bg-slate-200/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:ring-inset"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={contentId}
      >
        <div className="min-w-0 flex-1">{summary}</div>
        <span
          className="shrink-0 text-slate-500 text-sm font-medium w-7 text-center pt-0.5"
          aria-hidden
        >
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded ? (
        <div
          id={contentId}
          className="border-t border-slate-200/90 px-3.5 py-3 bg-white/60"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
