import Link from "next/link";
import { tasks } from "@/lib/mockData";
import { Task } from "@/types";

function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "in progress":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "done":
      return "text-green-400 bg-green-400/10 border-green-400/20";
    default:
      return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
  }
}

export default function TasksPage() {
  const pendingCount = tasks.filter((task) => task.status === "pending").length;
  const inProgressCount = tasks.filter((task) => task.status === "in progress").length;
  const doneCount = tasks.filter((task) => task.status === "done").length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 hover:underline text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
      <h1 className="text-4xl font-bold mb-8">Tasks</h1>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <h2 className="text-zinc-400 text-sm font-medium mb-2">Pending Tasks</h2>
          <p className="text-3xl font-bold text-yellow-400">{pendingCount}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <h2 className="text-zinc-400 text-sm font-medium mb-2">In Progress Tasks</h2>
          <p className="text-3xl font-bold text-blue-400">{inProgressCount}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <h2 className="text-zinc-400 text-sm font-medium mb-2">Done Tasks</h2>
          <p className="text-3xl font-bold text-green-400">{doneCount}</p>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  Member
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  Assigned Trainer
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-zinc-300 font-medium">
                      {task.memberName}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{task.action}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {task.assignedTrainer}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{task.dueDate}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

