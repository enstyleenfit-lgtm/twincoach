"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { HQSidebar } from "@/components/sidebar/HQSidebar";
import {
  MobileTrainerTabBar,
  TRAINER_MOBILE_MAIN_PADDING,
} from "@/components/sidebar/MobileTrainerTabBar";
import { OwnerSidebar } from "@/components/sidebar/OwnerSidebar";
import { TrainerSidebar } from "@/components/sidebar/TrainerSidebar";
import { StoreSidebar } from "@/components/sidebar/StoreSidebar";
import { useResolvedAppRole } from "@/components/sidebar/useResolvedAppRole";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { TrialStoreProvider } from "@/components/store/TrialStoreProvider";

type Props = { children: ReactNode };

export function RoleBasedShell({ children }: Props) {
  const pathname = usePathname();
  const role = useResolvedAppRole();
  const isLoginPage =
    pathname === "/login" || pathname === "/login/";

  /** ログインはアプリシェル（サイドバー・トップバー）を出さず全画面で表示する */
  if (isLoginPage) {
    return (
      <TrialStoreProvider>
        <div
          data-tc-shell="login-bare"
          className="min-h-dvh w-full min-w-0 max-w-full overflow-x-hidden"
        >
          {children}
        </div>
      </TrialStoreProvider>
    );
  }

  const sidebar =
    role === "hq" ? (
      <HQSidebar />
    ) : role === "owner" ? (
      <OwnerSidebar />
    ) : role === "store" ? (
      <StoreSidebar />
    ) : (
      <TrainerSidebar />
    );

  return (
    <TrialStoreProvider>
      <div className="flex min-h-dvh w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 text-slate-900">
        <div
          data-app-sidebar-slot
          className="max-lg:hidden lg:flex lg:w-64 lg:flex-shrink-0"
        >
          {sidebar}
        </div>
        <main
          className={`min-h-0 min-w-0 w-full max-w-full flex-1 basis-0 shrink overflow-x-hidden overflow-y-auto ${
            role === "trainer" ? TRAINER_MOBILE_MAIN_PADDING : ""
          }`}
        >
          <AppTopBar />
          {children}
        </main>
        {role === "trainer" ? <MobileTrainerTabBar /> : null}
      </div>
    </TrialStoreProvider>
  );
}

