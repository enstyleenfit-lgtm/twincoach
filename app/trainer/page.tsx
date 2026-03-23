import { calculateRiskScore } from "@/lib/riskScore";
import { getRevenueAtRisk } from "@/lib/revenueRisk";
import { getPriorityQueue } from "@/lib/priorityQueue";
import { memberRepository, taskRepository } from "@/lib/repositories";
import { Member, Task } from "@/types";
import Link from "next/link";
import { estimateChurnReasons } from "@/lib/churnReasonAI";
import { generateNextActions } from "@/lib/nextActionAI";

// TODO: 認証情報からトレーナー名を取得する実装に置き換える
function getTrainerName(): string {
  // 現時点ではモックとして最初のトレーナーを使用
  // 将来的には認証情報（セッション/クッキー）から取得
  return "山本トレーナー";
}

// 今日の日付を取得（YYYY-MM-DD形式）
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

// 今日の予約をモック（将来的には予約システムと連携）
function getTodayReservations(trainerName: string): Array<{
  id: string;
  memberName: string;
  time: string;
  type: string;
}> {
  // モックデータ - 将来的には予約システムから取得
  return [
    { id: "1", memberName: "田中太郎", time: "10:00-11:00", type: "パーソナル" },
    { id: "2", memberName: "鈴木一郎", time: "14:00-15:00", type: "グループ" },
    { id: "3", memberName: "高橋健太", time: "18:00-19:00", type: "パーソナル" },
  ];
}

// セッション履歴をモック（将来的にはセッション履歴システムと連携）
function getSessionHistory(trainerName: string): Array<{
  id: string;
  memberName: string;
  date: string;
  type: string;
  status: string;
}> {
  // モックデータ - 将来的にはセッション履歴システムから取得
  const today = new Date();
  const history = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    history.push({
      id: `session-${i}`,
      memberName: `会員${i + 1}`,
      date: date.toISOString().split("T")[0],
      type: i % 2 === 0 ? "パーソナル" : "グループ",
      status: "完了",
    });
  }
  return history;
}

