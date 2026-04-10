"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EXERCISE_MASTERS, type ExerciseMaster } from "@/lib/exerciseMaster";
import { searchExercises } from "@/lib/exerciseSearch";

type Props = {
  /** マスタ行を渡す。append=false で先頭種目へ、true で新規行追加 */
  onPick: (master: ExerciseMaster, append: boolean) => void;
};

export function ExerciseSearchField({ onPick }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchExercises(EXERCISE_MASTERS, query), [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [query, results.length]);

  const showList = open && query.trim().length >= 1 && results.length > 0;

  const pick = (m: ExerciseMaster, append: boolean) => {
    onPick(m, append);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="text-slate-500 text-xs mb-1">種目検索</div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            const m = results[highlight];
            if (m) pick(m, e.shiftKey);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="1文字から検索（種目・かな・器具・部位）"
        autoComplete="off"
        className="w-full min-w-0 rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-300"
        aria-autocomplete="list"
        aria-expanded={showList}
      />
      <p className="mt-1 text-[11px] text-slate-500">
        候補の「1種目へ」で先頭欄に反映、「＋追加」で新しい種目行を増やします。Enter＝1種目へ、Shift+Enter＝追加。
      </p>

      {query.trim().length >= 1 && results.length === 0 && open ? (
        <div className="absolute z-40 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg px-3 py-3 text-sm text-slate-600">
          一致する種目がありません
        </div>
      ) : null}

      {showList ? (
        <ul
          className="absolute z-40 mt-1 max-h-[min(320px,50vh)] w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1"
          role="listbox"
        >
          {results.map((m, i) => (
            <li
              key={m.id}
              role="option"
              aria-selected={i === highlight}
              onMouseEnter={() => setHighlight(i)}
              className={`border-b border-slate-100 last:border-b-0 ${
                i === highlight ? "bg-blue-50/80" : "bg-white"
              }`}
            >
              <div className="px-3 pt-2.5 pb-1">
                <div className="text-slate-900 font-semibold text-[15px] leading-snug">{m.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  （{m.equipment} / {m.bodyPart} / {m.category}）
                </div>
              </div>
              <div className="flex gap-2 px-3 pb-2.5">
                <button
                  type="button"
                  className="flex-1 min-h-[44px] rounded-lg bg-slate-100 border border-slate-200 text-slate-900 text-sm font-semibold hover:bg-slate-200/90 active:scale-[0.99] transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(m, false)}
                >
                  1種目へ
                </button>
                <button
                  type="button"
                  className="flex-1 min-h-[44px] rounded-lg bg-white border border-blue-200 text-blue-800 text-sm font-semibold hover:bg-blue-50 active:scale-[0.99] transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(m, true)}
                >
                  ＋追加
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
