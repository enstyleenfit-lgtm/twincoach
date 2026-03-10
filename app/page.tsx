import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-4xl font-bold mb-8">TwinCoach Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
            <h2 className="text-zinc-400 text-sm font-medium mb-2">High Risk Members</h2>
            <p className="text-3xl font-bold text-white">12</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
            <h2 className="text-zinc-400 text-sm font-medium mb-2">Need Intervention</h2>
            <p className="text-3xl font-bold text-white">8</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
            <h2 className="text-zinc-400 text-sm font-medium mb-2">Today's Tasks</h2>
            <p className="text-3xl font-bold text-white">5</p>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/members"
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-6 py-4 hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
            >
              Members
            </Link>
            <Link
              href="/tasks"
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-6 py-4 hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
            >
              Tasks
            </Link>
          </div>
        </div>
    </div>
  );
}
