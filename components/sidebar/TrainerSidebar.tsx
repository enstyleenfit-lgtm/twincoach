import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export function TrainerSidebar() {
  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex-shrink-0 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white">TwinCoach トレーナー</h1>
      </div>
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          <li>
            <Link
              href="/trainer"
              className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
            >
              トレーナーダッシュボード
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
              タスク
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

