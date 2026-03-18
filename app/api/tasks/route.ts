import { NextRequest, NextResponse } from "next/server";
import { taskRepository } from "@/lib/repositories";
import { Task } from "@/types";

/**
 * GET /api/tasks
 * 全タスクを取得
 */
export async function GET() {
  try {
    const tasks = await taskRepository.getAll();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * 新しいタスクを作成
 */
export async function POST(request: NextRequest) {
  try {
    const body: Task = await request.json();
    // TODO: taskRepository.createTask() を実装する必要がある場合は追加
    return NextResponse.json(
      { error: "Task creation not yet implemented" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}





