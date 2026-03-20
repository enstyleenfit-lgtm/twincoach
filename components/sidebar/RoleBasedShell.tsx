"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { HQSidebar } from "@/components/sidebar/HQSidebar";
import { OwnerSidebar } from "@/components/sidebar/OwnerSidebar";
import { TrainerSidebar } from "@/components/sidebar/TrainerSidebar";

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

  return (
    <div className="flex min-h-screen bg-black text-white">
      {role === "hq" ? <HQSidebar /> : role === "owner" ? <OwnerSidebar /> : <TrainerSidebar />}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

