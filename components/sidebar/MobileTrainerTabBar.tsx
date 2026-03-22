"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** RoleBasedShell の main に付与（タブ高さ＋safe-area 分） */
export const TRAINER_MOBILE_MAIN_PADDING = "pb-20 lg:pb-0";

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

type TabDef = {
  href: string;
  label: string;
  Icon: typeof IconHome;
  active: (pathname: string) => boolean;
};

const TABS: TabDef[] = [
  {
    href: "/trainer",
    label: "ダッシュボード",
    Icon: IconHome,
    active: (p) => p === "/" || p === "/trainer",
  },
  {
    href: "/members",
    label: "会員一覧",
    Icon: IconUsers,
    active: (p) => p.startsWith("/members"),
  },
  {
    href: "/tasks",
    label: "タスク",
    Icon: IconTasks,
    active: (p) => p.startsWith("/tasks"),
  },
  {
    href: "/session-input",
    label: "セッション入力",
    Icon: IconSession,
    active: (p) => p.startsWith("/session-input"),
  },
];

/** サイドバー非表示（lg未満）時のみ表示。1024px以上では非表示（iPhone横持ちでも下タブを出す）。 */
export function MobileTrainerTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex min-h-0 w-full max-w-full flex-row items-stretch justify-around border-t border-zinc-800 bg-black/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 text-[10px] font-medium leading-tight backdrop-blur-md supports-[backdrop-filter]:bg-black/80 lg:hidden"
      aria-label="店舗向けメインメニュー"
    >
      {TABS.map(({ href, label, Icon, active }) => {
        const isActive = active(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition-colors [touch-action:manipulation] ${
              isActive ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon className="h-6 w-6 shrink-0" />
            <span className="w-full px-0.5 text-center leading-tight">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

