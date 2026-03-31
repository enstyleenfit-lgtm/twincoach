"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { RoleSwitchControl } from "@/components/sidebar/RoleSwitchControl";
import {
  sidebarAside,
  sidebarFooter,
  sidebarHeader,
  sidebarNavLink,
  sidebarTitle,
} from "@/components/sidebar/sidebarNavClasses";

export function StoreSidebar() {
  return (
    <aside className={sidebarAside}>
      <div className={sidebarHeader}>
        <h1 className={sidebarTitle}>TwinCoach 店舗</h1>
        <RoleSwitchControl />
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/stores" className={sidebarNavLink}>
              店舗一覧
            </Link>
          </li>
          <li>
            <Link href="/members" className={sidebarNavLink}>
              会員一覧
            </Link>
          </li>
          <li>
            <Link href="/tasks" className={sidebarNavLink}>
              タスク
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
