"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { TRAINER_APP_BRANDING_TITLE } from "@/lib/trainerBranding";
import { RoleSwitchControl } from "@/components/sidebar/RoleSwitchControl";
import {
  sidebarAside,
  sidebarFooter,
  sidebarHeader,
  sidebarNavLink,
  sidebarTitle,
} from "@/components/sidebar/sidebarNavClasses";

export function TrainerSidebar() {
  return (
    <aside className={sidebarAside}>
      <div className={sidebarHeader}>
        <h1 className={sidebarTitle}>{TRAINER_APP_BRANDING_TITLE}</h1>
        <RoleSwitchControl />
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/trainer" className={sidebarNavLink}>
              今日の予約
            </Link>
          </li>
          <li>
            <Link href="/members" className={sidebarNavLink}>
              会員一覧
            </Link>
          </li>
          <li>
            <Link href="/tasks" className={sidebarNavLink}>
              介入タスク
            </Link>
          </li>
          <li>
            <Link href="/session-input" className={sidebarNavLink}>
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
