"use client";

import Link from "next/link";
import {
  persistPreferredAppRole,
  useResolvedAppRole,
} from "@/components/sidebar/useResolvedAppRole";

export function RoleSwitchControl() {
  const currentRole = useResolvedAppRole();

  const btn =
    "flex-1 text-center rounded-lg border px-2 py-1.5 text-xs font-semibold leading-none transition-colors duration-200";
  const on =
    // 選択中は「枠・背景・文字」で判別。hoverでは“色相”を変えず、背景だけグレーで反応させる。
    "border-slate-400 bg-slate-200 text-slate-900 shadow-sm hover:bg-slate-300";
  const off =
    "border-slate-200 bg-white text-slate-700 hover:bg-slate-200 hover:border-slate-300 hover:text-slate-900";

  return (
    <div className="mb-4">
      <div className="flex gap-2">
        <Link
          href="/hq"
          onClick={() => persistPreferredAppRole("hq")}
          className={`${btn} ${currentRole === "hq" ? on : off}`}
        >
          本部
        </Link>
        <Link
          href="/owner"
          onClick={() => persistPreferredAppRole("owner")}
          className={`${btn} ${currentRole === "owner" ? on : off}`}
        >
          オーナー
        </Link>
        <Link
          href="/stores"
          onClick={() => persistPreferredAppRole("store")}
          className={`${btn} ${currentRole === "store" ? on : off}`}
        >
          店舗
        </Link>
      </div>
    </div>
  );
}
