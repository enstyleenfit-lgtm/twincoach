import Link from "next/link";
import { memberRepository, taskRepository } from "@/lib/repositories";
import { calculateRiskScore, getRiskReasons } from "@/lib/riskScore";
import { getInterventionSuggestion } from "@/lib/interventionSuggestion";
import { calculateRetentionMetrics } from "@/lib/retentionMetrics";
import { getMemberSegment, getSegmentInfo, getSegmentColor } from "@/lib/memberSegmentation";
import { RiskTrendChart } from "@/components/RiskTrendChart";
import { getRevenueAtRisk } from "@/lib/revenueRisk";
import { getStoreSummaries } from "@/lib/storeSummary";
import { getKpiGap, getStoreKpiTargets } from "@/lib/kpiGap";
import { getReservationAnalysis } from "@/lib/reservationAnalysis";
import { getFirst90DaysRiskSummary } from "@/lib/first90Days";
import { getDualMembers, getRecommendedNextPlan } from "@/lib/planTransition";
import { getTrainerMetrics } from "@/lib/trainerMetrics";
import { getPriceRevisionImpact } from "@/lib/priceRevisionImpact";
import { roleDashboardConfig, getRoleDisplayName, getRoleDescription, type DashboardSection } from "@/lib/roleConfig";
import { Role } from "@/types";

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

