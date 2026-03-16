import Link from "next/link";
import { memberRepository } from "@/lib/repositories";
import { Member } from "@/types";

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

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        {trainerNames.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">
            トレーナーが見つかりません
          </p>
        ) : (
          <ul className="space-y-2">
            {trainerNames.map((trainerName) => (
              <li key={trainerName}>
                <Link
                  href={`/trainers/${encodeURIComponent(trainerName)}`}
                  className="block px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-800/50 hover:text-white transition-colors"
                >
                  {trainerName}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


