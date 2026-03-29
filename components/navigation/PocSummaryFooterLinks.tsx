"use client";

import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import {
  dashboardHref,
  membersListHref,
  priceRevisionHref,
  storesListHref,
} from "@/lib/routeContext";

export function PocSummaryFooterLinks() {
  const seg = useAppRouteSegment();

  return (
    <div className="flex justify-center gap-4 flex-wrap">
      <Link
        href="/demo"
        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
      >
        Demo画面を見る
      </Link>
      <Link
        href={priceRevisionHref(seg)}
        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
      >
        価格改定影響分析を見る
      </Link>
      <Link
        href={storesListHref(seg)}
        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
      >
        店舗一覧を見る
      </Link>
      <Link
        href={membersListHref(seg)}
        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
      >
        会員一覧を見る
      </Link>
      <Link
        href={dashboardHref(seg)}
        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
      >
        ダッシュボードを見る
      </Link>
    </div>
  );
}
