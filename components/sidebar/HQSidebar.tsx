"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { RoleSwitchControl } from "@/components/sidebar/RoleSwitchControl";
import { HQ_SIDEBAR_LINKS } from "@/components/sidebar/sidebarNavPaths";
import {
  sidebarAside,
  sidebarFooter,
  sidebarHeader,
  sidebarNavLink,
  sidebarTitle,
} from "@/components/sidebar/sidebarNavClasses";

export function HQSidebar() {
  const {
    dashboard,
    stores,
    trainers,
    reports,
    priceRevision,
    pocSummary,
  } = HQ_SIDEBAR_LINKS;

  return (
    <aside className={sidebarAside}>
      <div className={sidebarHeader}>
        <h1 className={sidebarTitle}>TwinCoach HQ</h1>
        <RoleSwitchControl />
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link href={dashboard} className={sidebarNavLink}>
              ダッシュボード
            </Link>
          </li>
          <li>
            <Link href={stores} className={sidebarNavLink}>
              店舗一覧
            </Link>
          </li>
          <li>
            <Link href={trainers} className={sidebarNavLink}>
              トレーナー一覧
            </Link>
          </li>
          <li>
            <Link href={reports} className={sidebarNavLink}>
              レポート
            </Link>
          </li>
          <li>
            <Link href={priceRevision} className={sidebarNavLink}>
              価格改定
            </Link>
          </li>
          <li>
            <Link href={pocSummary} className={sidebarNavLink}>
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
