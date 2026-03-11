import Link from "next/link";
import { memberRepository, taskRepository } from "@/lib/repositories";
import { calculateRiskScore, getRiskReasons } from "@/lib/riskScore";
import { getInterventionSuggestion } from "@/lib/interventionSuggestion";
import { calculateRetentionMetrics } from "@/lib/retentionMetrics";
import { getMemberSegment, getSegmentInfo, getSegmentColor } from "@/lib/memberSegmentation";

function getRiskScoreColor(score: number): string {
  if (score >= 80) {
    return "text-red-400";
  } else if (score >= 50) {
    return "text-yellow-400";
  } else {
    return "text-green-400";
  }
}

function getRiskLevelBadgeColor(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "text-green-400 bg-green-400/10 border-green-400/20";
    case "medium":
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "high":
      return "text-red-400 bg-red-400/10 border-red-400/20";
  }
}

function getPriorityColor(priority: "low" | "medium" | "high"): string {
  switch (priority) {
    case "low":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "high":
      return "text-red-400";
  }
}

export default async function Home() {
  // データ取得（将来的にSupabaseから取得可能）
  const members = await memberRepository.getAll();
  const tasks = await taskRepository.getAll();

  // High Risk Members (risk score >= 70)
  const highRiskMembers = members.filter((member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "high";
  }).length;

  // Need Intervention (risk score >= 40)
  const needIntervention = members.filter((member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "medium" || riskResult.level === "high";
  }).length;

  // Today's Tasks (pending + in progress)
  const todaysTasks = tasks.filter(
    (task) => task.status === "pending" || task.status === "in progress"
  ).length;

  // Intervention type counts
  const reservationRiskMembers = members.filter((member) => {
    const suggestion = getInterventionSuggestion(member);
    return suggestion.type === "reservation";
  }).length;

  const motivationRiskMembers = members.filter((member) => {
    const suggestion = getInterventionSuggestion(member);
    return suggestion.type === "motivation";
  }).length;

  const lifestyleRiskMembers = members.filter((member) => {
    const suggestion = getInterventionSuggestion(member);
    return suggestion.type === "lifestyle";
  }).length;

  // Retention Metrics
  const retentionMetrics = calculateRetentionMetrics(members);

  // High Risk Members List (sorted by risk score, max 5)
  const highRiskMembersList = members
    .map((member) => ({
      member,
      riskResult: calculateRiskScore(member),
      suggestion: getInterventionSuggestion(member),
    }))
    .filter(({ riskResult }) => riskResult.level === "high")
    .sort((a, b) => b.riskResult.score - a.riskResult.score)
    .slice(0, 5);

  // Need Intervention Members (medium or high, max 5)
  const needInterventionMembers = members
    .map((member) => ({
      member,
      riskResult: calculateRiskScore(member),
      suggestion: getInterventionSuggestion(member),
    }))
    .filter(
      ({ riskResult }) => riskResult.level === "medium" || riskResult.level === "high"
    )
    .sort((a, b) => {
      // Sort by priority first (high > medium > low), then by risk score
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.suggestion.priority] - priorityOrder[a.suggestion.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.riskResult.score - a.riskResult.score;
    })
    .slice(0, 5);

  // 退会予測ランキング（リスクスコア順、上位5名）
  const dropoutRanking = members
    .map((member) => ({
      member,
      riskResult: calculateRiskScore(member),
      suggestion: getInterventionSuggestion(member),
      segment: getMemberSegment(member),
    }))
    .sort((a, b) => b.riskResult.score - a.riskResult.score)
    .slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-8">TwinCoach ダッシュボード</h1>
      
      {/* 退会予測ランキング */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">退会予測ランキング</h2>
            <p className="text-zinc-400 text-sm">
              現在、優先対応すべき会員をリスク順に表示しています
            </p>
          </div>
        </div>
        {dropoutRanking.length > 0 ? (
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800 border-b border-zinc-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      順位
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      名前
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      プラン
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      リスクスコア
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      リスクレベル
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      会員タイプ
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      推奨アクション
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {dropoutRanking.map(({ member, riskResult, suggestion, segment }, index) => {
                    const rank = index + 1;
                    const segmentInfo = getSegmentInfo(segment);
                    const reasons = getRiskReasons(member).slice(0, 2);
                    const isTopThree = rank <= 3;
                    return (
                      <tr
                        key={member.id}
                        className={`hover:bg-zinc-800/50 transition-colors ${
                          isTopThree ? "bg-zinc-800/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {rank === 1 && (
                              <span className="text-2xl">🥇</span>
                            )}
                            {rank === 2 && (
                              <span className="text-2xl">🥈</span>
                            )}
                            {rank === 3 && (
                              <span className="text-2xl">🥉</span>
                            )}
                            <span
                              className={`text-lg font-bold ${
                                rank === 1
                                  ? "text-yellow-400"
                                  : rank === 2
                                  ? "text-zinc-300"
                                  : rank === 3
                                  ? "text-orange-400"
                                  : "text-zinc-400"
                              }`}
                            >
                              {rank}位
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/members/${member.id}`}
                            className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                          >
                            {member.name}
                          </Link>
                          {reasons.length > 0 && (
                            <ul className="mt-2 space-y-1 text-zinc-400 text-xs">
                              {reasons.map((reason) => (
                                <li key={reason} className="flex gap-2">
                                  <span>・</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">{member.plan}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xl font-bold ${getRiskScoreColor(
                              riskResult.score
                            )}`}
                          >
                            {riskResult.score}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRiskLevelBadgeColor(
                              riskResult.level
                            )}`}
                          >
                            {riskResult.level === "high"
                              ? "高"
                              : riskResult.level === "medium"
                              ? "中"
                              : "低"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSegmentColor(
                              segment
                            )}`}
                            title={segmentInfo.description}
                          >
                            {segmentInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-white text-sm font-medium">
                              {suggestion.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-medium ${
                                  suggestion.priority === "high"
                                    ? "text-red-400"
                                    : suggestion.priority === "medium"
                                    ? "text-yellow-400"
                                    : "text-green-400"
                                }`}
                              >
                                優先度: {suggestion.priority === "high" ? "高" : suggestion.priority === "medium" ? "中" : "低"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/members/${member.id}`}
                            className="px-4 py-2 text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors inline-block"
                          >
                            詳細を見る
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <p className="text-zinc-400">現在ランキング対象の会員はいません</p>
          </div>
        )}
      </div>
      
      {/* First Row: Original Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <h2 className="text-zinc-400 text-sm font-medium mb-2">退会リスク高</h2>
          <p className="text-3xl font-bold text-white">{highRiskMembers}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <h2 className="text-zinc-400 text-sm font-medium mb-2">介入必要</h2>
          <p className="text-3xl font-bold text-white">{needIntervention}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <h2 className="text-zinc-400 text-sm font-medium mb-2">本日のタスク</h2>
          <p className="text-3xl font-bold text-white">{todaysTasks}</p>
        </div>
      </div>

      {/* Second Row: Intervention Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <h2 className="text-zinc-400 text-sm font-medium mb-2">予約問題リスク</h2>
          <p className="text-3xl font-bold text-purple-400">{reservationRiskMembers}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <h2 className="text-zinc-400 text-sm font-medium mb-2">モチベーション低下リスク</h2>
          <p className="text-3xl font-bold text-orange-400">{motivationRiskMembers}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <h2 className="text-zinc-400 text-sm font-medium mb-2">生活変化リスク</h2>
          <p className="text-3xl font-bold text-blue-400">{lifestyleRiskMembers}</p>
        </div>
      </div>

      {/* Retention Overview Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">継続率サマリー</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
            <h2 className="text-zinc-400 text-sm font-medium mb-2">アクティブ会員</h2>
            <p className="text-3xl font-bold text-green-400">{retentionMetrics.activeMembers}</p>
            <p className="text-zinc-500 text-xs mt-2">
              低・中リスク会員
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
            <h2 className="text-zinc-400 text-sm font-medium mb-2">退会リスク高</h2>
            <p className="text-3xl font-bold text-red-400">{retentionMetrics.highRiskMembers}</p>
            <p className="text-zinc-500 text-xs mt-2">
              要対応
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
            <h2 className="text-zinc-400 text-sm font-medium mb-2">推定継続率</h2>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-blue-400">{retentionMetrics.estimatedRetentionRate}</p>
              <span className="text-xl text-zinc-400">%</span>
            </div>
            <p className="text-zinc-500 text-xs mt-2">
              リスクレベル分布に基づく
            </p>
          </div>
        </div>
      </div>

      {/* High Risk Members List */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">退会リスク会員一覧</h2>
        {highRiskMembersList.length > 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800 border-b border-zinc-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      名前
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      リスクスコア
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      リスクレベル
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      提案タイトル
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      クイックアクション
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {highRiskMembersList.map(({ member, riskResult, suggestion }) => (
                    <tr
                      key={member.id}
                      className="hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/members/${member.id}`}
                          className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                        >
                          {member.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">{member.plan}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold ${getRiskScoreColor(
                            riskResult.score
                          )}`}
                        >
                          {riskResult.score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRiskLevelBadgeColor(
                            riskResult.level
                          )}`}
                        >
                          {riskResult.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-zinc-300 text-sm">{suggestion.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          {suggestion.type === "reservation" && (
                            <>
                              <button className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors">
                                電話
                              </button>
                              <button className="px-3 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors">
                                メッセージ
                              </button>
                              <button className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/30 transition-colors">
                                時間提案
                              </button>
                            </>
                          )}
                          {suggestion.type === "motivation" && (
                            <>
                              <button className="px-3 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors">
                                メッセージ
                              </button>
                              <button className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/30 transition-colors">
                                プラン確認
                              </button>
                              <button className="px-3 py-1 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded hover:bg-orange-500/30 transition-colors">
                                目標設定
                              </button>
                            </>
                          )}
                          {suggestion.type === "lifestyle" && (
                            <>
                              <button className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors">
                                電話
                              </button>
                              <button className="px-3 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors">
                                メッセージ
                              </button>
                              <button className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/30 transition-colors">
                                プラン調整
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <p className="text-zinc-400">現在リスクの高い会員はいません</p>
          </div>
        )}
      </div>

      {/* Need Intervention Members */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">介入推奨会員</h2>
        {needInterventionMembers.length > 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800 border-b border-zinc-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      名前
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      優先度
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      推奨アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {needInterventionMembers.map(({ member, suggestion }) => (
                    <tr
                      key={member.id}
                      className="hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/members/${member.id}`}
                          className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                        >
                          {member.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(
                            suggestion.priority
                          )} ${
                            suggestion.priority === "high"
                              ? "bg-red-400/10 border border-red-400/20"
                              : suggestion.priority === "medium"
                              ? "bg-yellow-400/10 border border-yellow-400/20"
                              : "bg-green-400/10 border border-green-400/20"
                          }`}
                        >
                          {suggestion.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white text-sm font-medium mb-1">
                            {suggestion.title}
                          </p>
                          <p className="text-zinc-400 text-xs">{suggestion.action}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <p className="text-zinc-400">現在介入が必要な会員はいません</p>
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">クイックリンク</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/members"
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-6 py-4 hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
          >
            会員一覧
          </Link>
          <Link
            href="/tasks"
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-6 py-4 hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
          >
            介入タスク
          </Link>
        </div>
      </div>
    </div>
  );
}
