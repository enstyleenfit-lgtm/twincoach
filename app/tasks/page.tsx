import { memberRepository, taskRepository } from "@/lib/repositories";
import { getStoreScopeId } from "@/lib/authz/serverScope";
import TasksClient from "./TasksClient";

export default async function TasksPage() {
  console.log("[render-check] app/tasks/page.tsx rendered");
  const scopeStoreId = await getStoreScopeId();

  let initialTasks, initialMembers;
  if (scopeStoreId) {
    // store ロール: 自店舗データのみ取得
    initialMembers = await memberRepository.getAllForStore(scopeStoreId);
    const scopedTasks = await taskRepository.getAllForStore(scopeStoreId);
    if (scopedTasks.length > 0) {
      initialTasks = scopedTasks;
    } else {
      // モック環境では getAllForStore が空を返すため、storeMembers のIDセットで絞り込む
      const storeMemberIds = new Set(initialMembers.map((m) => m.id));
      const allTasks = await taskRepository.getAll();
      initialTasks = allTasks.filter((t) => storeMemberIds.has(t.memberId));
    }
  } else {
    // hq / owner / trainer: 従来どおり全取得
    [initialTasks, initialMembers] = await Promise.all([
      taskRepository.getAll(),
      memberRepository.getAll(),
    ]);
  }

  return <TasksClient initialTasks={initialTasks} initialMembers={initialMembers} />;
}
