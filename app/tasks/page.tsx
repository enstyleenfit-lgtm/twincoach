"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { taskRepository } from "@/lib/repositories";
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<Record<string, Task["status"]>>({});

  useEffect(() => {
    // データ取得（将来的にSupabaseから取得可能）
    taskRepository.getAll().then((fetchedTasks) => {
      setTasks(fetchedTasks);
      const initial: Record<string, Task["status"]> = {};
      fetchedTasks.forEach((task) => {
        initial[task.id] = task.status;
      });
      setTaskStatuses(initial);
    });
  }, []);

  const handleStartTask = (taskId: string) => {
    setTaskStatuses((prev) => ({
      ...prev,
      [taskId]: "in progress",
    }));
  };

  const handleMarkAsDone = (taskId: string) => {
    setTaskStatuses((prev) => ({
      ...prev,
      [taskId]: "done",
    }));
  };

  const currentTasks = tasks.map((task) => ({
    ...task,
    status: taskStatuses[task.id] || task.status,
  }));

  // ローディング状態
  if (tasks.length === 0) {
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
        <h1 className="text-4xl font-bold mb-8">介入タスク</h1>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400">タスクを読み込み中...</p>
        </div>
      </div>
    );
  }

  const pendingCount = currentTasks.filter((task) => task.status === "pending").length;
  const inProgressCount = currentTasks.filter((task) => task.status === "in progress").length;
  const doneCount = currentTasks.filter((task) => task.status === "done").length;

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
          <h2 className="text-zinc-400 text-sm font-medium mb-2">未対応タスク</h2>
          <p className="text-3xl font-bold text-yellow-400">{pendingCount}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <h2 className="text-zinc-400 text-sm font-medium mb-2">対応中タスク</h2>
          <p className="text-3xl font-bold text-blue-400">{inProgressCount}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <h2 className="text-zinc-400 text-sm font-medium mb-2">完了タスク</h2>
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
                  会員
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  アクション
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  ステータス
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  担当トレーナー
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  期限
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {currentTasks.map((task) => (
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
                      {task.status === "pending" ? "未対応" : task.status === "in progress" ? "対応中" : "完了"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {task.assignedTrainer}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">{task.dueDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {task.status === "pending" && (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
                        >
                          タスク開始
                        </button>
                      )}
                      {task.status === "in progress" && (
                        <button
                          onClick={() => handleMarkAsDone(task.id)}
                          className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors"
                        >
                          完了にする
                        </button>
                      )}
                      {task.status === "done" && (
                        <span className="px-3 py-1.5 text-xs text-zinc-500">
                          完了済み
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
