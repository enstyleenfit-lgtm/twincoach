import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
          <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex-shrink-0">
            <div className="p-6 border-b border-zinc-800">
              <h1 className="text-xl font-bold text-white">TwinCoach</h1>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/members"
                    className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    Members
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tasks"
                    className="flex items-center px-4 py-3 text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    Tasks
                  </Link>
                </li>
              </ul>
            </nav>
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
