import { memberRepository, taskRepository } from "@/lib/repositories";
import { getStoreScopeId } from "@/lib/authz/serverScope";
import { getTrialStoreNameForData } from "@/lib/trialStore";
import TasksClient from "./TasksClient";

export default async function TasksPage() {
  const scopeStoreId = await getStoreScopeId();

  let initialTasks, initialMembers;
  if (scopeStoreId) {
    // store ロール: 自店舗データのみ取得（Cookie は ASCII storeId → 日本語 storeName に変換）
    const filterName = getTrialStoreNameForData(scopeStoreId);
    initialMembers = await memberRepository.getAllForStore(filterName);
    const scopedTasks = await taskRepository.getAllForStore(filterName);
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
