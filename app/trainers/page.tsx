import { memberRepository } from "@/lib/repositories";
import { Member } from "@/types";
import { TrainersListBody } from "@/components/trainers/TrainersListBody";

export default async function TrainersPage() {
  const members = await memberRepository.getAll();

  const trainerNames = Array.from(
    new Set(
      members
        .map((m: Member) => m.assignedTrainer)
        .filter((name): name is string => Boolean(name && name.trim()))
    )
  ).sort((a, b) => a.localeCompare(b, "ja"));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">トレーナー</h1>
      <p className="text-zinc-400 mb-8">トレーナーを選択して詳細を確認できます</p>

      <TrainersListBody trainerNames={trainerNames} />
    </div>
  );
}





