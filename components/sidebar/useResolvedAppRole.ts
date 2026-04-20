"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export type AppShellRole = "hq" | "owner" | "store" | "trainer";

export const PREFERRED_APP_ROLE_STORAGE_KEY = "twincoach:preferredRoleSegment:v1";

export function persistPreferredAppRole(role: AppShellRole): void {
  try {
    window.localStorage.setItem(PREFERRED_APP_ROLE_STORAGE_KEY, role);
  } catch {
    // noop
  }
}

function roleFromPathname(pathname: string): AppShellRole {
  if (pathname.startsWith("/hq")) return "hq";
  if (pathname.startsWith("/owner")) return "owner";
  if (pathname.startsWith("/stores") || pathname.startsWith("/store/")) return "store";
  return "trainer";
}

/**
 * パス名 + localStorage の直近ロール選択を合成した「左サイドバー用ロール」。
 * /members 等の共通ルートでは、遷移のたびに localStorage を読み直す必要がある。
 */
export function useResolvedAppRole(): AppShellRole {
  const pathname = usePathname();
  const [preferredRole, setPreferredRole] = useState<AppShellRole | null>(null);

  useLayoutEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFERRED_APP_ROLE_STORAGE_KEY);
      if (raw === "hq" || raw === "owner" || raw === "store" || raw === "trainer") {
        setPreferredRole(raw);
      } else {
        setPreferredRole(null);
      }
    } catch {
      setPreferredRole(null);
    }
  }, [pathname]);

  return useMemo(() => {
    const inferred = roleFromPathname(pathname);
    if (inferred !== "trainer") return inferred;
    if (pathname.startsWith("/trainer")) return "trainer";
    return preferredRole ?? "trainer";
  }, [pathname, preferredRole]);
}
