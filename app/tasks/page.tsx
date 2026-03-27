import { memberRepository, taskRepository } from "@/lib/repositories";
import TasksClient from "./TasksClient";

export default async function TasksPage() {
  console.log("[render-check] app/tasks/page.tsx rendered");
  const [initialTasks, initialMembers] = await Promise.all([
    taskRepository.getAll(),
    memberRepository.getAll(),
  ]);
  return <TasksClient initialTasks={initialTasks} initialMembers={initialMembers} />;
}
