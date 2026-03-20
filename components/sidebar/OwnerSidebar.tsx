 "use client";

import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { RoleSwitchControl } from "@/components/sidebar/RoleSwitchControl";

export function OwnerSidebar() {
  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex-shrink-0 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white">TwinCoach オーナー</h1>
        <RoleSwitchControl />
      </div>
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          <li>
            <Link
              href="/owner"
              className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            >
              ダッシュボード
            </Link>
          </li>
          <li>
            <Link
              href="/stores"
              className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            >
              店舗一覧
            </Link>
          </li>
          <li>
            <Link
              href="/trainers"
              className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            >
              トレーナー
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
              href="/reports"
              className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            >
              レポート
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


