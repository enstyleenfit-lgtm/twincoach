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
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      {trainerNames.length === 0 ? (
        <p className="text-zinc-400 text-center py-8">トレーナーが見つかりません</p>
      ) : (
        <ul className="space-y-2">
          {trainerNames.map((trainerName) => (
            <li key={trainerName}>
              <Link
                href={trainerDetailHref(seg, trainerName)}
                className="block px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-800/50 hover:text-white transition-colors"
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
