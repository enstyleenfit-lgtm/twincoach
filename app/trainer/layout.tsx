import { TrainerSidebar } from "@/components/sidebar/TrainerSidebar";

export default function TrainerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <TrainerSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}



