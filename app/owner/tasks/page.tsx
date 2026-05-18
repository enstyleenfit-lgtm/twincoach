import { memberRepository, taskRepository } from "@/lib/repositories";
import { OWNER_STORE_IDS, getTrialStoreNameForData } from "@/lib/trialStore";
import TasksClient from "@/app/tasks/TasksClient";

export default async function OwnerTasksPage() {
  const membersByStore = await Promise.all(
    OWNER_STORE_IDS.map((id) =>
      memberRepository.getAllForStore(getTrialStoreNameForData(id))
    )
  );
  const initialMembers = membersByStore.flat();

  const ownerMemberIds = new Set(initialMembers.map((m) => m.id));
  const allTasks = await taskRepository.getAll();
  const initialTasks = allTasks.filter((t) => ownerMemberIds.has(t.memberId));

  return <TasksClient initialTasks={initialTasks} initialMembers={initialMembers} />;
}