function getPriorityBadgeColor(priority: "low" | "medium" | "high"): string {
  switch (priority) {
    case "high":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    case "medium":
      return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    case "low":
      return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
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

  // 今日の優先対応キュー（riskScore → priority → lastVisitDate でソート）
  const interventionQueue = members
    .map((member) => ({
      member,
      riskResult: calculateRiskScore(member),
      suggestion: getInterventionSuggestion(member),
      segment: getMemberSegment(member),
    }))
    .sort((a, b) => {
      // ① riskScore（高い順）
      const scoreDiff = b.riskResult.score - a.riskResult.score;
      if (scoreDiff !== 0) return scoreDiff;

      // ② priority（high > medium > low）
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.suggestion.priority] - priorityOrder[a.suggestion.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // ③ lastVisitDate（古い順）
      const dateA = new Date(a.member.lastVisitDate).getTime();
      const dateB = new Date(b.member.lastVisitDate).getTime();
      return dateA - dateB;
    })
    .slice(0, 5);

  // 退会リスク分布（低/中/高）
  const riskDistribution = members.reduce(
    (acc, member) => {
      const { level } = calculateRiskScore(member);
      acc[level] += 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0 } as Record<"low" | "medium" | "high", number>
  );

  const riskDistributionChartData = [
    { name: "低リスク", value: riskDistribution.low, color: "#4ade80" }, // green-400
    { name: "中リスク", value: riskDistribution.medium, color: "#facc15" }, // yellow-400
    { name: "高リスク", value: riskDistribution.high, color: "#f87171" }, // red-400
  ];

  // 高リスク会員の売上リスク（退会リスク売上）
  const highRiskMembersWithRevenue = members
    .map((member) => {
      const riskResult = calculateRiskScore(member);
      const revenue = getRevenueAtRisk(member);
      return { member, riskResult, revenue };
    })
    .filter(({ riskResult }) => riskResult.level === "high");

  const totalMonthlyRevenueAtRisk = highRiskMembersWithRevenue.reduce(
    (sum, { revenue }) => sum + revenue.monthlyRevenue,
    0
  );

  const totalAnnualRevenueAtRisk = highRiskMembersWithRevenue.reduce(
    (sum, { revenue }) => sum + revenue.annualRevenueAtRisk,
    0
  );

  const dangerousRevenueRanking = highRiskMembersWithRevenue
    .slice()
    .sort((a, b) => b.revenue.annualRevenueAtRisk - a.revenue.annualRevenueAtRisk)
    .slice(0, 5);

  // 店舗別サマリー
  const storeSummaries = getStoreSummaries(members).sort(
    (a, b) => b.annualRevenueAtRisk - a.annualRevenueAtRisk
  );

  // KPI緊張感モード用データ
  const storeTargets = getStoreKpiTargets();
  const storeKpiRows = storeSummaries.map((summary) => {
    const target =
      storeTargets.find((t) => t.storeName === summary.storeName) ??
      ({
        storeName: summary.storeName,
        targetRetentionRate: 85,
        targetMonthlyRevenue: summary.monthlyRevenue,
        targetHighRiskMembersMax: 1,
      } as const);
    const gap = getKpiGap(summary, target);
    return { summary, target, gap };
  });

  // 予約詰まり分析
  const reservationAnalysis = getReservationAnalysis(members);

  // 入会後90日モニター
  const first90DaysSummary = getFirst90DaysRiskSummary(members);
  const urgentFirst90DaysMembers = first90DaysSummary.membersInFirst30Days
    .concat(first90DaysSummary.membersIn31to60Days)
    .concat(first90DaysSummary.membersIn61to90Days)
    .filter(
      (item) =>
        item.riskResult.level === "medium" || item.riskResult.level === "high"
    )
    .sort((a, b) => b.riskResult.score - a.riskResult.score)
    .slice(0, 5);

  // デュアル移行最適化
  const dualMembers = getDualMembers(members);
  const dualMembersWithRecommendation = dualMembers.map((member) => ({
    member,
    recommendation: getRecommendedNextPlan(member),
    riskResult: calculateRiskScore(member),
    segment: getMemberSegment(member),
  }));
  const trainingRecommendedCount = dualMembersWithRecommendation.filter(
    (item) => item.recommendation.recommendedNextPlan === "トレーニング月8"
  ).length;
  const pilatesRecommendedCount = dualMembersWithRecommendation.filter(
    (item) => item.recommendation.recommendedNextPlan === "ピラティス月8"
  ).length;
  const urgentDualMembers = dualMembersWithRecommendation
    .sort((a, b) => b.riskResult.score - a.riskResult.score)
    .slice(0, 5);

  // トレーナー別継続率
  const trainerMetrics = getTrainerMetrics(members);

  // 価格改定影響モニター
  const priceRevisionImpact = getPriceRevisionImpact(members);

  // ダミーロール設定（将来的に認証から取得）
  // TODO: 実認証連携時に以下に置き換え
  // const currentRole = await getCurrentRoleFromSession();
  const currentRole: Role = "trainer"; // デフォルトは trainer、開発時は変更可能
  const visibleSections = roleDashboardConfig[currentRole];

  // セクション表示判定ヘルパー
  const shouldShow = (section: DashboardSection): boolean => {
    return visibleSections.includes(section);
  };

  const formatter = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">TwinCoach ダッシュボード</h1>
          <p className="text-zinc-400 text-sm">
            {getRoleDescription(currentRole)}（現在のロール: {getRoleDisplayName(currentRole)}）
          </p>
        </div>
      </div>
      
      {/* 今日の優先対応 */}
      {shouldShow("interventionQueue") && (
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">今日の優先対応</h2>
          <p className="text-zinc-400 text-sm">
            本日対応すべき会員をAIが優先順位で表示します
          </p>
        </div>
        {interventionQueue.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interventionQueue.map(({ member, riskResult, suggestion, segment }, index) => {
              const rank = index + 1;
              const segmentInfo = getSegmentInfo(segment);
              return (
                <div
                  key={member.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-zinc-400">#{rank}</span>
                      <Link
                        href={`/members/${member.id}`}
                        className="text-blue-400 hover:text-blue-300 hover:underline font-semibold text-lg"
                      >
                        {member.name}
                      </Link>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getPriorityBadgeColor(
                        suggestion.priority
                      )}`}
                    >
                      {suggestion.priority === "high" ? "高" : suggestion.priority === "medium" ? "中" : "低"}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-400 text-xs">リスクスコア</span>
                        <span
                          className={`text-xl font-bold ${getRiskScoreColor(
                            riskResult.score
                          )}`}
                        >
                          {riskResult.score}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-zinc-400 text-xs">会員タイプ</span>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSegmentColor(
                            segment
                          )}`}
                        >
                          {segmentInfo.label}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-zinc-400 text-xs">推奨アクション</span>
                      <p className="text-white text-sm font-medium mt-1">
                        {suggestion.title}
          </p>
        </div>
                    
                    <div className="pt-2 border-t border-zinc-800">
                      <Link
                        href={`/members/${member.id}`}
                        className="w-full px-4 py-2 text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors inline-block text-center"
                      >
                        詳細を見る
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <p className="text-zinc-400">本日対応すべき会員はいません</p>
          </div>
        )}
      </div>
      )}
      
      {/* 退会予測ランキング */}
      {shouldShow("dropoutRanking") && (
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
      )}

      {/* 退会リスク売上 */}
      {shouldShow("revenueAtRisk") && (
      <div className="mb-12">
        <div className="bg-zinc-900 border-2 border-red-500/40 rounded-lg p-6 hover:border-red-400/60 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">退会リスク売上</h2>
              <p className="text-zinc-400 text-sm">
                高リスク会員が退会した場合に失う可能性のある売上です
              </p>
            </div>
            <div className="flex gap-8 flex-wrap lg:justify-end">
              <div className="text-right">
                <p className="text-zinc-400 text-xs mb-1">月間リスク売上</p>
                <p className="text-2xl font-extrabold text-red-400">
                  {formatter.format(totalMonthlyRevenueAtRisk)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-zinc-400 text-xs mb-1">年間リスク売上</p>
                <p className="text-2xl font-extrabold text-red-300">
                  {formatter.format(totalAnnualRevenueAtRisk)}
                </p>
              </div>
            </div>
          </div>

          {/* 危険売上ランキング */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-3">危険売上ランキング</h3>
            {dangerousRevenueRanking.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800 border-b border-zinc-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300">
                        順位
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300">
                        名前
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300">
                        プラン
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                        月額売上
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                        年間リスク売上
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                        リスクスコア
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {dangerousRevenueRanking.map(({ member, revenue, riskResult }, index) => (
                      <tr key={member.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-zinc-300">#{index + 1}</td>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            href={`/members/${member.id}`}
                            className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                          >
                            {member.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{member.plan}</td>
                        <td className="px-4 py-3 text-sm text-right text-zinc-100">
                          {formatter.format(revenue.monthlyRevenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-300 font-semibold">
                          {formatter.format(revenue.annualRevenueAtRisk)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span
                            className={`font-semibold ${getRiskScoreColor(
                              riskResult.score
                            )}`}
                          >
                            {riskResult.score}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Link
                            href={`/members/${member.id}`}
                            className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors inline-block"
                          >
                            詳細を見る
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-zinc-400 text-sm">
                現在、高リスク会員による売上リスクはありません
              </p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* 店舗別サマリー */}
      {shouldShow("storeSummary") && (
      <div className="mb-12">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <div className="flex items-start justify-between mb-4 gap-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">店舗別サマリー</h2>
              <p className="text-zinc-400 text-sm">
                店舗ごとの継続率と危険売上を一覧で確認できます
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800 border-b border-zinc-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300">
                    店舗名
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    会員数
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    高リスク会員数
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    推定継続率
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    月間売上
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    月間リスク売上
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    年間リスク売上
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {storeSummaries.map((store) => (
                  <tr key={store.storeName} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-zinc-100">
                      {store.storeName}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-zinc-100">
                      {store.totalMembers}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="font-semibold text-red-400">
                        {store.highRiskMembers}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-zinc-100">
                      {store.estimatedRetentionRate.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-zinc-100">
                      {formatter.format(store.monthlyRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-yellow-300">
                      {formatter.format(store.monthlyRevenueAtRisk)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-300 font-semibold">
                      {formatter.format(store.annualRevenueAtRisk)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* KPI緊張感モード */}
      {shouldShow("kpiGap") && (
      <div className="mb-12">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <div className="flex items-start justify-between mb-4 gap-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">KPI緊張感モード</h2>
              <p className="text-zinc-400 text-sm">
                目標達成までに守るべき人数と売上差分を表示しています
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800 border-b border-zinc-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300">
                    店舗名
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    今月売上目標
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    現在売上
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    売上差分
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    継続率目標
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    現在継続率
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    継続率差分
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    あと何人守ればよいか
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-300">
                    あと何円守ればよいか
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {storeKpiRows.map(({ summary, target, gap }) => {
                  const revenueNegative = gap.revenueGap > 0; // 目標に届いていない
                  const retentionNegative = gap.retentionGap > 0; // 目標に届いていない
                  return (
                    <tr key={summary.storeName} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-zinc-100">
                        {summary.storeName}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-zinc-100">
                        {formatter.format(target.targetMonthlyRevenue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-zinc-100">
                        {formatter.format(summary.monthlyRevenue)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-semibold ${
                          revenueNegative ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {formatter.format(gap.revenueGap)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-zinc-100">
                        {target.targetRetentionRate.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-zinc-100">
                        {summary.estimatedRetentionRate.toFixed(1)}%
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-semibold ${
                          retentionNegative ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {gap.retentionGap.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-zinc-100">
                        {gap.membersToSave}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-zinc-100">
                        {formatter.format(gap.revenueToProtect)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* 退会リスク分布 */}
      {shouldShow("riskTrendChart") && (
      <div className="mb-12">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">退会リスク分布</h2>
              <p className="text-zinc-400 text-sm">
                現在の会員リスク状況を表示しています
              </p>
            </div>
            <div className="flex gap-4 flex-wrap justify-end">
              <div className="text-right">
                <p className="text-zinc-400 text-xs">低リスク</p>
                <p className="text-lg font-bold text-green-400">
                  {riskDistribution.low}
                </p>
              </div>
              <div className="text-right">
                <p className="text-zinc-400 text-xs">中リスク</p>
                <p className="text-lg font-bold text-yellow-400">
                  {riskDistribution.medium}
                </p>
              </div>
              <div className="text-right">
                <p className="text-zinc-400 text-xs">高リスク</p>
                <p className="text-lg font-bold text-red-400">
                  {riskDistribution.high}
                </p>
              </div>
            </div>
          </div>

          <RiskTrendChart data={riskDistributionChartData} />
        </div>
      </div>
      )}

      {/* First Row: Original Summary Cards */}
      {shouldShow("summaryCards") && (
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
      )}

      {/* Second Row: Intervention Type Cards */}
      {shouldShow("interventionTypeCards") && (
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
      )}

      {/* Retention Overview Section */}
      {shouldShow("retentionOverview") && (
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
      )}

      {/* High Risk Members List */}
      {shouldShow("highRiskMembersList") && (
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
      )}

      {/* Need Intervention Members */}
      {shouldShow("needInterventionMembers") && (
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
      )}

      {/* 予約詰まり分析 */}
      {shouldShow("reservationAnalysis") && (
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">予約詰まり分析</h2>
          <p className="text-zinc-400 text-sm">
            予約の取りづらさは継続率に直結する重要指標です
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 予約問題リスク会員数 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">予約問題リスク会員数</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">予約問題リスク会員</span>
                <span className="text-2xl font-bold text-orange-400">
                  {reservationAnalysis.reservationRiskMembers.length}人
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">予約困難会員</span>
                <span className="text-xl font-bold text-red-400">
                  {reservationAnalysis.difficultReservationMembers.length}人
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">予約問題による高リスク会員</span>
                <span className="text-xl font-bold text-red-500">
                  {reservationAnalysis.storePressures.reduce(
                    (sum, store) => sum + store.highRiskDueToReservation,
                    0
                  )}
                  人
                </span>
              </div>
            </div>
          </div>

          {/* 時間帯別の詰まり */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">予約が集中している時間帯</h3>
            <div className="space-y-2">
              {reservationAnalysis.busyTimeSlots.slice(0, 5).map((slot) => (
                <div key={slot.timeSlot} className="flex items-center justify-between">
                  <span className="text-zinc-300">{slot.timeSlot}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-sm">{slot.count}人</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        slot.difficultyLevel === "difficult"
                          ? "text-red-400 bg-red-400/10 border border-red-400/20"
                          : slot.difficultyLevel === "medium"
                          ? "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20"
                          : "text-green-400 bg-green-400/10 border border-green-400/20"
                      }`}
                    >
                      {slot.difficultyLevel === "difficult"
                        ? "困難"
                        : slot.difficultyLevel === "medium"
                        ? "普通"
                        : "容易"}
                    </span>
                  </div>
                </div>
              ))}
              {reservationAnalysis.busyTimeSlots.length === 0 && (
                <p className="text-zinc-400 text-sm">データがありません</p>
              )}
            </div>
          </div>
        </div>

        {/* 予約が取りづらい店舗ランキング */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h3 className="text-lg font-semibold">予約が取りづらい店舗ランキング</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800 border-b border-zinc-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    順位
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    店舗名
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    全会員数
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    予約困難会員
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    予約問題リスク会員
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    高リスク会員（予約問題）
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    プレッシャースコア
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {reservationAnalysis.storePressures.map((store, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={store.storeName}
                      className="hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-zinc-400">#{rank}</span>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {store.storeName}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">{store.totalMembers}人</td>
                      <td className="px-6 py-4">
                        <span className="text-red-400 font-semibold">
                          {store.difficultReservationMembers}人
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-orange-400 font-semibold">
                          {store.reservationRiskMembers}人
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-red-500 font-bold">
                          {store.highRiskDueToReservation}人
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xl font-bold ${
                            store.pressureScore >= 70
                              ? "text-red-500"
                              : store.pressureScore >= 40
                              ? "text-yellow-400"
                              : "text-green-400"
                          }`}
                        >
                          {store.pressureScore}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* 入会後90日モニター */}
      {shouldShow("first90Days") && (
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">入会後90日モニター</h2>
          <p className="text-zinc-400 text-sm">
            入会後90日は継続率を左右する最重要期間です
          </p>
        </div>

        {/* 経過日数ごとのカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
            <h3 className="text-zinc-400 text-sm font-medium mb-2">0〜30日会員</h3>
            <p className="text-3xl font-bold text-white">
              {first90DaysSummary.membersInFirst30Days.length}
            </p>
            <p className="text-zinc-500 text-xs mt-2">入会直後の重要期間</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
            <h3 className="text-zinc-400 text-sm font-medium mb-2">31〜60日会員</h3>
            <p className="text-3xl font-bold text-white">
              {first90DaysSummary.membersIn31to60Days.length}
            </p>
            <p className="text-zinc-500 text-xs mt-2">習慣化の転換期</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
            <h3 className="text-zinc-400 text-sm font-medium mb-2">61〜90日会員</h3>
            <p className="text-3xl font-bold text-white">
              {first90DaysSummary.membersIn61to90Days.length}
            </p>
            <p className="text-zinc-500 text-xs mt-2">継続率の分岐点</p>
          </div>
        </div>

        {/* 高リスク会員数カード */}
        <div className="bg-zinc-900 border-2 border-red-500/40 rounded-lg p-6 mb-6 hover:border-red-400/60 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">90日以内高リスク会員数</h3>
              <p className="text-zinc-400 text-sm">
                要対応会員: {first90DaysSummary.first90DaysRetentionAlertCount}人
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-red-400">
                {first90DaysSummary.highRiskFirst90DaysMembers.length}
              </p>
              <span className="text-zinc-400 text-sm">人</span>
            </div>
          </div>
        </div>

        {/* 要対応会員一覧 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h3 className="text-xl font-semibold">要対応会員一覧</h3>
            <p className="text-zinc-400 text-sm mt-1">
              入会後90日以内でリスクが高い会員（最大5名）
            </p>
          </div>
          {urgentFirst90DaysMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800 border-b border-zinc-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      名前
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      経過日数
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      リスクスコア
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
                  {urgentFirst90DaysMembers.map((item) => {
                    const segmentInfo = getSegmentInfo(item.segment);
                    return (
                      <tr
                        key={item.member.id}
                        className={`hover:bg-zinc-800/50 transition-colors ${
                          item.riskResult.level === "high"
                            ? "bg-red-500/5"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/members/${item.member.id}`}
                            className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                          >
                            {item.member.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-zinc-300">
                            {item.daysSinceJoin}日
                          </span>
                          {item.daysSinceJoin <= 30 && (
                            <span className="ml-2 text-xs text-red-400 font-medium">
                              (重要期間)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xl font-bold ${getRiskScoreColor(
                              item.riskResult.score
                            )}`}
                          >
                            {item.riskResult.score}
                          </span>
                          <span
                            className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelBadgeColor(
                              item.riskResult.level
                            )}`}
                          >
                            {item.riskResult.level === "high"
                              ? "高"
                              : item.riskResult.level === "medium"
                              ? "中"
                              : "低"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSegmentColor(
                              item.segment
                            )}`}
                            title={segmentInfo.description}
                          >
                            {segmentInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-white text-sm font-medium">
                              {item.suggestion.title}
                            </p>
                            <p className="text-zinc-400 text-xs">
                              {item.suggestion.action}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-medium ${
                                  item.suggestion.priority === "high"
                                    ? "text-red-400"
                                    : item.suggestion.priority === "medium"
                                    ? "text-yellow-400"
                                    : "text-green-400"
                                }`}
                              >
                                優先度:{" "}
                                {item.suggestion.priority === "high"
                                  ? "高"
                                  : item.suggestion.priority === "medium"
                                  ? "中"
                                  : "低"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/members/${item.member.id}`}
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
          ) : (
            <div className="p-8 text-center">
              <p className="text-zinc-400">
                入会後90日以内で要対応の会員はいません
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* デュアル移行最適化 */}
      {shouldShow("planTransition") && (
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">デュアル移行最適化</h2>
          <p className="text-zinc-400 text-sm">
            デュアル月8からトレーニングまたはピラティスへの最適な移行先をAIが提案します
          </p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
            <h3 className="text-zinc-400 text-sm font-medium mb-2">対象会員数</h3>
            <p className="text-3xl font-bold text-white">
              {dualMembers.length}
            </p>
            <p className="text-zinc-500 text-xs mt-2">デュアル月8会員</p>
          </div>

          <div className="bg-zinc-900 border border-blue-500/40 rounded-lg p-6 hover:border-blue-400/60 transition-colors">
            <h3 className="text-zinc-400 text-sm font-medium mb-2">トレーニング推奨</h3>
            <p className="text-3xl font-bold text-blue-400">
              {trainingRecommendedCount}
            </p>
            <p className="text-zinc-500 text-xs mt-2">人</p>
          </div>

          <div className="bg-zinc-900 border border-purple-500/40 rounded-lg p-6 hover:border-purple-400/60 transition-colors">
            <h3 className="text-zinc-400 text-sm font-medium mb-2">ピラティス推奨</h3>
            <p className="text-3xl font-bold text-purple-400">
              {pilatesRecommendedCount}
            </p>
            <p className="text-zinc-500 text-xs mt-2">人</p>
          </div>
        </div>

        {/* 要確認会員一覧 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h3 className="text-xl font-semibold">要確認会員一覧</h3>
            <p className="text-zinc-400 text-sm mt-1">
              デュアル月8会員の移行先推奨（最大5名）
            </p>
          </div>
          {urgentDualMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800 border-b border-zinc-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      名前
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      推奨移行先
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      トレーニング適性
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      ピラティス適性
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      推奨理由
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {urgentDualMembers.map((item) => {
                    const { member, recommendation } = item;
                    return (
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
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                              recommendation.recommendedNextPlan === "トレーニング月8"
                                ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
                                : "text-purple-400 bg-purple-400/10 border-purple-400/20"
                            }`}
                          >
                            {recommendation.recommendedNextPlan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-zinc-800 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  recommendation.trainingFitScore >= 70
                                    ? "bg-blue-400"
                                    : recommendation.trainingFitScore >= 50
                                    ? "bg-blue-500/60"
                                    : "bg-zinc-600"
                                }`}
                                style={{
                                  width: `${recommendation.trainingFitScore}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-zinc-300 w-12 text-right">
                              {recommendation.trainingFitScore}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-zinc-800 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  recommendation.pilatesFitScore >= 70
                                    ? "bg-purple-400"
                                    : recommendation.pilatesFitScore >= 50
                                    ? "bg-purple-500/60"
                                    : "bg-zinc-600"
                                }`}
                                style={{
                                  width: `${recommendation.pilatesFitScore}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-zinc-300 w-12 text-right">
                              {recommendation.pilatesFitScore}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <ul className="space-y-1 text-zinc-400 text-xs">
                            {recommendation.reason.slice(0, 2).map((reason, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span>・</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
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
          ) : (
            <div className="p-8 text-center">
              <p className="text-zinc-400">
                デュアル月8会員がいません
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* トレーナー別継続率 */}
      {shouldShow("trainerMetrics") && (
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">トレーナー別継続率</h2>
          <p className="text-zinc-400 text-sm">
            担当会員の状況をもとに継続率改善の優先順位を確認できます
          </p>
        </div>

        {trainerMetrics.length > 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800 border-b border-zinc-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-300">
                      トレーナー名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-300">
                      担当会員数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-300">
                      高リスク会員数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-300">
                      推定継続率
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-300">
                      月間売上
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-300">
                      年間リスク売上
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {trainerMetrics.map((trainer) => (
                    <tr
                      key={trainer.trainerName}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        {trainer.trainerName}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {trainer.totalMembers}人
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-red-400 font-semibold">
                          {trainer.highRiskMembers}人
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {trainer.estimatedRetentionRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {formatter.format(trainer.monthlyRevenue)}
                      </td>
                      <td className="px-6 py-4 text-red-400 font-semibold">
                        {formatter.format(trainer.annualRevenueAtRisk)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <p className="text-zinc-400">トレーナー別の集計データがありません</p>
          </div>
        )}
      </div>
      )}

      {/* 価格改定影響モニター */}
      {shouldShow("priceRevision") && (
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">価格改定影響モニター</h2>
          <p className="text-zinc-400 text-sm">
            価格改定後の会員リスクと収益影響を確認できます
          </p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors">
            <h3 className="text-zinc-400 text-sm font-medium mb-2">改定対象会員数</h3>
            <p className="text-3xl font-bold text-white">
              {priceRevisionImpact.targetMembers.length}
            </p>
            <p className="text-zinc-500 text-xs mt-2">人</p>
          </div>

          <div className="bg-zinc-900 border border-red-500/40 rounded-lg p-6 hover:border-red-400/60 transition-colors">
            <h3 className="text-zinc-400 text-sm font-medium mb-2">改定後高リスク会員数</h3>
            <p className="text-3xl font-bold text-red-400">
              {priceRevisionImpact.highRiskTargetMembers.length}
            </p>
            <p className="text-zinc-500 text-xs mt-2">人</p>
          </div>

          <div className="bg-zinc-900 border border-green-500/40 rounded-lg p-6 hover:border-green-400/60 transition-colors">
            <h3 className="text-zinc-400 text-sm font-medium mb-2">月間増収見込み</h3>
            <p className="text-3xl font-bold text-green-400">
              {formatter.format(priceRevisionImpact.monthlyRevenueIncrease)}
            </p>
            <p className="text-zinc-500 text-xs mt-2">改定による増収</p>
          </div>

          <div className="bg-zinc-900 border border-red-500/40 rounded-lg p-6 hover:border-red-400/60 transition-colors">
            <h3 className="text-zinc-400 text-sm font-medium mb-2">月間リスク売上</h3>
            <p className="text-3xl font-bold text-red-400">
              {formatter.format(priceRevisionImpact.monthlyRevenueAtRiskAfterRevision)}
            </p>
            <p className="text-zinc-500 text-xs mt-2">高リスク会員の売上</p>
          </div>

          <div className="bg-zinc-900 border border-green-500/40 rounded-lg p-6 hover:border-green-400/60 transition-colors">
            <h3 className="text-zinc-400 text-sm font-medium mb-2">守れた売上見込み</h3>
            <p className="text-3xl font-bold text-green-400">
              {formatter.format(priceRevisionImpact.estimatedProtectedRevenue)}
            </p>
            <p className="text-zinc-500 text-xs mt-2">継続見込みの売上</p>
          </div>
        </div>
      </div>
      )}

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
