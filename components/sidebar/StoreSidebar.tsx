"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
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
import { persistPreferredAppRole } from "@/components/sidebar/useResolvedAppRole";
import { STORE_SIDEBAR_LINKS } from "@/components/sidebar/sidebarNavPaths";

export function StoreSidebar() {
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
        <h1 className={sidebarTitle}>TwinCoach 店舗</h1>
        <RoleSwitchControl />
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              href="/members"
              className={linkClass("/members")}
              onClick={() => persistPreferredAppRole("store")}
            >
              会員一覧
            </Link>
          </li>
          <li>
            <Link
              href="/tasks"
              className={linkClass("/tasks")}
              onClick={() => persistPreferredAppRole("store")}
            >
              タスク
            </Link>
          </li>
          <li>
            <Link
              href="/session-input"
              className={linkClass("/session-input")}
              onClick={() => persistPreferredAppRole("store")}
            >
              セッション入力
            </Link>
          </li>
          <li>
            <Link
              href={STORE_SIDEBAR_LINKS.inventory}
              className={linkClass(STORE_SIDEBAR_LINKS.inventory)}
              onClick={() => persistPreferredAppRole("store")}
            >
              在庫管理
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
