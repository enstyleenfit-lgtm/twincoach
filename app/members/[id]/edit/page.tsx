import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { memberRepository } from "@/lib/repositories";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await memberRepository.getMemberById(id);

  if (!member) {
    notFound();
  }

  async function updateMemberAction(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const plan = String(formData.get("plan") ?? "").trim();
    const joinDate = String(formData.get("joinDate") ?? "").trim();
    const storeName = String(formData.get("storeName") ?? "").trim();
    const assignedTrainer = String(formData.get("assignedTrainer") ?? "").trim();

    if (!name || !plan || !joinDate || !storeName) {
      return;
    }

    await memberRepository.updateMember(id, {
      name,
      plan,
      joinDate,
      storeName,
      assignedTrainer: assignedTrainer || undefined,
    });

    redirect(`/members/${id}`);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href={`/members/${id}`}
          className="text-blue-400 hover:text-blue-300 hover:underline text-sm"
        >
          ← 会員詳細に戻る
        </Link>
        <Link
          href="/members"
          className="text-zinc-400 hover:text-zinc-200 hover:underline text-sm"
        >
          会員一覧
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-2">会員情報の編集</h1>
      <p className="text-zinc-400 text-sm mb-8">
        Supabase接続後の更新フローを想定したフォームです（現在はモック更新）。
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <form action={updateMemberAction} className="space-y-5">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">名前</label>
            <input
              name="name"
              required
              defaultValue={member.name}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">プラン</label>
            <input
              name="plan"
              required
              defaultValue={member.plan}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">入会日</label>
            <input
              type="date"
              name="joinDate"
              required
              defaultValue={member.joinDate}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">店舗名</label>
            <input
              name="storeName"
              required
              defaultValue={member.storeName}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">担当トレーナー</label>
            <input
              name="assignedTrainer"
              defaultValue={member.assignedTrainer ?? ""}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href={`/members/${id}`}
              className="px-4 py-2 text-sm bg-zinc-800 text-zinc-200 border border-zinc-700 rounded hover:bg-zinc-700 transition-colors"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              className="px-5 py-2 text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
            >
              更新する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


