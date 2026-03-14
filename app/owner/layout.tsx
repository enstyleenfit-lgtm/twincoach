import { OwnerSidebar } from "@/components/sidebar/OwnerSidebar";

export default function OwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <OwnerSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

