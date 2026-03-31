"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

type Role = "hq" | "owner" | "store" | "trainer";

function roleFromPathname(pathname: string): Role {
  if (pathname.startsWith("/hq")) return "hq";
  if (pathname.startsWith("/owner")) return "owner";
  if (pathname.startsWith("/stores") || pathname.startsWith("/store/")) return "store";
  return "trainer";
}

export function RoleSwitchControl() {
  const pathname = usePathname();
  const currentRole = useMemo(() => roleFromPathname(pathname), [pathname]);

  const btn =
    "flex-1 text-center rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors";
  const on =
    "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm";
  const off =
    "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300";

  return (
    <div className="mb-4">
      <div className="flex gap-2">
        <Link href="/hq" className={`${btn} ${currentRole === "hq" ? on : off}`}>
          本部
        </Link>
        <Link
          href="/owner"
          className={`${btn} ${currentRole === "owner" ? on : off}`}
        >
          オーナー
        </Link>
        <Link
          href="/stores"
          className={`${btn} ${currentRole === "store" ? on : off}`}
        >
          店舗
        </Link>
      </div>
    </div>
  );
}
