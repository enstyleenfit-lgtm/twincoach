"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { RoleSwitchControl } from "@/components/sidebar/RoleSwitchControl";
import { OWNER_SIDEBAR_LINKS } from "@/components/sidebar/sidebarNavPaths";
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

export function OwnerSidebar() {
  const pathname = usePathname();
  const { dashboard, stores, trainers, members, tasks, reports } =
    OWNER_SIDEBAR_LINKS;

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
        <h1 className={sidebarTitle}>TwinCoach オーナー</h1>
        <RoleSwitchControl />
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              href={dashboard}
              className={linkClass(dashboard)}
              onClick={() => persistPreferredAppRole("owner")}
            >
              ダッシュボード
            </Link>
          </li>
          <li>
            <Link
              href={stores}
              className={linkClass(stores)}
              onClick={() => persistPreferredAppRole("owner")}
            >
              店舗一覧
            </Link>
          </li>
          <li>
            <Link
              href="/stores"
              className={linkClass("/stores")}
              onClick={() => persistPreferredAppRole("owner")}
            >
              店舗運用画面
            </Link>
          </li>
          <li>
            <Link
              href={trainers}
              className={linkClass(trainers)}
              onClick={() => persistPreferredAppRole("owner")}
            >
              トレーナー
            </Link>
          </li>
          <li>
            <Link
              href={members}
              className={linkClass(members)}
              onClick={() => persistPreferredAppRole("owner")}
            >
              会員一覧
            </Link>
          </li>
          <li>
            <Link
              href={tasks}
              className={linkClass(tasks)}
              onClick={() => persistPreferredAppRole("owner")}
            >
              介入タスク
            </Link>
          </li>
          <li>
            <Link
              href={reports}
              className={linkClass(reports)}
              onClick={() => persistPreferredAppRole("owner")}
            >
              レポート
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
