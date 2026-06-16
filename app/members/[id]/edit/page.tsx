import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { memberRepository } from "@/lib/repositories";
import { getStoreScopeId } from "@/lib/authz/serverScope";
import { getTrialStoreNameForData } from "@/lib/trialStore";

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

  const scopeStoreId = await getStoreScopeId();
  if (scopeStoreId && member.storeName !== getTrialStoreNameForData(scopeStoreId)) {
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
          className="text-blue-700 hover:text-blue-800 hover:underline text-sm"
        >
          ← 会員詳細に戻る
        </Link>
        <Link
          href="/members"
          className="text-slate-600 hover:text-slate-800 hover:underline text-sm"
        >
          会員一覧
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-2">会員情報の編集</h1>
      <p className="text-slate-600 text-sm mb-8">
        Supabase接続後の更新フローを想定したフォームです（現在はモック更新）。
      </p>

      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
        <form action={updateMemberAction} className="space-y-5">
          <div>
            <label className="block text-slate-600 text-sm mb-2">名前</label>
            <input
              name="name"
              required
              defaultValue={member.name}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">プラン</label>
            <input
              name="plan"
              required
              defaultValue={member.plan}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">入会日</label>
            <input
              type="date"
              name="joinDate"
              required
              defaultValue={member.joinDate}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">店舗名</label>
            <input
              name="storeName"
              required
              defaultValue={member.storeName}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm mb-2">担当トレーナー</label>
            <input
              name="assignedTrainer"
              defaultValue={member.assignedTrainer ?? ""}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href={`/members/${id}`}
              className="px-4 py-2 text-sm bg-slate-100 text-slate-800 border border-slate-200 rounded hover:bg-slate-200 transition-colors"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              className="px-5 py-2 text-sm bg-blue-500/20 text-blue-700 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
            >
              更新する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}









