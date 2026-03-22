"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { TRAINER_APP_BRANDING_TITLE } from "@/lib/trainerBranding";
import { RoleSwitchControl } from "@/components/sidebar/RoleSwitchControl";

export function TrainerSidebar() {
  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex-shrink-0 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white">{TRAINER_APP_BRANDING_TITLE}</h1>
        <RoleSwitchControl />
      </div>
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          <li>
            <Link
              href="/trainer"
              className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            >
              今日の予約
            </Link>
          </li>
          <li>
            <Link
              href="/members"
              className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            >
              会員一覧
            </Link>
          </li>
          <li>
            <Link
              href="/tasks"
              className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            >
              介入タスク
            </Link>
          </li>
          <li>
            <Link
              href="/session-input"
              className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            >
              セッション入力
            </Link>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <LogoutButton />
      </div>
    </aside>
  );
}


