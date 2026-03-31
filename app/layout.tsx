import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RoleBasedShell } from "@/components/sidebar/RoleBasedShell";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh w-full max-w-full overflow-x-hidden text-base text-slate-900`}
      >
        <RoleBasedShell>{children}</RoleBasedShell>
      </body>
    </html>
  );
}
