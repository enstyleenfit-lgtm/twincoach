"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HQSidebar } from "@/components/sidebar/HQSidebar";
import {
  MobileTrainerTabBar,
  TRAINER_MOBILE_MAIN_PADDING,
} from "@/components/sidebar/MobileTrainerTabBar";
import { OwnerSidebar } from "@/components/sidebar/OwnerSidebar";
import { TrainerSidebar } from "@/components/sidebar/TrainerSidebar";
import { StoreSidebar } from "@/components/sidebar/StoreSidebar";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { TrialStoreProvider } from "@/components/store/TrialStoreProvider";

type Props = { children: ReactNode };
type Role = "hq" | "owner" | "store" | "trainer";

function roleFromPathname(pathname: string): Role {
  if (pathname.startsWith("/hq")) return "hq";
  if (pathname.startsWith("/owner")) return "owner";
  if (pathname.startsWith("/stores") || pathname.startsWith("/store/")) return "store";
  return "trainer";
}

export function RoleBasedShell({ children }: Props) {
  const pathname = usePathname();
  const [preferredRole, setPreferredRole] = useState<Role | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("twincoach:preferredRoleSegment:v1");
      if (raw === "hq" || raw === "owner" || raw === "store" || raw === "trainer") {
        setPreferredRole(raw);
      } else {
        setPreferredRole(null);
      }
    } catch {
      setPreferredRole(null);
    }
  }, []);

  // pathname だけだと /members /tasks /session-input が常に trainer 扱いになり、
  // 店舗ロールで「店舗一覧」「タスク」のラベルが別文言に見える（サイドバーが入れ替わる）ため、
  // ロール切替の直近選択をフォールバックとして利用する。
  const inferred = roleFromPathname(pathname);
  const role: Role =
    inferred !== "trainer"
      ? inferred
      : pathname.startsWith("/trainer")
        ? "trainer"
        : preferredRole ?? "trainer";

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

