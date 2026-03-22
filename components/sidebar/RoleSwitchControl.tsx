"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

type Role = "hq" | "owner" | "trainer";

function roleFromPathname(pathname: string): Role {
  if (pathname.startsWith("/hq")) return "hq";
  if (pathname.startsWith("/owner")) return "owner";
  return "trainer";
}

export function RoleSwitchControl() {
  const router = useRouter();
  const pathname = usePathname();
  const currentRole = useMemo(() => roleFromPathname(pathname), [pathname]);

  const go = (role: Role) => {
    const nextPath = role === "hq" ? "/hq" : role === "owner" ? "/owner" : "/trainer";
    router.push(nextPath);
  };

  const btn =
    "flex-1 text-center rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors";
  const on =
    "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
  const off = "border-zinc-800 bg-zinc-900/30 text-zinc-300 hover:bg-zinc-800/40";

  return (
    <div className="mb-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => go("hq")}
          className={`${btn} ${currentRole === "hq" ? on : off}`}
        >
          本部
        </button>
        <button
          type="button"
          onClick={() => go("owner")}
          className={`${btn} ${currentRole === "owner" ? on : off}`}
        >
          オーナー
        </button>
        <button
          type="button"
          onClick={() => go("trainer")}
          className={`${btn} ${currentRole === "trainer" ? on : off}`}
        >
          店舗
        </button>
      </div>
    </div>
  );
}

