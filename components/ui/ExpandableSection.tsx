"use client";

import { useId, useState, type ReactNode } from "react";

export type ExpandableSectionProps = {
  /** 見出し（例: 本日の予約） */
  title: string;
  /** 見出し直後に （…） で表示する要約（例: 3件） */
  summary?: string;
  /** スマホでの初期開閉。未指定は閉じた状態 */
  defaultOpen?: boolean;
  children: ReactNode;
  /** ルート要素の追加クラス */
  className?: string;
  /** 開いたとき中身ラッパー（主にスマホの余白調整用） */
  contentClassName?: string;
};

/**
 * スマホ（md未満）のみ折りたたみ。md以上は常に見出し＋中身を表示（アコーディオンUIなし）。
 */
export function ExpandableSection({
  title,
  summary,
  defaultOpen = false,
  children,
  className = "",
  contentClassName = "",
}: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  const summaryPart =
    summary != null && summary !== "" ? (
      <span className="font-semibold text-slate-600">（{summary}）</span>
    ) : null;

  return (
    <div
      className={`bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden md:p-6 ${className}`}
    >
      <button
        type="button"
        className="md:hidden w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left bg-slate-100/90 hover:bg-slate-100 active:bg-slate-200/90 transition-colors border-b border-slate-200/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-inset"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span className="text-base font-bold text-slate-900 leading-snug min-w-0">
          {title}
          {summaryPart}
        </span>
        <span
          className="text-slate-500 text-sm font-medium shrink-0 tabular-nums w-6 text-center"
          aria-hidden
        >
          {open ? "▲" : "▼"}
        </span>
      </button>

      <h2 className="hidden md:block text-xl font-bold mb-4">{title}</h2>

      <div
        id={contentId}
        className={`px-4 pb-4 pt-3 md:px-0 md:pb-0 md:pt-0 ${open ? "block" : "hidden"} md:block ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
