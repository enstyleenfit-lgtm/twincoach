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
        className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
      >
        Demo画面を見る
      </Link>
      <Link
        href={priceRevisionHref(seg)}
        className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
      >
        価格改定影響分析を見る
      </Link>
      <Link
        href={storesListHref(seg)}
        className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
      >
        店舗一覧を見る
      </Link>
      <Link
        href={membersListHref(seg)}
        className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
      >
        会員一覧を見る
      </Link>
      <Link
        href={dashboardHref(seg)}
        className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
      >
        ダッシュボードを見る
      </Link>
    </div>
  );
}
