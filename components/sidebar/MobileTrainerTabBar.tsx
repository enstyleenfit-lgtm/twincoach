"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppShellRole } from "@/components/sidebar/useResolvedAppRole";
import { persistPreferredAppRole } from "@/components/sidebar/useResolvedAppRole";
import { HQ_SIDEBAR_LINKS, OWNER_SIDEBAR_LINKS } from "@/components/sidebar/sidebarNavPaths";

/** RoleBasedShell の main に付与（タブ高さ＋safe-area 分） */
export const TRAINER_MOBILE_MAIN_PADDING = "pb-20 lg:pb-0";

const TAB_NAV_CLASS =
  "fixed bottom-0 left-0 right-0 z-40 flex min-h-0 w-full max-w-full flex-row items-stretch justify-around border-t border-slate-200 bg-white/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 text-[10px] font-medium leading-tight shadow-[0_-4px_12px_rgba(15,23,42,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90 lg:hidden";

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 19v-1a4 4 0 014-4h2a4 4 0 014 4v1M15 19v-1a3 3 0 013-3h1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTasks({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 5h10M9 12h10M9 19h6M5 5h.01M5 12h.01M5 19h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSession({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h12v12H8V6zM4 8h2v8H4V8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20h16M6 20V9l6-3 6 3v11M9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01M15 17h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 19h16M7 16V11M12 16V8M17 16v-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

type TabDef = {
  href: string;
  label: string;
  Icon: typeof IconHome;
  active: (pathname: string) => boolean;
  persistRole: AppShellRole;
};

const TRAINER_TABS: TabDef[] = [
  {
    href: "/trainer",
    label: "ダッシュボード",
    Icon: IconHome,
    active: (p) => p === "/" || p === "/trainer",
    persistRole: "trainer",
  },
  {
    href: "/members",
    label: "会員一覧",
    Icon: IconUsers,
    active: (p) => p.startsWith("/members"),
    persistRole: "trainer",
  },
  {
    href: "/tasks",
    label: "タスク",
    Icon: IconTasks,
    active: (p) => p.startsWith("/tasks"),
    persistRole: "trainer",
  },
  {
    href: "/session-input",
    label: "セッション入力",
    Icon: IconSession,
    active: (p) => p.startsWith("/session-input"),
    persistRole: "trainer",
  },
];

const STORE_TABS: TabDef[] = [
  {
    href: "/stores",
    label: "店舗一覧",
    Icon: IconBuilding,
    active: (p) => p.startsWith("/stores") || p.startsWith("/store/"),
    persistRole: "store",
  },
  {
    href: "/members",
    label: "会員一覧",
    Icon: IconUsers,
    active: (p) => p.startsWith("/members"),
    persistRole: "store",
  },
  {
    href: "/tasks",
    label: "タスク",
    Icon: IconTasks,
    active: (p) => p.startsWith("/tasks"),
    persistRole: "store",
  },
  {
    href: "/session-input",
    label: "セッション入力",
    Icon: IconSession,
    active: (p) => p.startsWith("/session-input"),
    persistRole: "store",
  },
];

const OWNER_DASH = OWNER_SIDEBAR_LINKS.dashboard;
const HQ_DASH = HQ_SIDEBAR_LINKS.dashboard;

const OWNER_TABS: TabDef[] = [
  {
    href: OWNER_SIDEBAR_LINKS.dashboard,
    label: "ダッシュボード",
    Icon: IconHome,
    active: (p) => p === OWNER_DASH || p === `${OWNER_DASH}/`,
    persistRole: "owner",
  },
  {
    href: OWNER_SIDEBAR_LINKS.stores,
    label: "店舗一覧",
    Icon: IconBuilding,
    active: (p) => p.startsWith(OWNER_SIDEBAR_LINKS.stores),
    persistRole: "owner",
  },
  {
    href: OWNER_SIDEBAR_LINKS.members,
    label: "会員一覧",
    Icon: IconUsers,
    active: (p) => p.startsWith(OWNER_SIDEBAR_LINKS.members),
    persistRole: "owner",
  },
  {
    href: OWNER_SIDEBAR_LINKS.tasks,
    label: "介入タスク",
    Icon: IconTasks,
    active: (p) => p.startsWith(OWNER_SIDEBAR_LINKS.tasks),
    persistRole: "owner",
  },
  {
    href: OWNER_SIDEBAR_LINKS.reports,
    label: "レポート",
    Icon: IconChart,
    active: (p) => p.startsWith(OWNER_SIDEBAR_LINKS.reports),
    persistRole: "owner",
  },
];

const HQ_TABS: TabDef[] = [
  {
    href: HQ_SIDEBAR_LINKS.dashboard,
    label: "ダッシュボード",
    Icon: IconHome,
    active: (p) => p === HQ_DASH || p === `${HQ_DASH}/`,
    persistRole: "hq",
  },
  {
    href: HQ_SIDEBAR_LINKS.stores,
    label: "店舗一覧",
    Icon: IconBuilding,
    active: (p) => p.startsWith(HQ_SIDEBAR_LINKS.stores),
    persistRole: "hq",
  },
  {
    href: HQ_SIDEBAR_LINKS.trainers,
    label: "トレーナー",
    Icon: IconUsers,
    active: (p) => p.startsWith(HQ_SIDEBAR_LINKS.trainers),
    persistRole: "hq",
  },
  {
    href: HQ_SIDEBAR_LINKS.reports,
    label: "レポート",
    Icon: IconChart,
    active: (p) => p.startsWith(HQ_SIDEBAR_LINKS.reports),
    persistRole: "hq",
  },
  {
    href: HQ_SIDEBAR_LINKS.priceRevision,
    label: "価格改定",
    Icon: IconTasks,
    active: (p) => p.startsWith(HQ_SIDEBAR_LINKS.priceRevision),
    persistRole: "hq",
  },
];

const MOBILE_TAB_ROLES: AppShellRole[] = ["trainer", "store", "owner", "hq"];

export function shouldShowMobileTabBar(role: AppShellRole): boolean {
  return MOBILE_TAB_ROLES.includes(role);
}

function tabsForRole(role: AppShellRole): TabDef[] | null {
  if (role === "trainer") return TRAINER_TABS;
  if (role === "store") return STORE_TABS;
  if (role === "owner") return OWNER_TABS;
  if (role === "hq") return HQ_TABS;
  return null;
}

const ARIA_BY_ROLE: Record<AppShellRole, string> = {
  trainer: "店舗向けメインメニュー",
  store: "店舗向けメインメニュー",
  owner: "オーナー向けメインメニュー",
  hq: "本部向けメインメニュー",
};

/** lg 未満で表示。本部 / オーナー / 店舗 / トレーナーそれぞれの主要導線。 */
export function MobileShellTabBar({ role }: { role: AppShellRole }) {
  const pathname = usePathname();
  const tabs = tabsForRole(role);
  if (!tabs) return null;

  const dense = tabs.length > 4;

  return (
    <nav className={TAB_NAV_CLASS} aria-label={ARIA_BY_ROLE[role]}>
      {tabs.map(({ href, label, Icon, active, persistRole }) => {
        const isActive = active(pathname);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => persistPreferredAppRole(persistRole)}
            className={`flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 transition-colors [touch-action:manipulation] ${
              dense ? "text-[9px]" : "px-1 text-[10px]"
            } ${isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Icon className="h-6 w-6 shrink-0" />
            <span className="w-full px-0.5 text-center leading-tight">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** @deprecated 互換のため残す。内部は {@link MobileShellTabBar}。 */
export function MobileTrainerTabBar() {
  return <MobileShellTabBar role="trainer" />;
}
