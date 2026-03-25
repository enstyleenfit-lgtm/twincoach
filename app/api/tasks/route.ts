import { NextRequest, NextResponse } from "next/server";
import { taskRepository } from "@/lib/repositories";
import { Task } from "@/types";
import { getStoreIdFromRequest } from "@/lib/authz/storeContext";
import { AuthzError } from "@/lib/authz/errors";
import { requireStoreAccess } from "@/lib/authz/authorize";
import { logAudit } from "@/lib/audit/logAudit";

/**
 * GET /api/tasks
 * 全タスクを取得
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = getStoreIdFromRequest(request);
    if (!storeId) return NextResponse.json({ error: "store_id is required" }, { status: 400 });
    await requireStoreAccess({ storeId, requiredRoles: ["trainer", "owner", "hq", "staff"] });

    const tasks = await taskRepository.getAllForStore(storeId);
    await logAudit({ storeId, action: "tasks.list" });
    return NextResponse.json(tasks);
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
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







