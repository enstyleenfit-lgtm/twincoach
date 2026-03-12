import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TwinCoach",
  description: "TwinCoach Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen bg-black text-white">
          {/* Left Sidebar */}
          <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex-shrink-0 flex flex-col">
            <div className="p-6 border-b border-zinc-800">
              <h1 className="text-xl font-bold text-white">TwinCoach</h1>
            </div>
            <nav className="p-4 flex-1">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    ダッシュボード
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
                href="/stores"
                className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
              >
                店舗
              </Link>
            </li>
            <li>
              <Link
                href="/reports"
                className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
              >
                月次レポート
              </Link>
            </li>
            <li>
              <Link
                href="/import"
                className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
              >
                CSVインポート
              </Link>
            </li>
              </ul>
            </nav>
            <div className="p-4 border-t border-zinc-800">
              <LogoutButton />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
