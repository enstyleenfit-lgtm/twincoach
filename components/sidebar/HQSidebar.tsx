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

export function HQSidebar() {
  const pathname = usePathname();
  const {
    dashboard,
    stores,
    trainers,
    reports,
    priceRevision,
    pocSummary,
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
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link href={dashboard} className={linkClass(dashboard)}>
              ダッシュボード
            </Link>
          </li>
          <li>
            <Link href={stores} className={linkClass(stores)}>
              店舗一覧
            </Link>
          </li>
          <li>
            <Link href={trainers} className={linkClass(trainers)}>
              トレーナー一覧
            </Link>
          </li>
          <li>
            <Link href={reports} className={linkClass(reports)}>
              レポート
            </Link>
          </li>
          <li>
            <Link href={priceRevision} className={linkClass(priceRevision)}>
              価格改定
            </Link>
          </li>
          <li>
            <Link href={pocSummary} className={linkClass(pocSummary)}>
              PoCサマリー
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
