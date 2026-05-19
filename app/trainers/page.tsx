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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">トレーナー</h1>
      <p className="text-slate-500 text-sm mb-8">トレーナーを選択して詳細を確認できます</p>

      <TrainersListBody trainerNames={trainerNames} />
    </div>
  );
}





