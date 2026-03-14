import { calculateRiskScore } from "@/lib/riskScore";
import { getRevenueAtRisk } from "@/lib/revenueRisk";
import { memberRepository, taskRepository } from "@/lib/repositories";
import { Member, Task } from "@/types";
import Link from "next/link";

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

  // 今日のタスク
  const today = getTodayDate();
  const todayTasks = tasks
    .filter((task: Task) => task.assignedTrainer === trainerName)
    .filter((task: Task) => {
      // 期限日が今日以前の未完了タスク
      return task.dueDate <= today && task.status !== "done";
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

  // セッション履歴
  const sessionHistory = getSessionHistory(trainerName);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">トレーナーダッシュボード</h1>
      <p className="text-zinc-400 mb-8">トレーナー: {trainerName}</p>

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

        {/* 今日のタスク */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">今日のタスク</h2>
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
            <p className="text-zinc-400 text-center py-8">今日のタスクはありません</p>
          )}
        </div>
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

      {/* セッション履歴 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">セッション履歴</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-zinc-400">日付</th>
                <th className="text-left py-3 px-4 text-zinc-400">会員名</th>
                <th className="text-left py-3 px-4 text-zinc-400">種別</th>
                <th className="text-left py-3 px-4 text-zinc-400">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {sessionHistory.map((session) => (
                <tr key={session.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="py-3 px-4 text-white">{session.date}</td>
                  <td className="py-3 px-4 text-white">{session.memberName}</td>
                  <td className="py-3 px-4 text-white">{session.type}</td>
                  <td className="py-3 px-4">
                    <span className="text-green-400">{session.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

