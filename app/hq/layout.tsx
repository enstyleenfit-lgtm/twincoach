import { HQSidebar } from "@/components/sidebar/HQSidebar";

export default function HQLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <HQSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}



