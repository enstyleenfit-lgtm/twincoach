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
import { AppTopBar } from "@/components/layout/AppTopBar";

type Props = { children: ReactNode };
type Role = "hq" | "owner" | "trainer";

function roleFromPathname(pathname: string): Role {
  if (pathname.startsWith("/hq")) return "hq";
  if (pathname.startsWith("/owner")) return "owner";
  return "trainer";
}

export function RoleBasedShell({ children }: Props) {
  const pathname = usePathname();
  const role = roleFromPathname(pathname);

  const sidebar =
    role === "hq" ? (
      <HQSidebar />
    ) : role === "owner" ? (
      <OwnerSidebar />
    ) : (
      <TrainerSidebar />
    );

  return (
    <div className="flex min-h-dvh w-full min-w-0 max-w-full overflow-x-hidden bg-black text-white">
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
  );
}

