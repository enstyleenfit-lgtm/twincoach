"use client";

import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import { trainerDetailHref } from "@/lib/routeContext";

type Props = {
  trainerNames: string[];
};

export function TrainersListBody({ trainerNames }: Props) {
  const seg = useAppRouteSegment();

  if (trainerNames.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center">
        <p className="text-slate-500 text-sm">トレーナーが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {trainerNames.map((trainerName) => (
        <Link
          key={trainerName}
          href={trainerDetailHref(seg, trainerName)}
          className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors text-center"
        >
          <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-500 shrink-0">
            {trainerName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-slate-800 leading-snug break-all">
            {trainerName}
          </span>
        </Link>
      ))}
    </div>
  );
}
