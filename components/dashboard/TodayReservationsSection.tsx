"use client";

import Link from "next/link";
import { ExpandableSection } from "@/components/ui/ExpandableSection";
import { memberDetailHref } from "@/lib/routeContext";

export type TodayReservationItem = {
  id: string;
  memberId: string;
  memberName: string;
  time: string;
  type: string;
};

type Props = {
  reservations: TodayReservationItem[];
};

/**
 * トレーナー／店舗ダッシュボードの「本日の予約」。スマホのみ ExpandableSection で折りたたみ。
 */
export function TodayReservationsSection({ reservations }: Props) {
  const count = reservations.length;
  const summary = `${count}件`;

  return (
    <ExpandableSection title="本日の予約" summary={summary} defaultOpen={false}>
      {count > 0 ? (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-slate-100 border border-slate-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <Link
                    href={memberDetailHref("trainer", reservation.memberId)}
                    className="text-blue-800 font-semibold underline decoration-blue-400/70 underline-offset-2 hover:text-blue-900 hover:decoration-blue-600 active:opacity-80 inline-flex min-h-11 items-center py-1 -my-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                  >
                    {reservation.memberName}
                  </Link>
                  <p className="text-slate-600 text-sm">{reservation.type}</p>
                </div>
                <p className="text-blue-700 font-bold shrink-0">{reservation.time}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-600 text-center py-6 md:py-8">
          本日の予約はありません
        </p>
      )}
    </ExpandableSection>
  );
}
