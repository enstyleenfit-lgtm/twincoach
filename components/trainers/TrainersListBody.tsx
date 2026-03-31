"use client";

import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import { trainerDetailHref } from "@/lib/routeContext";

type Props = {
  trainerNames: string[];
};

export function TrainersListBody({ trainerNames }: Props) {
  const seg = useAppRouteSegment();

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
      {trainerNames.length === 0 ? (
        <p className="text-slate-600 text-center py-8">トレーナーが見つかりません</p>
      ) : (
        <ul className="space-y-2">
          {trainerNames.map((trainerName) => (
            <li key={trainerName}>
              <Link
                href={trainerDetailHref(seg, trainerName)}
                className="block px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100/80 hover:text-slate-900 transition-colors"
              >
                {trainerName}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
