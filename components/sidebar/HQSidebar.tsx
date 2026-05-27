"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { RoleSwitchControl } from "@/components/sidebar/RoleSwitchControl";
import { HQ_SIDEBAR_LINKS, COMMON_SIDEBAR_LINKS } from "@/components/sidebar/sidebarNavPaths";
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

export function HQSidebar() {
  const pathname = usePathname();
  const {
    dashboard,
    stores,
    trainers,
    reports,
    ltv,
    billing,
    inventory,
    helpBoard,
    import: importLink,
  } = HQ_SIDEBAR_LINKS;
  const { notifications, settings } = COMMON_SIDEBAR_LINKS;

  const linkClass = (href: string) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `${sidebarNavLinkBase} ${active ? sidebarNavLinkActive : sidebarNavLinkInactive}`;
  };

  return (
    <aside className={sidebarAside}>
      <div className={sidebarHeader}>
        <h1 className={sidebarTitle}>TwinCoach HQ</h1>
        <RoleSwitchControl />
        <span className="mt-2 inline-flex items-center rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/70">
          全店舗管理
        </span>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              href={dashboard}
              className={linkClass(dashboard)}
              onClick={() => persistPreferredAppRole("hq")}
            >
              ダッシュボード
            </Link>
          </li>
          <li>
            <Link
              href={stores}
              className={linkClass(stores)}
              onClick={() => persistPreferredAppRole("hq")}
            >
              店舗一覧
            </Link>
          </li>
          <li>
            <Link
              href={trainers}
              className={linkClass(trainers)}
              onClick={() => persistPreferredAppRole("hq")}
            >
              トレーナー一覧
            </Link>
          </li>
          <li>
            <Link
              href={reports}
              className={linkClass(reports)}
              onClick={() => persistPreferredAppRole("hq")}
            >
              レポート
            </Link>
          </li>
          <li>
            <Link
              href={ltv}
              className={linkClass(ltv)}
              onClick={() => persistPreferredAppRole("hq")}
            >
              LTV管理
            </Link>
          </li>
          <li>
            <Link
              href={billing}
              className={linkClass(billing)}
              onClick={() => persistPreferredAppRole("hq")}
            >
              売上管理
            </Link>
          </li>
          <li>
            <Link
              href={inventory}
              className={linkClass(inventory)}
              onClick={() => persistPreferredAppRole("hq")}
            >
              在庫管理
            </Link>
          </li>
          <li>
            <Link
              href={helpBoard}
              className={linkClass(helpBoard)}
              onClick={() => persistPreferredAppRole("hq")}
            >
              応援掲示板
            </Link>
          </li>
          <li>
            <Link
              href={importLink}
              className={linkClass(importLink)}
              onClick={() => persistPreferredAppRole("hq")}
            >
              CSVインポート
            </Link>
          </li>
          <li className="pt-2 mt-2 border-t border-white/10">
            <Link
              href={notifications}
              className={`${linkClass(notifications)} justify-between`}
              onClick={() => persistPreferredAppRole("hq")}
            >
              お知らせ
              <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500/75 px-1 text-[10px] font-bold text-white">2</span>
            </Link>
          </li>
          <li>
            <Link
              href={settings}
              className={linkClass(settings)}
              onClick={() => persistPreferredAppRole("hq")}
            >
              設定
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