export default async function TrainerPage() {
  const members = await memberRepository.getAll();
  const tasks = await taskRepository.getAll();
  const trainerName = getTrainerName();

  // 担当会員のみフィルタ
  const assignedMembers = members.filter((m: Member) => m.assignedTrainer === trainerName);

  // 高リスク会員
  const highRiskMembers = assignedMembers
    .map((m: Member) => ({
      member: m,
      risk: calculateRiskScore(m),
      revenue: getRevenueAtRisk(m),
    }))
    .filter(({ risk }) => risk.level === "high")
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, 10);

  // 今日の優先対応（担当会員の優先キュー）
  const priorityQueue = getPriorityQueue(assignedMembers).slice(0, 5);
  const topPriorityMember = priorityQueue[0]?.member ?? null;

  const nextProposalAI = topPriorityMember
    ? generateNextActions(
        topPriorityMember,
        undefined,
        estimateChurnReasons(topPriorityMember)
      )
    : null;

  // 担当会員一覧
  const memberList = assignedMembers
    .map((m: Member) => ({
      member: m,
      risk: calculateRiskScore(m),
    }))
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, 12);

  // 介入タスク（pending + in progress）
  const todayTasks = tasks
    .filter((task: Task) => task.assignedTrainer === trainerName)
    .filter((task: Task) => {
      return task.status === "pending" || task.status === "in progress";
    })
    .sort((a: Task, b: Task) => {
      // 優先度順、次に期限日順
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || "low"];
      const bPriority = priorityOrder[b.priority || "low"];
      if (bPriority !== aPriority) {
        return bPriority - aPriority;
      }
      return a.dueDate.localeCompare(b.dueDate);
    })
    .slice(0, 10);

  // 今日の予約
  const todayReservations = getTodayReservations(trainerName);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">TwinCoach 店舗</h1>
      <p className="text-zinc-400 mb-8">担当: {trainerName}</p>

      {/* 2カラムレイアウト */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 今日の予約 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">今日の予約</h2>
          {todayReservations.length > 0 ? (
            <div className="space-y-3">
              {todayReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-semibold">{reservation.memberName}</p>
                      <p className="text-zinc-400 text-sm">{reservation.type}</p>
                    </div>
                    <p className="text-blue-400 font-bold">{reservation.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400 text-center py-8">今日の予約はありません</p>
          )}
        </div>

        {/* 介入タスク */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">介入タスク</h2>
          {todayTasks.length > 0 ? (
            <div className="space-y-3">
              {todayTasks.map((task: Task) => (
                <div
                  key={task.id}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <Link
                        href={`/members/${task.memberId}`}
                        className="text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        {task.memberName}
                      </Link>
                      <p className="text-zinc-300 text-sm mt-1">{task.action}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        task.priority === "high"
                          ? "text-red-400 bg-red-400/10 border border-red-400/20"
                          : task.priority === "medium"
                          ? "text-orange-400 bg-orange-400/10 border border-orange-400/20"
                          : "text-zinc-400 bg-zinc-400/10 border border-zinc-400/20"
                      }`}
                    >
                      {task.priority === "high"
                        ? "高"
                        : task.priority === "medium"
                        ? "中"
                        : "低"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-zinc-400 text-xs">
                      期限: {task.dueDate}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        task.status === "done"
                          ? "text-green-400 bg-green-400/10"
                          : task.status === "in progress"
                          ? "text-blue-400 bg-blue-400/10"
                          : "text-yellow-400 bg-yellow-400/10"
                      }`}
                    >
                      {task.status === "done"
                        ? "完了"
                        : task.status === "in progress"
                        ? "進行中"
                        : "未着手"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400 text-center py-8">介入タスクはありません</p>
          )}
        </div>
      </div>

      {/* 今日の優先対応 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">今日の優先対応</h2>
        {priorityQueue.length === 0 ? (
          <p className="text-zinc-400">優先対応の対象会員はいません</p>
        ) : (
          <div className="space-y-3">
            {priorityQueue.map((item) => {
              const churnReasons = estimateChurnReasons(item.member);
              const tags = churnReasons.reasons.slice(0, 2).map((r) => r.tag);
              const next = generateNextActions(item.member, undefined, churnReasons);
              const first = next.actions[0];
              return (
                <div
                  key={item.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/members/${item.id}`}
                      className="text-white font-semibold hover:text-blue-400"
                    >
                      {item.name}
                    </Link>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-zinc-500 text-xs">30日</span>
                      <span className="text-red-400 font-bold tabular-nums">
                        {item.probability30Days}%
                      </span>
                    </div>
                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="rounded border border-zinc-700 bg-black/30 px-2 py-0.5 text-[11px] text-zinc-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right min-w-[160px]">
                    <div className="text-zinc-500 text-xs mb-1">次回提案AI</div>
                    <div className="text-sm font-medium text-white">
                      {first?.title ?? "—"}
                    </div>
                    {first?.description ? (
                      <div className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {first.description}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 次回提案AI（優先1名） */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">次回提案AI</h2>
        {!topPriorityMember ? (
          <p className="text-zinc-400">対象会員がいません</p>
        ) : nextProposalAI ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-zinc-500 text-xs mb-1">最優先会員</p>
                <Link
                  href={`/members/${topPriorityMember.id}`}
                  className="text-white font-semibold hover:text-blue-400"
                >
                  {topPriorityMember.name}
                </Link>
              </div>
              <div className="text-right">
                <p className="text-zinc-500 text-xs mb-1">優先度</p>
                <p className="text-white font-semibold">{nextProposalAI.priority.toUpperCase()}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {nextProposalAI.actions.slice(0, 3).map((a, idx) => (
                <div key={`${a.title}-${idx}`} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <div className="text-xs text-zinc-500">{a.type}</div>
                  <div className="text-sm font-medium text-white mt-1">{a.title}</div>
                  <div className="text-xs text-zinc-400 mt-2 line-clamp-3">{a.description}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-zinc-400">提案を生成できませんでした</p>
        )}
      </div>

      {/* 高リスク会員 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">高リスク会員</h2>
        {highRiskMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-zinc-400">会員名</th>
                  <th className="text-left py-3 px-4 text-zinc-400">プラン</th>
                  <th className="text-right py-3 px-4 text-zinc-400">リスクスコア</th>
                  <th className="text-right py-3 px-4 text-zinc-400">月間売上</th>
                  <th className="text-left py-3 px-4 text-zinc-400">最終来店日</th>
                  <th className="text-left py-3 px-4 text-zinc-400">来店間隔</th>
                </tr>
              </thead>
              <tbody>
                {highRiskMembers.map(({ member, risk, revenue }) => (
                  <tr key={member.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/members/${member.id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {member.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-white">{member.plan}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-red-400 font-bold">{risk.score}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      ¥{revenue.monthlyRevenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-white">{member.lastVisitDate}</td>
                    <td className="py-3 px-4 text-white">{member.visitInterval}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-zinc-400 text-center py-8">高リスク会員はありません</p>
        )}
      </div>

      {/* 会員一覧 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">会員一覧</h2>
        {memberList.length === 0 ? (
          <p className="text-zinc-400">担当会員がいません</p>
        ) : (
          <div className="space-y-2">
            {memberList.map(({ member, risk }) => (
              <div
                key={member.id}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/members/${member.id}`}
                    className="text-white font-semibold hover:text-blue-400"
                  >
                    {member.name}
                  </Link>
                  <div className="text-zinc-500 text-xs mt-1">
                    リスク {risk.level.toUpperCase()}（{risk.score}）
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-500 text-xs mb-1">来店間隔</div>
                  <div className="text-white text-sm font-medium">{member.visitInterval}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* セッション履歴への導線 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">セッション履歴への導線</h2>
        {memberList[0] ? (
          <div className="space-y-3">
            <p className="text-zinc-400 text-sm">
              セッション履歴（過去5回）は会員詳細画面に表示されます。今日の優先会員から確認してください。
            </p>
            <Link
              href={`/members/${memberList[0].member.id}`}
              className="inline-flex items-center text-blue-400 hover:text-blue-300 hover:underline text-sm"
            >
              例：{memberList[0].member.name} の履歴を見る →
            </Link>
            <div className="pt-2 border-t border-zinc-800" />
            <Link
              href="/session-input"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 hover:underline text-sm"
            >
              セッション入力（記録）へ →
            </Link>
          </div>
        ) : (
          <p className="text-zinc-400 text-sm">担当会員がいないため表示できません</p>
        )}
      </div>
    </div>
  );
}

