"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { TRAINER_APP_BRANDING_TITLE } from "@/lib/trainerBranding";
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
import { useTrialStore } from "@/components/store/TrialStoreProvider";
import { COMMON_SIDEBAR_LINKS } from "@/components/sidebar/sidebarNavPaths";

export function TrainerSidebar() {
  const pathname = usePathname();
  const { stores, selectedId, selectedStore, setSelectedId } = useTrialStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const { notifications, settings } = COMMON_SIDEBAR_LINKS;

  const linkClass = (href: string) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return `${sidebarNavLinkBase} ${active ? sidebarNavLinkActive : sidebarNavLinkInactive}`;
  };

  return (
    <aside className={sidebarAside}>
      <div className={sidebarHeader}>
        <h1 className={sidebarTitle}>{TRAINER_APP_BRANDING_TITLE}</h1>
        <RoleSwitchControl />
        <div ref={menuRef} className="relative mt-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="listbox"
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-white/15"
          >
            <span className="truncate">{selectedStore.name}</span>
            <span className="shrink-0 text-white/60" aria-hidden>▼</span>
          </button>
          {open && (
            <div
              className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              role="listbox"
            >
              <ul className="p-1">
                {stores.map((s) => {
                  const active = s.id === selectedId;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => { setSelectedId(s.id); setOpen(false); }}
                        className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors ${
                          active ? "bg-slate-200 text-slate-900" : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span>{s.name}</span>
                        {active && <span className="text-xs text-slate-600" aria-hidden>✓</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              href="/trainer"
              className={linkClass("/trainer")}
              onClick={() => persistPreferredAppRole("trainer")}
            >
              今日の予約
            </Link>
          </li>
          <li>
            <Link
              href="/members"
              className={linkClass("/members")}
              onClick={() => persistPreferredAppRole("trainer")}
            >
              会員一覧
            </Link>
          </li>
          <li>
            <Link
              href="/tasks"
              className={linkClass("/tasks")}
              onClick={() => persistPreferredAppRole("trainer")}
            >
              介入タスク
            </Link>
          </li>
          <li>
            <Link
              href="/session-input"
              className={linkClass("/session-input")}
              onClick={() => persistPreferredAppRole("trainer")}
            >
              セッション入力
            </Link>
          </li>
          <li className="pt-2 mt-2 border-t border-white/10">
            <Link
              href={notifications}
              className={`${linkClass(notifications)} justify-between`}
              onClick={() => persistPreferredAppRole("trainer")}
            >
              お知らせ
              <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500/75 px-1 text-[10px] font-bold text-white">2</span>
            </Link>
          </li>
          <li>
            <Link
              href={settings}
              className={linkClass(settings)}
              onClick={() => persistPreferredAppRole("trainer")}
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
