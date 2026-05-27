"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { RoleSwitchControl } from "@/components/sidebar/RoleSwitchControl";
import { OWNER_SIDEBAR_LINKS } from "@/components/sidebar/sidebarNavPaths";
import { OWNER_STORE_IDS } from "@/lib/trialStore";
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
  const { dashboard, stores, trainers, members, tasks, reports, billing, inventory, helpBoard } =
    OWNER_SIDEBAR_LINKS;

  const linkClass = (href: string) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `${sidebarNavLinkBase} ${active ? sidebarNavLinkActive : sidebarNavLinkInactive}`;
  };

  return (
    <aside className={sidebarAside}>
      <div className={sidebarHeader}>
        <h1 className={sidebarTitle}>TwinCoach オーナー</h1>
        <RoleSwitchControl />
        <span className="mt-2 inline-flex items-center rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/70">
          管轄店舗：{OWNER_STORE_IDS.length}店舗
        </span>
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
              店舗管理
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
          <li>
            <Link
              href={billing}
              className={linkClass(billing)}
              onClick={() => persistPreferredAppRole("owner")}
            >
              売上管理
            </Link>
          </li>
          <li>
            <Link
              href={inventory}
              className={linkClass(inventory)}
              onClick={() => persistPreferredAppRole("owner")}
            >
              在庫管理
            </Link>
          </li>
          <li>
            <Link
              href={helpBoard}
              className={linkClass(helpBoard)}
              onClick={() => persistPreferredAppRole("owner")}
            >
              応援掲示板
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
