"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { RoleSwitchControl } from "@/components/sidebar/RoleSwitchControl";
import { HQ_SIDEBAR_LINKS } from "@/components/sidebar/sidebarNavPaths";
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
    priceRevision,
    pocSummary,
    billing,
    inventory,
    helpBoard,
  } = HQ_SIDEBAR_LINKS;

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
        <h1 className={sidebarTitle}>TwinCoach HQ</h1>
        <RoleSwitchControl />
        <span className="mt-2 inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
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
              href={priceRevision}
              className={linkClass(priceRevision)}
              onClick={() => persistPreferredAppRole("hq")}
            >
              価格改定
            </Link>
          </li>
          <li>
            <Link
              href={pocSummary}
              className={linkClass(pocSummary)}
              onClick={() => persistPreferredAppRole("hq")}
            >
              導入効果
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
        </ul>
      </nav>
      <div className={sidebarFooter}>
        <LogoutButton />
      </div>
    </aside>
  );
}
