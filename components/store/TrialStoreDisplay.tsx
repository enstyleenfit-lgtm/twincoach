"use client";

import { useTrialStore } from "@/components/store/TrialStoreProvider";

type Props = {
  className?: string;
  /** ラベル付き（例: 表示店舗: 人形町） */
  withLabel?: boolean;
};

export function TrialStoreDisplay({ className = "", withLabel = true }: Props) {
  const { selectedStore } = useTrialStore();
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold text-slate-900 ${className}`}>
      {withLabel ? <span className="font-medium text-slate-500">表示店舗</span> : null}
      <span className="tabular-nums">{selectedStore.name}</span>
    </span>
  );
}
