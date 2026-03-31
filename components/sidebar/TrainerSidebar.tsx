"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { TRAINER_APP_BRANDING_TITLE } from "@/lib/trainerBranding";
import { RoleSwitchControl } from "@/components/sidebar/RoleSwitchControl";
import {
  sidebarAside,
  sidebarFooter,
  sidebarHeader,
  sidebarNavLinkActive,
  sidebarNavLinkBase,
  sidebarNavLinkInactive,
  sidebarTitle,
} from "@/components/sidebar/sidebarNavClasses";

export function TrainerSidebar() {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `${sidebarNavLinkBase} ${
      active
        ? `${sidebarNavLinkActive} hover:bg-slate-200 hover:text-slate-900`
        : `${sidebarNavLinkInactive} hover:bg-slate-200`
    }`;
  };

  return (
    <aside className={sidebarAside}>
      <div className={sidebarHeader}>
        <h1 className={sidebarTitle}>{TRAINER_APP_BRANDING_TITLE}</h1>
        <RoleSwitchControl />
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/trainer" className={linkClass("/trainer")}>
              今日の予約
            </Link>
          </li>
          <li>
            <Link href="/members" className={linkClass("/members")}>
              会員一覧
            </Link>
          </li>
          <li>
            <Link href="/tasks" className={linkClass("/tasks")}>
              介入タスク
            </Link>
          </li>
          <li>
            <Link href="/session-input" className={linkClass("/session-input")}>
              セッション入力
            </Link>
          </li>
        </ul>
      </nav>
      <div className={sidebarFooter}>
        <LogoutButton />
      </div>
    </aside>
  );
}
