import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { calculateRiskScore, getRiskReasons, type RiskScoreResult } from "@/lib/riskScore";
import { getInterventionSuggestion } from "@/lib/interventionSuggestion";
import { calculateRetentionMetrics } from "@/lib/retentionMetrics";
import { getMemberSegment, getSegmentInfo, getSegmentColor } from "@/lib/memberSegmentation";
import { RiskTrendChart } from "@/components/RiskTrendChart";
import { getRevenueAtRisk } from "@/lib/revenueRisk";
import { getStoreSummaries } from "@/lib/storeSummary";
import { getKpiGap, getStoreKpiTargets } from "@/lib/kpiGap";
import { getReservationAnalysis } from "@/lib/reservationAnalysis";
import { getReservationHeatmapData } from "@/lib/reservationHeatmap";
import { ReservationHeatmap } from "@/components/ReservationHeatmap";
import { getFirst90DaysRiskSummary } from "@/lib/first90Days";
import { getDualMembers, getRecommendedNextPlan } from "@/lib/planTransition";
import { getTrainerMetrics } from "@/lib/trainerMetrics";
import { getPriceRevisionImpact } from "@/lib/priceRevisionImpact";
import { getChurnPrediction, getChurnPredictionReasons } from "@/lib/churnPrediction";
import { getPriorityQueue } from "@/lib/priorityQueue";
import { getRevenueRiskForecast } from "@/lib/revenueForecast";
import { getRevenueDefenseSimulation } from "@/lib/revenueDefenseSimulation";
import { generateRevenueImprovementPlan } from "@/lib/revenueImprovementAI";
import { analyzeRetentionDrivers, type RetentionDriver } from "@/lib/retentionDriverAI";
import { analyzeSuccessfulStores, type SuccessfulStore } from "@/lib/storeSuccessAI";
import { estimateChurnReasons } from "@/lib/churnReasonAI";
import { generateNextActions } from "@/lib/nextActionAI";
import {
  evaluateTrainerPerformance,
  getTrainerEvaluationLevelLabel,
} from "@/lib/trainerEvaluationAI";
import { analyzeSuccessfulSessions } from "@/lib/successSessionAI";
import { SuccessSessionAnalysisBridge } from "@/components/successSession/SuccessSessionAnalysisBridge";
import { estimateMemberLTV, getLTVLevel, getLTVLevelColor, getLTVLevelBadgeColor } from "@/lib/ltvPrediction";
import {
  roleDashboardConfig,
  getRoleDisplayName,
  getRoleDescription,
  getCurrentRole,
  type DashboardSection,
} from "@/lib/roleConfig";
import { generateHQActionPlan } from "@/lib/hqActionAI";
import { NegotiationDashboard } from "@/components/dashboard/NegotiationDashboard";
import { TrialStoreDisplay } from "@/components/store/TrialStoreDisplay";
import { Role, Member, Task } from "@/types";
import { ImportedDashboardReflection } from "@/components/import/ImportedDashboardReflection";
import { memberRepository, taskRepository } from "@/lib/repositories";

function getRiskScoreColor(score: number): string {
  if (score >= 80) {
    return "text-red-600";
  } else if (score >= 50) {
    return "text-yellow-700";
  } else {
    return "text-green-700";
  }
}

function getRiskLevelBadgeColor(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "text-green-700 bg-green-400/10 border-green-400/20";
    case "medium":
      return "text-yellow-700 bg-yellow-400/10 border-yellow-400/20";
    case "high":
      return "text-red-600 bg-red-400/10 border-red-400/20";
  }
}

function getPriorityColor(priority: "low" | "medium" | "high"): string {
  switch (priority) {
    case "low":
      return "text-green-700";
    case "medium":
      return "text-yellow-700";
    case "high":
      return "text-red-600";
  }
}

function getPriorityBadgeColor(priority: "low" | "medium" | "high"): string {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-400/10 border-red-400/20";
    case "medium":
      return "text-orange-700 bg-orange-400/10 border-orange-400/20";
    case "low":
      return "text-slate-600 bg-slate-100 border-slate-200";
  }
}

export default async function Home() {
  const userAgent = (await headers()).get("user-agent") ?? "";
  const isMobile = /iPhone|iPod|Android.+Mobile|Windows Phone|webOS|BlackBerry/i.test(
    userAgent
  );
  if (isMobile) {
    redirect("/trainer");
  }

  // サーバーでは自ホストへの HTTP ループバックを避け、API Route と同じデータ取得を直接行う
  const [members, tasks] = await Promise.all([
    memberRepository.getAll(),
    taskRepository.getAll(),
  ]);

  // High Risk Members (risk score >= 70)
  const highRiskMembers = members.filter((member: Member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "high";
  }).length;

  // Need Intervention (risk score >= 40)
  const needIntervention = members.filter((member: Member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "medium" || riskResult.level === "high";
  }).length;

  // Today's Tasks (pending + in progress)
  const todaysTasks = tasks.filter(
    (task: Task) => task.status === "pending" || task.status === "in progress"
  ).length;

  // Intervention type counts
  const reservationRiskMembers = members.filter((member: Member) => {
    const suggestion = getInterventionSuggestion(member);
    return suggestion.type === "reservation";
  }).length;

  const motivationRiskMembers = members.filter((member: Member) => {
    const suggestion = getInterventionSuggestion(member);
    return suggestion.type === "motivation";
  }).length;

  const lifestyleRiskMembers = members.filter((member: Member) => {
    const suggestion = getInterventionSuggestion(member);
    return suggestion.type === "lifestyle";
  }).length;

  // Retention Metrics
  const retentionMetrics = calculateRetentionMetrics(members);

  // High Risk Members List (sorted by risk score, max 5)
  const highRiskMembersList = members
    .map((member: Member) => ({
      member,
      riskResult: calculateRiskScore(member),
      suggestion: getInterventionSuggestion(member),
    }))
    .filter(({ riskResult }: { riskResult: RiskScoreResult }) => riskResult.level === "high")
    .sort((a: { member: Member; riskResult: RiskScoreResult; suggestion: ReturnType<typeof getInterventionSuggestion> }, b: { member: Member; riskResult: RiskScoreResult; suggestion: ReturnType<typeof getInterventionSuggestion> }) => b.riskResult.score - a.riskResult.score)
    .slice(0, 5);

  // Need Intervention Members (medium or high, max 5)
  const needInterventionMembers = members
    .map((member: Member) => ({
      member,
      riskResult: calculateRiskScore(member),
      suggestion: getInterventionSuggestion(member),
    }))
    .filter(
      ({ riskResult }: { riskResult: RiskScoreResult }) => riskResult.level === "medium" || riskResult.level === "high"
    )
    .sort((a: { member: Member; riskResult: RiskScoreResult; suggestion: ReturnType<typeof getInterventionSuggestion> }, b: { member: Member; riskResult: RiskScoreResult; suggestion: ReturnType<typeof getInterventionSuggestion> }) => {
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
    .map((member: Member) => ({
      member,
      riskResult: calculateRiskScore(member),
      suggestion: getInterventionSuggestion(member),
      segment: getMemberSegment(member),
    }))
    .sort((a: { member: Member; riskResult: RiskScoreResult; suggestion: ReturnType<typeof getInterventionSuggestion>; segment: ReturnType<typeof getMemberSegment> }, b: { member: Member; riskResult: RiskScoreResult; suggestion: ReturnType<typeof getInterventionSuggestion>; segment: ReturnType<typeof getMemberSegment> }) => b.riskResult.score - a.riskResult.score)
    .slice(0, 5);

  // 今日の優先対応キュー（新しい優先順位ロジックを使用）
  const priorityQueue = getPriorityQueue(members);

  // 退会リスク分布（低/中/高）
  const riskDistribution = members.reduce(
    (acc: { low: number; medium: number; high: number }, member: Member) => {
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
    .map((member: Member) => {
      const riskResult = calculateRiskScore(member);
      const revenue = getRevenueAtRisk(member);
      return { member, riskResult, revenue };
    })
    .filter(({ riskResult }: { riskResult: RiskScoreResult }) => riskResult.level === "high");

  const totalMonthlyRevenueAtRisk = highRiskMembersWithRevenue.reduce(
    (sum: number, { revenue }: { member: Member; riskResult: RiskScoreResult; revenue: ReturnType<typeof getRevenueAtRisk> }) => sum + revenue.monthlyRevenue,
    0
  );

  const totalAnnualRevenueAtRisk = highRiskMembersWithRevenue.reduce(
    (sum: number, { revenue }: { member: Member; riskResult: RiskScoreResult; revenue: ReturnType<typeof getRevenueAtRisk> }) => sum + revenue.annualRevenueAtRisk,
    0
  );

  const dangerousRevenueRanking = highRiskMembersWithRevenue
    .slice()
    .sort((a: { member: Member; riskResult: RiskScoreResult; revenue: ReturnType<typeof getRevenueAtRisk> }, b: { member: Member; riskResult: RiskScoreResult; revenue: ReturnType<typeof getRevenueAtRisk> }) => b.revenue.annualRevenueAtRisk - a.revenue.annualRevenueAtRisk)
    .slice(0, 5);

  // 収益リスクAI: 来月失う可能性のある売上を計算
  const revenueRiskForecasts = members.map((member: Member) => ({
    member,
    forecast: getRevenueRiskForecast(member),
    intervention: getInterventionSuggestion(member),
  }));

  // 来月失う可能性のある売上合計（30日期待損失額の合計）
  const totalExpectedLoss30Days = revenueRiskForecasts.reduce(
    (sum: number, { forecast }: { member: Member; forecast: ReturnType<typeof getRevenueRiskForecast>; intervention: ReturnType<typeof getInterventionSuggestion> }) => sum + forecast.expectedLoss30Days,
    0
  );

  // 60日以内に失う可能性のある売上合計
  const totalExpectedLoss60Days = revenueRiskForecasts.reduce(
    (sum: number, { forecast }: { member: Member; forecast: ReturnType<typeof getRevenueRiskForecast>; intervention: ReturnType<typeof getInterventionSuggestion> }) => sum + forecast.expectedLoss60Days,
    0
  );

  // 高リスク会員による年間危険売上（高リスク会員の年間売上の合計）
  const highRiskAnnualRevenue = revenueRiskForecasts
    .filter(({ member }: { member: Member; forecast: ReturnType<typeof getRevenueRiskForecast>; intervention: ReturnType<typeof getInterventionSuggestion> }) => {
      const riskResult = calculateRiskScore(member);
      return riskResult.level === "high";
    })
    .reduce((sum: number, { forecast }: { member: Member; forecast: ReturnType<typeof getRevenueRiskForecast>; intervention: ReturnType<typeof getInterventionSuggestion> }) => sum + forecast.annualRevenue, 0);

  // 収益リスクランキング（30日期待損失額順、上位5名）
  const revenueRiskRanking = revenueRiskForecasts
    .slice()
    .sort((a: { member: Member; forecast: ReturnType<typeof getRevenueRiskForecast>; intervention: ReturnType<typeof getInterventionSuggestion> }, b: { member: Member; forecast: ReturnType<typeof getRevenueRiskForecast>; intervention: ReturnType<typeof getInterventionSuggestion> }) => b.forecast.expectedLoss30Days - a.forecast.expectedLoss30Days)
    .slice(0, 5);

  // 収益防衛シミュレーション（全体版）
  const revenueDefenseSimulation = getRevenueDefenseSimulation(members);

  const revenueImprovementPlan = generateRevenueImprovementPlan(members);
  const hqActionPlan = generateHQActionPlan(members);

  // 店舗別サマリー
  const storeSummaries = getStoreSummaries(members).sort(
    (a, b) => b.annualRevenueAtRisk - a.annualRevenueAtRisk
  );
  const retentionTopStores = [...storeSummaries]
    .sort((a, b) => b.estimatedRetentionRate - a.estimatedRetentionRate)
    .slice(0, 3);
  const lossTopStores = [...storeSummaries]
    .sort((a, b) => b.expectedLoss30Days - a.expectedLoss30Days)
    .slice(0, 3);
  const successTopStores = [...storeSummaries]
    .sort((a, b) => b.successScore - a.successScore)
    .slice(0, 3);
  const problemTopStores = [...storeSummaries]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3);

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
  const reservationHeatmap = getReservationHeatmapData(members);

  // 入会後90日モニター
  const first90DaysSummary = getFirst90DaysRiskSummary(members);
  const urgentFirst90DaysMembers = first90DaysSummary.membersInFirst30Days
    .concat(first90DaysSummary.membersIn31to60Days)
    .concat(first90DaysSummary.membersIn61to90Days)
    .filter(
      (item) =>
        item.riskResult.level === "medium" || item.riskResult.level === "high"
    )
    .sort((a: { member: Member; riskResult: RiskScoreResult; suggestion: ReturnType<typeof getInterventionSuggestion> }, b: { member: Member; riskResult: RiskScoreResult; suggestion: ReturnType<typeof getInterventionSuggestion> }) => b.riskResult.score - a.riskResult.score)
    .slice(0, 5);

  // デュアル移行最適化
  const dualMembers = getDualMembers(members);
  const dualMembersWithRecommendation = dualMembers.map((member: Member) => ({
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
    .sort((a: { member: Member; recommendation: ReturnType<typeof getRecommendedNextPlan>; riskResult: RiskScoreResult; segment: ReturnType<typeof getMemberSegment> }, b: { member: Member; recommendation: ReturnType<typeof getRecommendedNextPlan>; riskResult: RiskScoreResult; segment: ReturnType<typeof getMemberSegment> }) => b.riskResult.score - a.riskResult.score)
    .slice(0, 5);

  // トレーナー別継続率
  const trainerMetrics = getTrainerMetrics(members);
  const trainerEvaluations = trainerMetrics
    .map((tm) => evaluateTrainerPerformance(members, tm.trainerName))
    .filter((ev) => ev.trainerName !== "未割り当て");
  const supportPriorityTrainers = trainerEvaluations
    .slice()
    .sort((a, b) => {
      const weight: Record<typeof a.level, number> = {
        support_needed: 4,
        watch: 3,
        good: 2,
        excellent: 1,
      };
      const levelDiff = weight[b.level] - weight[a.level];
      if (levelDiff !== 0) return levelDiff;
      return a.summaryScore - b.summaryScore;
    })
    .slice(0, 3);
  const successSessionAnalysis = analyzeSuccessfulSessions(members);

  // 価格改定影響モニター
  const priceRevisionImpact = getPriceRevisionImpact(members);

  // 未来退会予測データ
  const churnPredictions = members.map((member: Member) => ({
    member,
    prediction: getChurnPrediction(member),
    suggestion: getInterventionSuggestion(member),
  }));
  const topChurnPredictions = churnPredictions
    .slice()
    .sort((a: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; suggestion: ReturnType<typeof getInterventionSuggestion> }, b: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; suggestion: ReturnType<typeof getInterventionSuggestion> }) => b.prediction.probability30Days - a.prediction.probability30Days)
    .slice(0, 5);
  const highRisk30Days = churnPredictions.filter((item: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; suggestion: ReturnType<typeof getInterventionSuggestion> }) => item.prediction.label30Days === "high").length;
  const highRisk60Days = churnPredictions.filter((item: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; suggestion: ReturnType<typeof getInterventionSuggestion> }) => item.prediction.label60Days === "high").length;
  const churnReasonByMember = new Map<string, ReturnType<typeof estimateChurnReasons>>(
    members.map((member: Member) => [member.id, estimateChurnReasons(member)])
  );
  const churnReasonSummary = Array.from(churnReasonByMember.values())
    .flatMap((item) => item.reasons.map((reason) => reason.tag))
    .reduce((acc: Record<string, number>, tag: string) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    }, {});
  const topChurnReasonAnalysis: Array<{ tag: string; count: number }> = Object.entries(churnReasonSummary)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const priorityTodayRows = priorityQueue.slice(0, 5).map((item) => {
    const reasons = churnReasonByMember.get(item.id);
    const tags = reasons?.reasons.slice(0, 3).map((r) => r.tag) ?? [];
    const next = generateNextActions(item.member, undefined, reasons);
    const first = next.actions[0];
    const desc = first?.description ?? "";
    return {
      id: item.id,
      name: item.name,
      probability30Days: item.probability30Days,
      churnTags: tags,
      nextTitle: first?.title ?? "—",
      nextDescShort: desc.length > 120 ? `${desc.slice(0, 117)}…` : desc,
    };
  });

  const churnRankRows = topChurnPredictions.map(
    ({
      member,
      prediction,
    }: {
      member: Member;
      prediction: ReturnType<typeof getChurnPrediction>;
    }) => ({
      member,
      prediction,
      expectedLoss30Days: getRevenueRiskForecast(member).expectedLoss30Days,
    })
  );

  const pitchStores = [...storeSummaries]
    .sort((a, b) => b.expectedLoss30Days - a.expectedLoss30Days)
    .slice(0, 5);

  // 継続率ドライバー分析AI
  const retentionDriverAnalysis = analyzeRetentionDrivers(members);

  // 成功店舗の再現AI
  const storeSuccessAnalysis = analyzeSuccessfulStores(members);

  // 顧客LTVランキング
  const ltvRanking = members
    .map((member: Member) => ({
      member,
      ltv: estimateMemberLTV(member),
      riskResult: calculateRiskScore(member),
    }))
    .sort((a: { member: Member; ltv: ReturnType<typeof estimateMemberLTV>; riskResult: RiskScoreResult }, b: { member: Member; ltv: ReturnType<typeof estimateMemberLTV>; riskResult: RiskScoreResult }) => b.ltv.riskAdjustedLTV - a.ltv.riskAdjustedLTV)
    .slice(0, 10); // Top 10

  // ダミーロール設定（将来的に認証から取得）
  // TODO: 実認証連携時に以下に置き換え
  // const currentRole = await getCurrentRoleFromSession();
  const currentRole: Role = getCurrentRole();
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="hidden md:block">
          <NegotiationDashboard
            memberCount={members.length}
            estimatedRetentionRate={retentionMetrics.estimatedRetentionRate}
            highRiskCount={highRiskMembers}
            nextMonthLoss={totalExpectedLoss30Days}
            priorityToday={priorityTodayRows}
            churnRanking={churnRankRows}
            revenueRisk={{
              loss30: totalExpectedLoss30Days,
              loss60: totalExpectedLoss60Days,
              annualDanger: highRiskAnnualRevenue,
              membersToDefend: needIntervention,
            }}
            topStores={pitchStores}
            hqPlan={hqActionPlan}
          />

          <div className="my-16 border-t border-slate-200/80" aria-hidden />
        </div>

        <div className="mb-10 rounded-xl border border-slate-200/80 bg-white/30 p-4 sm:p-5">
          <ImportedDashboardReflection baseMembersFromServer={members} />
        </div>

        <header className="mb-10 border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-xl font-semibold text-slate-800">詳細ダッシュボード</h2>
            <TrialStoreDisplay className="text-sm" />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {getRoleDescription(currentRole)}（表示ロール: {getRoleDisplayName(currentRole)}）
          </p>
        </header>

      {/* 収益防衛シミュレーション */}
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">収益防衛シミュレーション</h2>
          <p className="text-slate-600 text-sm">
            優先度の高い会員から守った場合に防衛できる売上を試算しています
          </p>
        </div>

        {/* KPIカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-red-500/40 rounded-lg p-6">
            <div className="text-slate-600 text-sm mb-1">来月失う可能性のある売上</div>
            <div className="text-4xl font-bold text-red-600">
              ¥{revenueDefenseSimulation.monthlyLossForecast30Days.toLocaleString()}
            </div>
            <div className="text-slate-500 text-xs mt-1">30日期待損失額</div>
          </div>

          <div className="bg-white border border-red-500/40 rounded-lg p-6">
            <div className="text-slate-600 text-sm mb-1">60日以内に失う可能性のある売上</div>
            <div className="text-4xl font-bold text-red-600">
              ¥{revenueDefenseSimulation.monthlyLossForecast60Days.toLocaleString()}
            </div>
            <div className="text-slate-500 text-xs mt-1">60日期待損失額</div>
          </div>

          <div className="bg-white border border-yellow-500/40 rounded-lg p-6">
            <div className="text-slate-600 text-sm mb-1">あと何円守ればよいか</div>
            <div className="text-4xl font-bold text-yellow-700">
              ¥{revenueDefenseSimulation.revenueGap.toLocaleString()}
            </div>
            <div className="text-slate-500 text-xs mt-1">目標防衛額のギャップ</div>
          </div>

          <div className="bg-white border border-yellow-500/40 rounded-lg p-6">
            <div className="text-slate-600 text-sm mb-1">あと何人守ればよいか</div>
            <div className="text-4xl font-bold text-yellow-700">
              {revenueDefenseSimulation.membersToSaveForGoal}
            </div>
            <div className="text-slate-500 text-xs mt-1">人</div>
          </div>
        </div>

        {/* 防衛シナリオ比較 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">防衛シナリオ比較</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-green-500/40 rounded-lg p-6">
              <div className="text-slate-600 text-sm mb-2">上位3人を守った場合</div>
              <div className="text-3xl font-bold text-green-700">
                ¥{revenueDefenseSimulation.protectedRevenueIfTop3Saved.toLocaleString()}
              </div>
              <div className="text-slate-500 text-xs mt-2">
                防衛率:{" "}
                {revenueDefenseSimulation.monthlyLossForecast30Days > 0
                  ? (
                      (revenueDefenseSimulation.protectedRevenueIfTop3Saved /
                        revenueDefenseSimulation.monthlyLossForecast30Days) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                %
              </div>
            </div>

            <div className="bg-slate-50 border border-green-500/40 rounded-lg p-6">
              <div className="text-slate-600 text-sm mb-2">上位5人を守った場合</div>
              <div className="text-3xl font-bold text-green-700">
                ¥{revenueDefenseSimulation.protectedRevenueIfTop5Saved.toLocaleString()}
              </div>
              <div className="text-slate-500 text-xs mt-2">
                防衛率:{" "}
                {revenueDefenseSimulation.monthlyLossForecast30Days > 0
                  ? (
                      (revenueDefenseSimulation.protectedRevenueIfTop5Saved /
                        revenueDefenseSimulation.monthlyLossForecast30Days) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                %
              </div>
            </div>

            <div className="bg-slate-50 border border-green-500/40 rounded-lg p-6">
              <div className="text-slate-600 text-sm mb-2">高リスク全体を守った場合</div>
              <div className="text-3xl font-bold text-green-700">
                ¥{revenueDefenseSimulation.protectedRevenueIfHighRiskSaved.toLocaleString()}
              </div>
              <div className="text-slate-500 text-xs mt-2">
                防衛率:{" "}
                {revenueDefenseSimulation.monthlyLossForecast30Days > 0
                  ? (
                      (revenueDefenseSimulation.protectedRevenueIfHighRiskSaved /
                        revenueDefenseSimulation.monthlyLossForecast30Days) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                %
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 収益改善AI */}
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">収益改善AI</h2>
          <p className="text-slate-600 text-sm">
            継続率・LTV・収益リスク・防衛シミュレーションから、優先して取り組むテーマを提案します
          </p>
        </div>
        <div className="bg-slate-50 border border-emerald-500/35 rounded-xl p-8 shadow-xl shadow-slate-900/10 ring-1 ring-emerald-500/10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-emerald-700/90 font-semibold mb-2">
                  最優先の改善テーマ
                </div>
                <p className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                  {revenueImprovementPlan.topPriority}
                </p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  想定改善インパクト
                </div>
                <p className="text-xl md:text-2xl font-bold text-emerald-700 leading-snug">
                  {revenueImprovementPlan.expectedImpact}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="rounded-md bg-white border border-slate-200 shadow-sm px-3 py-1.5 text-slate-700">
                  月間売上{" "}
                  <span className="text-slate-900 font-semibold">
                    ¥{revenueImprovementPlan.metrics.monthlyRevenue.toLocaleString()}
                  </span>
                </span>
                <span className="rounded-md bg-white border border-slate-200 shadow-sm px-3 py-1.5 text-slate-700">
                  平均リスク調整LTV{" "}
                  <span className="text-slate-900 font-semibold">
                    ¥{revenueImprovementPlan.metrics.avgRiskAdjustedLTV.toLocaleString()}
                  </span>
                </span>
                <span className="rounded-md bg-white border border-red-500/30 px-3 py-1.5 text-slate-700">
                  30日期待損失{" "}
                  <span className="text-red-600 font-semibold">
                    ¥{revenueImprovementPlan.metrics.expectedLoss30Days.toLocaleString()}
                  </span>
                </span>
                <span className="rounded-md bg-white border border-red-500/25 px-3 py-1.5 text-slate-700">
                  60日期待損失{" "}
                  <span className="text-red-600 font-semibold">
                    ¥{revenueImprovementPlan.metrics.expectedLoss60Days.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-white/80 border border-slate-200 p-6">
              <div className="text-sm font-semibold text-slate-700 mb-4">
                今やること（Top 3）
              </div>
              <ul className="space-y-4">
                {revenueImprovementPlan.actions.map((action, idx) => (
                  <li key={`${action.title}-${idx}`} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 text-sm font-bold border border-emerald-500/30">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-slate-900 font-medium text-sm leading-snug">
                        {action.title}
                      </div>
                      <div className="text-emerald-700/90 text-xs mt-1 font-medium">
                        {action.impact}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 退会リスク売上 */}
      {shouldShow("revenueAtRisk") && (
      <div className="mb-12">
        <div className="bg-white border-2 border-red-500/40 rounded-lg p-6 hover:border-red-400/60 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">退会リスク売上</h2>
              <p className="text-slate-600 text-sm">
                高リスク会員が退会した場合に失う可能性のある売上です
              </p>
            </div>
            <div className="flex gap-8 flex-wrap lg:justify-end">
              <div className="text-right">
                <p className="text-slate-600 text-xs mb-1">月間リスク売上</p>
                <p className="text-2xl font-extrabold text-red-600">
                  {formatter.format(totalMonthlyRevenueAtRisk)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-600 text-xs mb-1">年間リスク売上</p>
                <p className="text-2xl font-extrabold text-red-700">
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
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                        順位
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                        名前
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                        プラン
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                        月額売上
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                        年間リスク売上
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                        リスクスコア
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {dangerousRevenueRanking.map(({ member, revenue, riskResult }: { member: Member; revenue: ReturnType<typeof getRevenueAtRisk>; riskResult: RiskScoreResult }, index: number) => (
                      <tr key={member.id} className="hover:bg-slate-100/80 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-700">#{index + 1}</td>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            href={`/members/${member.id}`}
                            className="text-blue-700 hover:text-blue-800 hover:underline font-medium"
                          >
                            {member.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{member.plan}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-900">
                          {formatter.format(revenue.monthlyRevenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-700 font-semibold">
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
                            className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-700 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors inline-block"
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
              <p className="text-slate-600 text-sm">
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
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
          <div className="flex items-start justify-between mb-4 gap-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">店舗別サマリー</h2>
              <p className="text-slate-600 text-sm">
                店舗ごとの継続率と危険売上を一覧で確認できます
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                    店舗名
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    会員数
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    高リスク会員数
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    推定継続率
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    月間売上
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    月間リスク売上
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    年間リスク売上
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {storeSummaries.map((store) => (
                  <tr key={store.storeName} className="hover:bg-slate-100/80 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      <Link
                        href={`/store/${encodeURIComponent(store.storeName)}`}
                        className="text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        {store.storeName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-900">
                      {store.totalMembers}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="font-semibold text-red-600">
                        {store.highRiskMembers}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-900">
                      {store.estimatedRetentionRate.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-900">
                      {formatter.format(store.monthlyRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-yellow-300">
                      {formatter.format(store.monthlyRevenueAtRisk)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-700 font-semibold">
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

      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-2">店舗ランキング</h2>
          <p className="text-slate-600 text-sm">
            継続・収益・損失リスクを並べて、優先改善が必要な店舗を一目で判断できます
          </p>
        </div>
        {storeSummaries.length === 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
            <p className="text-slate-600 text-sm">店舗ランキング対象データがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4">
              <h3 className="text-green-300 text-sm font-semibold mb-1">継続率上位3店舗</h3>
              <p className="text-slate-500 text-xs mb-2">継続率が高い順に並べています</p>
              <div className="space-y-2">
                {retentionTopStores.map((store, idx) => (
                  <Link key={store.storeName} href={`/store/${encodeURIComponent(store.storeName)}`} className="block bg-slate-50 border border-green-500/20 rounded px-3 py-2 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900 text-sm">{idx + 1}. {store.storeName}</span>
                      <span className="text-green-300 text-xs font-semibold">{store.estimatedRetentionRate.toFixed(1)}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4">
              <h3 className="text-red-700 text-sm font-semibold mb-1">来月損失予測上位3店舗</h3>
              <p className="text-slate-500 text-xs mb-2">来月失う可能性のある売上が大きい順です</p>
              <div className="space-y-2">
                {lossTopStores.map((store, idx) => (
                  <Link key={store.storeName} href={`/store/${encodeURIComponent(store.storeName)}`} className="block bg-slate-50 border border-red-500/20 rounded px-3 py-2 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900 text-sm">{idx + 1}. {store.storeName}</span>
                      <span className="text-red-700 text-xs font-semibold">{formatter.format(store.expectedLoss30Days)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4">
              <h3 className="text-emerald-800 text-sm font-semibold mb-1">成功店舗上位3店舗</h3>
              <p className="text-slate-500 text-xs mb-2">成功度スコアが高い順です</p>
              <div className="space-y-2">
                {successTopStores.map((store, idx) => (
                  <Link key={store.storeName} href={`/store/${encodeURIComponent(store.storeName)}`} className="block bg-slate-50 border border-emerald-500/20 rounded px-3 py-2 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900 text-sm">{idx + 1}. {store.storeName}</span>
                      <span className="text-emerald-800 text-xs font-semibold">Score {store.successScore}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4">
              <h3 className="text-orange-300 text-sm font-semibold mb-1">問題店舗上位3店舗</h3>
              <p className="text-slate-500 text-xs mb-2">リスクスコアが高い順です</p>
              <div className="space-y-2">
                {problemTopStores.map((store, idx) => (
                  <Link key={store.storeName} href={`/store/${encodeURIComponent(store.storeName)}`} className="block bg-slate-50 border border-orange-500/20 rounded px-3 py-2 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900 text-sm">{idx + 1}. {store.storeName}</span>
                      <span className="text-orange-300 text-xs font-semibold">Risk {store.riskScore}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI緊張感モード */}
      {shouldShow("kpiGap") && (
      <div className="mb-12">
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
          <div className="flex items-start justify-between mb-4 gap-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">KPI緊張感モード</h2>
              <p className="text-slate-600 text-sm">
                目標達成までに守るべき人数と売上差分を表示しています
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                    店舗名
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    今月売上目標
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    現在売上
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    売上差分
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    継続率目標
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    現在継続率
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    継続率差分
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    あと何人守ればよいか
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                    あと何円守ればよいか
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {storeKpiRows.map(({ summary, target, gap }) => {
                  const revenueNegative = gap.revenueGap > 0; // 目標に届いていない
                  const retentionNegative = gap.retentionGap > 0; // 目標に届いていない
                  return (
                    <tr key={summary.storeName} className="hover:bg-slate-100/80 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {summary.storeName}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900">
                        {formatter.format(target.targetMonthlyRevenue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900">
                        {formatter.format(summary.monthlyRevenue)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-semibold ${
                          revenueNegative ? "text-red-600" : "text-green-700"
                        }`}
                      >
                        {formatter.format(gap.revenueGap)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900">
                        {target.targetRetentionRate.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900">
                        {summary.estimatedRetentionRate.toFixed(1)}%
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-semibold ${
                          retentionNegative ? "text-red-600" : "text-green-700"
                        }`}
                      >
                        {gap.retentionGap.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900">
                        {gap.membersToSave}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900">
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
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">退会リスク分布</h2>
              <p className="text-slate-600 text-sm">
                現在の会員リスク状況を表示しています
              </p>
            </div>
            <div className="flex gap-4 flex-wrap justify-end">
              <div className="text-right">
                <p className="text-slate-600 text-xs">低リスク</p>
                <p className="text-lg font-bold text-green-700">
                  {riskDistribution.low}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-600 text-xs">中リスク</p>
                <p className="text-lg font-bold text-yellow-700">
                  {riskDistribution.medium}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-600 text-xs">高リスク</p>
                <p className="text-lg font-bold text-red-600">
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
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
          <h2 className="text-slate-600 text-sm font-medium mb-2">退会リスク高</h2>
          <p className="text-3xl font-bold text-slate-900">{highRiskMembers}</p>
        </div>
        
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
          <h2 className="text-slate-600 text-sm font-medium mb-2">介入必要</h2>
          <p className="text-3xl font-bold text-slate-900">{needIntervention}</p>
        </div>
        
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
          <h2 className="text-slate-600 text-sm font-medium mb-2">本日のタスク</h2>
          <p className="text-3xl font-bold text-slate-900">{todaysTasks}</p>
        </div>
      </div>
      )}

      {/* Second Row: Intervention Type Cards */}
      {shouldShow("interventionTypeCards") && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
          <h2 className="text-slate-600 text-sm font-medium mb-2">予約問題リスク</h2>
          <p className="text-3xl font-bold text-purple-400">{reservationRiskMembers}</p>
        </div>
        
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
          <h2 className="text-slate-600 text-sm font-medium mb-2">モチベーション低下リスク</h2>
          <p className="text-3xl font-bold text-orange-700">{motivationRiskMembers}</p>
        </div>
        
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
          <h2 className="text-slate-600 text-sm font-medium mb-2">生活変化リスク</h2>
          <p className="text-3xl font-bold text-blue-700">{lifestyleRiskMembers}</p>
        </div>
      </div>
      )}

      {/* Retention Overview Section */}
      {shouldShow("retentionOverview") && (
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">継続率サマリー</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
            <h2 className="text-slate-600 text-sm font-medium mb-2">アクティブ会員</h2>
            <p className="text-3xl font-bold text-green-700">{retentionMetrics.activeMembers}</p>
            <p className="text-slate-500 text-xs mt-2">
              低・中リスク会員
            </p>
          </div>
          
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
            <h2 className="text-slate-600 text-sm font-medium mb-2">退会リスク高</h2>
            <p className="text-3xl font-bold text-red-600">{retentionMetrics.highRiskMembers}</p>
            <p className="text-slate-500 text-xs mt-2">
              要対応
            </p>
          </div>
          
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
            <h2 className="text-slate-600 text-sm font-medium mb-2">推定継続率</h2>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-blue-700">{retentionMetrics.estimatedRetentionRate}</p>
              <span className="text-xl text-slate-600">%</span>
            </div>
            <p className="text-slate-500 text-xs mt-2">
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
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      名前
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      リスクスコア
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      リスクレベル
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      提案タイトル
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      推定退会理由
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      クイックアクション
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {highRiskMembersList.map(({ member, riskResult, suggestion }: { member: Member; riskResult: RiskScoreResult; suggestion: ReturnType<typeof getInterventionSuggestion> }) => (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-100/80 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/members/${member.id}`}
                          className="text-blue-700 hover:text-blue-800 hover:underline font-medium"
                        >
                          {member.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{member.plan}</td>
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
                        <span className="text-slate-700 text-sm">{suggestion.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const churnReasons = estimateChurnReasons(member);
                          return churnReasons.reasons.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {churnReasons.reasons.slice(0, 2).map((reason, idx: number) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                                    reason.severity === "high"
                                      ? "text-red-600 bg-red-400/10 border-red-400/20"
                                      : "text-yellow-700 bg-yellow-400/10 border-yellow-400/20"
                                  }`}
                                  title={reason.description}
                                >
                                  {reason.tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          {suggestion.type === "reservation" && (
                            <>
                              <button className="px-3 py-1 text-xs bg-blue-500/20 text-blue-700 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors">
                                電話
                              </button>
                              <button className="px-3 py-1 text-xs bg-green-500/20 text-green-700 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors">
                                メッセージ
                              </button>
                              <button className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/30 transition-colors">
                                時間提案
                              </button>
                            </>
                          )}
                          {suggestion.type === "motivation" && (
                            <>
                              <button className="px-3 py-1 text-xs bg-green-500/20 text-green-700 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors">
                                メッセージ
                              </button>
                              <button className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-700 border border-yellow-500/30 rounded hover:bg-yellow-500/30 transition-colors">
                                プラン確認
                              </button>
                              <button className="px-3 py-1 text-xs bg-orange-500/20 text-orange-700 border border-orange-500/30 rounded hover:bg-orange-500/30 transition-colors">
                                目標設定
                              </button>
                            </>
                          )}
                          {suggestion.type === "lifestyle" && (
                            <>
                              <button className="px-3 py-1 text-xs bg-blue-500/20 text-blue-700 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors">
                                電話
                              </button>
                              <button className="px-3 py-1 text-xs bg-green-500/20 text-green-700 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors">
                                メッセージ
                              </button>
                              <button className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-700 border border-yellow-500/30 rounded hover:bg-yellow-500/30 transition-colors">
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
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-8 text-center">
            <p className="text-slate-600">現在リスクの高い会員はいません</p>
          </div>
        )}
      </div>
      )}

      {/* Need Intervention Members */}
      {shouldShow("needInterventionMembers") && (
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">介入推奨会員</h2>
        {needInterventionMembers.length > 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      名前
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      優先度
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      推奨アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {needInterventionMembers.map(({ member, suggestion }: { member: Member; riskResult: RiskScoreResult; suggestion: ReturnType<typeof getInterventionSuggestion> }) => (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-100/80 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/members/${member.id}`}
                          className="text-blue-700 hover:text-blue-800 hover:underline font-medium"
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
                          <p className="text-slate-900 text-sm font-medium mb-1">
                            {suggestion.title}
                          </p>
                          <p className="text-slate-600 text-xs">{suggestion.action}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-8 text-center">
            <p className="text-slate-600">現在介入が必要な会員はいません</p>
          </div>
        )}
      </div>
      )}

      {/* 予約詰まり分析 */}
      {shouldShow("reservationAnalysis") && (
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">予約詰まり分析</h2>
          <p className="text-slate-600 text-sm">
            予約の取りづらさは継続率に直結する重要指標です
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 予約問題リスク会員数 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">予約問題リスク会員数</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">予約問題リスク会員</span>
                <span className="text-2xl font-bold text-orange-700">
                  {reservationAnalysis.reservationRiskMembers.length}人
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">予約困難会員</span>
                <span className="text-xl font-bold text-red-600">
                  {reservationAnalysis.difficultReservationMembers.length}人
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">予約問題による高リスク会員</span>
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
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">予約が集中している時間帯</h3>
            <div className="space-y-2">
              {reservationAnalysis.busyTimeSlots.slice(0, 5).map((slot) => (
                <div key={slot.timeSlot} className="flex items-center justify-between">
                  <span className="text-slate-700">{slot.timeSlot}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 text-sm">{slot.count}人</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        slot.difficultyLevel === "difficult"
                          ? "text-red-600 bg-red-400/10 border border-red-400/20"
                          : slot.difficultyLevel === "medium"
                          ? "text-yellow-700 bg-yellow-400/10 border border-yellow-400/20"
                          : "text-green-700 bg-green-400/10 border border-green-400/20"
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
                <p className="text-slate-600 text-sm">データがありません</p>
              )}
            </div>
          </div>
        </div>

        {/* 予約が取りづらい店舗ランキング */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold">予約が取りづらい店舗ランキング</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    順位
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    店舗名
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    全会員数
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    予約困難会員
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    予約問題リスク会員
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    高リスク会員（予約問題）
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    プレッシャースコア
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reservationAnalysis.storePressures.map((store, index) => {
                  const rank = index + 1;
                  return (
                    <tr
                      key={store.storeName}
                      className="hover:bg-slate-100/80 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-slate-600">#{rank}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-medium">
                        {store.storeName}
                      </td>
                      <td className="px-6 py-4 text-slate-700">{store.totalMembers}人</td>
                      <td className="px-6 py-4">
                        <span className="text-red-600 font-semibold">
                          {store.difficultReservationMembers}人
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-orange-700 font-semibold">
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
                              ? "text-yellow-700"
                              : "text-green-700"
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

        {/* 予約詰まり時間帯ヒートマップ */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 mb-6">
          <h3 className="text-2xl font-semibold mb-4">
            予約詰まり時間帯ヒートマップ
          </h3>
          <p className="text-slate-600 text-sm mb-6">
            予約が集中している曜日・時間帯を可視化しています
          </p>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-slate-600 text-sm mb-1">予約問題リスク会員数</div>
              <div className="text-2xl font-bold text-orange-700">
                {reservationHeatmap.reservationRiskMembersCount}
              </div>
              <div className="text-slate-500 text-xs mt-1">人</div>
            </div>

            <div className="bg-slate-50 border border-red-500/40 rounded-lg p-4">
              <div className="text-slate-600 text-sm mb-1">最も詰まっている時間帯</div>
              <div className="text-lg font-bold text-red-600">
                {reservationHeatmap.busiestTimeSlot || "なし"}
              </div>
            </div>

            <div className="bg-slate-50 border border-yellow-500/40 rounded-lg p-4">
              <div className="text-slate-600 text-sm mb-1">分散提案が必要な時間帯</div>
              <div className="text-lg font-bold text-yellow-700">
                {reservationHeatmap.needsDiversionTimeSlots.length}箇所
              </div>
              {reservationHeatmap.needsDiversionTimeSlots.length > 0 && (
                <div className="text-slate-500 text-xs mt-1">
                  {reservationHeatmap.needsDiversionTimeSlots.slice(0, 2).join(", ")}
                  {reservationHeatmap.needsDiversionTimeSlots.length > 2 && "..."}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <ReservationHeatmap
              cells={reservationHeatmap.cells}
              maxPressure={reservationHeatmap.maxPressure}
            />
          </div>
        </div>
      </div>
      )}

      {/* 入会後90日モニター */}
      {shouldShow("first90Days") && (
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">入会後90日モニター</h2>
          <p className="text-slate-600 text-sm">
            入会後90日は継続率を左右する最重要期間です
          </p>
        </div>

        {/* 経過日数ごとのカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">0〜30日会員</h3>
            <p className="text-3xl font-bold text-slate-900">
              {first90DaysSummary.membersInFirst30Days.length}
            </p>
            <p className="text-slate-500 text-xs mt-2">入会直後の重要期間</p>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">31〜60日会員</h3>
            <p className="text-3xl font-bold text-slate-900">
              {first90DaysSummary.membersIn31to60Days.length}
            </p>
            <p className="text-slate-500 text-xs mt-2">習慣化の転換期</p>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">61〜90日会員</h3>
            <p className="text-3xl font-bold text-slate-900">
              {first90DaysSummary.membersIn61to90Days.length}
            </p>
            <p className="text-slate-500 text-xs mt-2">継続率の分岐点</p>
          </div>
        </div>

        {/* 高リスク会員数カード */}
        <div className="bg-white border-2 border-red-500/40 rounded-lg p-6 mb-6 hover:border-red-400/60 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">90日以内高リスク会員数</h3>
              <p className="text-slate-600 text-sm">
                要対応会員: {first90DaysSummary.first90DaysRetentionAlertCount}人
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-red-600">
                {first90DaysSummary.highRiskFirst90DaysMembers.length}
              </p>
              <span className="text-slate-600 text-sm">人</span>
            </div>
          </div>
        </div>

        {/* 要対応会員一覧 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-xl font-semibold">要対応会員一覧</h3>
            <p className="text-slate-600 text-sm mt-1">
              入会後90日以内でリスクが高い会員（最大5名）
            </p>
          </div>
          {urgentFirst90DaysMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      名前
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      経過日数
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      リスクスコア
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      会員タイプ
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      推奨アクション
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {urgentFirst90DaysMembers.map((item) => {
                    const segmentInfo = getSegmentInfo(item.segment as "short_term_result" | "habit_builder" | "at_risk_dropout");
                    return (
                      <tr
                        key={item.member.id}
                        className={`hover:bg-slate-100/80 transition-colors ${
                          item.riskResult.level === "high"
                            ? "bg-red-500/5"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/members/${item.member.id}`}
                            className="text-blue-700 hover:text-blue-800 hover:underline font-medium"
                          >
                            {item.member.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-700">
                            {item.daysSinceJoin}日
                          </span>
                          {item.daysSinceJoin <= 30 && (
                            <span className="ml-2 text-xs text-red-600 font-medium">
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
                            <p className="text-slate-900 text-sm font-medium">
                              {item.suggestion.title}
                            </p>
                            <p className="text-slate-600 text-xs">
                              {item.suggestion.action}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-medium ${
                                  item.suggestion.priority === "high"
                                    ? "text-red-600"
                                    : item.suggestion.priority === "medium"
                                    ? "text-yellow-700"
                                    : "text-green-700"
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
                            className="px-4 py-2 text-sm bg-blue-500/20 text-blue-700 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors inline-block"
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
              <p className="text-slate-600">
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
          <p className="text-slate-600 text-sm">
            デュアル月8からトレーニングまたはピラティスへの最適な移行先をAIが提案します
          </p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">対象会員数</h3>
            <p className="text-3xl font-bold text-slate-900">
              {dualMembers.length}
            </p>
            <p className="text-slate-500 text-xs mt-2">デュアル月8会員</p>
          </div>

          <div className="bg-white border border-blue-500/40 rounded-lg p-6 hover:border-blue-400/60 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">トレーニング推奨</h3>
            <p className="text-3xl font-bold text-blue-700">
              {trainingRecommendedCount}
            </p>
            <p className="text-slate-500 text-xs mt-2">人</p>
          </div>

          <div className="bg-white border border-purple-500/40 rounded-lg p-6 hover:border-purple-400/60 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">ピラティス推奨</h3>
            <p className="text-3xl font-bold text-purple-400">
              {pilatesRecommendedCount}
            </p>
            <p className="text-slate-500 text-xs mt-2">人</p>
          </div>
        </div>

        {/* 要確認会員一覧 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-xl font-semibold">要確認会員一覧</h3>
            <p className="text-slate-600 text-sm mt-1">
              デュアル月8会員の移行先推奨（最大5名）
            </p>
          </div>
          {urgentDualMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      名前
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      推奨移行先
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      トレーニング適性
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      ピラティス適性
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      推奨理由
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {urgentDualMembers.map((item) => {
                    const { member, recommendation } = item;
                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-slate-100/80 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/members/${member.id}`}
                            className="text-blue-700 hover:text-blue-800 hover:underline font-medium"
                          >
                            {member.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                              recommendation.recommendedNextPlan === "トレーニング月8"
                                ? "text-blue-700 bg-blue-400/10 border-blue-400/20"
                                : "text-purple-400 bg-purple-400/10 border-purple-400/20"
                            }`}
                          >
                            {recommendation.recommendedNextPlan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  recommendation.trainingFitScore >= 70
                                    ? "bg-blue-400"
                                    : recommendation.trainingFitScore >= 50
                                    ? "bg-blue-500/60"
                                    : "bg-slate-400"
                                }`}
                                style={{
                                  width: `${recommendation.trainingFitScore}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-700 w-12 text-right">
                              {recommendation.trainingFitScore}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  recommendation.pilatesFitScore >= 70
                                    ? "bg-purple-400"
                                    : recommendation.pilatesFitScore >= 50
                                    ? "bg-purple-500/60"
                                    : "bg-slate-400"
                                }`}
                                style={{
                                  width: `${recommendation.pilatesFitScore}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-700 w-12 text-right">
                              {recommendation.pilatesFitScore}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <ul className="space-y-1 text-slate-600 text-xs">
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
                            className="px-4 py-2 text-sm bg-blue-500/20 text-blue-700 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors inline-block"
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
              <p className="text-slate-600">
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
          <p className="text-slate-600 text-sm">
            担当会員の状況をもとに継続率改善の優先順位を確認できます
          </p>
        </div>

        {trainerMetrics.length > 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      トレーナー名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      担当会員数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      高リスク会員数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      推定継続率
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      月間売上
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">
                      年間リスク売上
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {trainerMetrics.map((trainer) => (
                    <tr
                      key={trainer.trainerName}
                      className="hover:bg-slate-100/40 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-900 font-medium">
                        <Link
                          href={`/trainers/${encodeURIComponent(trainer.trainerName)}`}
                          className="text-blue-700 hover:underline"
                        >
                          {trainer.trainerName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {trainer.totalMembers}人
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-red-600 font-semibold">
                          {trainer.highRiskMembers}人
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {trainer.estimatedRetentionRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {formatter.format(trainer.monthlyRevenue)}
                      </td>
                      <td className="px-6 py-4 text-red-600 font-semibold">
                        {formatter.format(trainer.annualRevenueAtRisk)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-8 text-center">
            <p className="text-slate-600">トレーナー別の集計データがありません</p>
          </div>
        )}
      </div>
      )}

      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">トレーナー改善提案AI</h2>
          <p className="text-slate-600 text-sm">
            支援優先度の高いトレーナーを可視化し、育成アクションの優先順位を整理します
          </p>
        </div>
        {supportPriorityTrainers.length === 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
            <p className="text-slate-600 text-sm">評価対象のトレーナーがいません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {supportPriorityTrainers.map((trainer) => (
              <div key={trainer.trainerName} className="bg-white border border-slate-200 shadow-sm rounded-lg p-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <Link
                    href={`/trainers/${encodeURIComponent(trainer.trainerName)}`}
                    className="text-blue-700 hover:text-blue-800 hover:underline font-semibold"
                  >
                    {trainer.trainerName}
                  </Link>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                      trainer.level === "support_needed"
                        ? "text-red-700 bg-red-400/10 border-red-400/25"
                        : trainer.level === "watch"
                        ? "text-yellow-300 bg-yellow-400/10 border-yellow-400/25"
                        : trainer.level === "good"
                        ? "text-blue-300 bg-blue-400/10 border-blue-400/25"
                        : "text-green-300 bg-green-400/10 border-green-400/25"
                    }`}
                  >
                    {getTrainerEvaluationLevelLabel(trainer.level)}
                  </span>
                </div>
                <div className="text-slate-500 text-xs mb-3">総合スコア {trainer.summaryScore}</div>
                <div className="text-slate-800 text-sm">
                  最優先改善ポイント:
                  <div className="mt-1 text-yellow-300">
                    {trainer.improvementPoints[0]?.title ?? "現状維持の運用を継続"}
                  </div>
                </div>
                <Link
                  href={`/trainers/${encodeURIComponent(trainer.trainerName)}`}
                  className="mt-4 inline-block text-sm text-blue-700 hover:text-blue-800 hover:underline"
                >
                  詳細を見る →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">成功セッション分析AI</h2>
          <p className="text-slate-600 text-sm">
            継続率が高い会員の傾向を抽出し、現場で再現しやすい成功パターンを可視化しています
          </p>
        </div>
        <SuccessSessionAnalysisBridge
          serverAnalysis={successSessionAnalysis}
          baseMembersFromServer={members}
        />
      </div>

      {/* 価格改定影響モニター */}
      {shouldShow("priceRevision") && (
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">価格改定影響モニター</h2>
          <p className="text-slate-600 text-sm">
            価格改定後の会員リスクと収益影響を確認できます
          </p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">改定対象会員数</h3>
            <p className="text-3xl font-bold text-slate-900">
              {priceRevisionImpact.targetMembers.length}
            </p>
            <p className="text-slate-500 text-xs mt-2">人</p>
          </div>

          <div className="bg-white border border-red-500/40 rounded-lg p-6 hover:border-red-400/60 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">改定後高リスク会員数</h3>
            <p className="text-3xl font-bold text-red-600">
              {priceRevisionImpact.highRiskTargetMembers.length}
            </p>
            <p className="text-slate-500 text-xs mt-2">人</p>
          </div>

          <div className="bg-white border border-green-500/40 rounded-lg p-6 hover:border-green-400/60 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">月間増収見込み</h3>
            <p className="text-3xl font-bold text-green-700">
              {formatter.format(priceRevisionImpact.monthlyRevenueIncrease)}
            </p>
            <p className="text-slate-500 text-xs mt-2">改定による増収</p>
          </div>

          <div className="bg-white border border-red-500/40 rounded-lg p-6 hover:border-red-400/60 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">月間リスク売上</h3>
            <p className="text-3xl font-bold text-red-600">
              {formatter.format(priceRevisionImpact.monthlyRevenueAtRiskAfterRevision)}
            </p>
            <p className="text-slate-500 text-xs mt-2">高リスク会員の売上</p>
          </div>

          <div className="bg-white border border-green-500/40 rounded-lg p-6 hover:border-green-400/60 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">守れた売上見込み</h3>
            <p className="text-3xl font-bold text-green-700">
              {formatter.format(priceRevisionImpact.estimatedProtectedRevenue)}
            </p>
            <p className="text-slate-500 text-xs mt-2">継続見込みの売上</p>
          </div>
        </div>
      </div>
      )}

      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">退会理由AI分析</h2>
          <p className="text-slate-600 text-sm">
            全会員の推定退会理由を集計し、優先して実行すべき対応を示します
          </p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          {topChurnReasonAnalysis.length === 0 ? (
            <p className="text-slate-600 text-sm">分析対象データがありません</p>
          ) : (
            <div className="space-y-3">
              {topChurnReasonAnalysis.map((item, idx) => {
                const actionMap: Record<string, string> = {
                  来店間隔拡大: "14日以上会員へ次回予約リマインド",
                  仕事ストレス: "忙しい会員向けの時短メニュー提案",
                  初期離脱: "入会90日以内会員のフォロー面談強化",
                  予約困難: "予約枠の優先確保と候補時間の先出し",
                  体調悪化: "負荷調整メニューと休養ガイダンス",
                  モチベーション低下: "短期目標の再設定と達成フィードバック",
                  成果実感不足リスク: "食事レビューと週次チェックの導入",
                  目標停滞: "目標再設定と中間KPIの可視化",
                };
                return (
                  <div
                    key={item.tag}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs font-mono">{idx + 1}.</span>
                        <span className="text-slate-900 font-medium">{item.tag}</span>
                      </div>
                      <span className="text-slate-700 text-sm">{item.count}人</span>
                    </div>
                    <p className="mt-1 text-slate-600 text-xs">
                      → {actionMap[item.tag] ?? "対象会員への個別フォローを実施"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 未来退会予測 */}
      {shouldShow("churnPrediction") && (
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">未来退会予測</h2>
          <p className="text-slate-600 text-sm">
            今後30日以内・60日以内に退会する可能性を予測
          </p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-red-500/40 rounded-lg p-6 hover:border-red-400/60 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">30日以内 high 予測会員数</h3>
            <p className="text-3xl font-bold text-red-600">
              {highRisk30Days}
            </p>
            <p className="text-slate-500 text-xs mt-2">人</p>
          </div>

          <div className="bg-white border border-red-500/40 rounded-lg p-6 hover:border-red-400/60 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">60日以内 high 予測会員数</h3>
            <p className="text-3xl font-bold text-red-600">
              {highRisk60Days}
            </p>
            <p className="text-slate-500 text-xs mt-2">人</p>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">30日予測平均確率</h3>
            <p className="text-3xl font-bold text-slate-900">
              {churnPredictions.length > 0
                ? Math.round(
                    churnPredictions.reduce(
                      (sum: number, p: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; suggestion: ReturnType<typeof getInterventionSuggestion> }) => sum + p.prediction.probability30Days,
                      0
                    ) / churnPredictions.length
                  )
                : 0}
            </p>
            <p className="text-slate-500 text-xs mt-2">%</p>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">60日予測平均確率</h3>
            <p className="text-3xl font-bold text-slate-900">
              {churnPredictions.length > 0
                ? Math.round(
                    churnPredictions.reduce(
                      (sum: number, p: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; suggestion: ReturnType<typeof getInterventionSuggestion> }) => sum + p.prediction.probability60Days,
                      0
                    ) / churnPredictions.length
                  )
                : 0}
            </p>
            <p className="text-slate-500 text-xs mt-2">%</p>
          </div>
        </div>

        {/* 予測上位5名 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">予測上位5名</h3>
          {topChurnPredictions.length === 0 ? (
            <p className="text-slate-600 text-sm">予測データがありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      名前
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      30日退会確率
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      60日退会確率
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      会員タイプ
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      推奨アクション
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      詳細
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {topChurnPredictions.map((item: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; suggestion: ReturnType<typeof getInterventionSuggestion> }) => {
                    const segment = getMemberSegment(item.member);
                    const segmentInfo = getSegmentInfo(segment);
                    const displayReasons = (churnReasonByMember.get(item.member.id)?.reasons ?? []).slice(0, 2);
                    return (
                      <tr
                        key={item.member.id}
                        className="hover:bg-slate-100/60 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-900 font-medium">
                          {item.member.name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-lg font-bold ${
                                item.prediction.label30Days === "high"
                                  ? "text-red-600"
                                  : item.prediction.label30Days === "medium"
                                  ? "text-orange-700"
                                  : "text-slate-600"
                              }`}
                            >
                              {item.prediction.probability30Days}%
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                item.prediction.label30Days === "high"
                                  ? "text-red-600 bg-red-400/10 border border-red-400/20"
                                  : item.prediction.label30Days === "medium"
                                  ? "text-orange-700 bg-orange-400/10 border border-orange-400/20"
                                  : "text-slate-600 bg-slate-100 border border-slate-200"
                              }`}
                            >
                              {item.prediction.label30Days === "high"
                                ? "高"
                                : item.prediction.label30Days === "medium"
                                ? "中"
                                : "低"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-lg font-bold ${
                                item.prediction.label60Days === "high"
                                  ? "text-red-600"
                                  : item.prediction.label60Days === "medium"
                                  ? "text-orange-700"
                                  : "text-slate-600"
                              }`}
                            >
                              {item.prediction.probability60Days}%
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                item.prediction.label60Days === "high"
                                  ? "text-red-600 bg-red-400/10 border border-red-400/20"
                                  : item.prediction.label60Days === "medium"
                                  ? "text-orange-700 bg-orange-400/10 border border-orange-400/20"
                                  : "text-slate-600 bg-slate-100 border border-slate-200"
                              }`}
                            >
                              {item.prediction.label60Days === "high"
                                ? "高"
                                : item.prediction.label60Days === "medium"
                                ? "中"
                                : "低"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getSegmentColor(
                              segment
                            )}`}
                          >
                            {segmentInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 text-sm">
                          {item.suggestion.title}
                        </td>
                        <td className="px-4 py-3">
                          {displayReasons.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {displayReasons.map((reason, idx) => (
                                <span
                                  key={`${reason.tag}-${idx}`}
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                                    reason.severity === "high"
                                      ? "text-red-700 bg-red-400/10 border-red-400/25"
                                      : "text-yellow-300 bg-yellow-400/10 border-yellow-400/25"
                                  }`}
                                >
                                  {reason.tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/members/${item.member.id}`}
                            className="text-blue-700 hover:text-blue-800 hover:underline text-sm"
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
          )}
        </div>
      </div>
      )}

      {/* 未来退会予測 */}
      {shouldShow("churnPrediction") && (
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2">未来退会予測</h2>
          <p className="text-slate-600 text-sm">
            今後30日以内・60日以内に退会する可能性を予測
          </p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-red-500/40 rounded-lg p-6 hover:border-red-400/60 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">30日以内 high 予測会員数</h3>
            <p className="text-3xl font-bold text-red-600">
              {highRisk30Days}
            </p>
            <p className="text-slate-500 text-xs mt-2">人</p>
          </div>

          <div className="bg-white border border-red-500/40 rounded-lg p-6 hover:border-red-400/60 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">60日以内 high 予測会員数</h3>
            <p className="text-3xl font-bold text-red-600">
              {highRisk60Days}
            </p>
            <p className="text-slate-500 text-xs mt-2">人</p>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">30日予測平均確率</h3>
            <p className="text-3xl font-bold text-slate-900">
              {churnPredictions.length > 0
                ? Math.round(
                    churnPredictions.reduce(
                      (sum: number, p: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; suggestion: ReturnType<typeof getInterventionSuggestion> }) => sum + p.prediction.probability30Days,
                      0
                    ) / churnPredictions.length
                  )
                : 0}
            </p>
            <p className="text-slate-500 text-xs mt-2">%</p>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 hover:border-slate-200 transition-colors">
            <h3 className="text-slate-600 text-sm font-medium mb-2">60日予測平均確率</h3>
            <p className="text-3xl font-bold text-slate-900">
              {churnPredictions.length > 0
                ? Math.round(
                    churnPredictions.reduce(
                      (sum: number, p: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; suggestion: ReturnType<typeof getInterventionSuggestion> }) => sum + p.prediction.probability60Days,
                      0
                    ) / churnPredictions.length
                  )
                : 0}
            </p>
            <p className="text-slate-500 text-xs mt-2">%</p>
          </div>
        </div>

        {/* 予測上位5名 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">予測上位5名</h3>
          {topChurnPredictions.length === 0 ? (
            <p className="text-slate-600 text-sm">予測データがありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      名前
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      30日退会確率
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      60日退会確率
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      会員タイプ
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      推奨アクション
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      詳細
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {topChurnPredictions.map((item: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; suggestion: ReturnType<typeof getInterventionSuggestion> }) => {
                    const segment = getMemberSegment(item.member);
                    const segmentInfo = getSegmentInfo(segment);
                    return (
                      <tr
                        key={item.member.id}
                        className="hover:bg-slate-100/60 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-900 font-medium">
                          {item.member.name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-lg font-bold ${
                                item.prediction.label30Days === "high"
                                  ? "text-red-600"
                                  : item.prediction.label30Days === "medium"
                                  ? "text-orange-700"
                                  : "text-slate-600"
                              }`}
                            >
                              {item.prediction.probability30Days}%
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                item.prediction.label30Days === "high"
                                  ? "text-red-600 bg-red-400/10 border border-red-400/20"
                                  : item.prediction.label30Days === "medium"
                                  ? "text-orange-700 bg-orange-400/10 border border-orange-400/20"
                                  : "text-slate-600 bg-slate-100 border border-slate-200"
                              }`}
                            >
                              {item.prediction.label30Days === "high"
                                ? "高"
                                : item.prediction.label30Days === "medium"
                                ? "中"
                                : "低"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-lg font-bold ${
                                item.prediction.label60Days === "high"
                                  ? "text-red-600"
                                  : item.prediction.label60Days === "medium"
                                  ? "text-orange-700"
                                  : "text-slate-600"
                              }`}
                            >
                              {item.prediction.probability60Days}%
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                item.prediction.label60Days === "high"
                                  ? "text-red-600 bg-red-400/10 border border-red-400/20"
                                  : item.prediction.label60Days === "medium"
                                  ? "text-orange-700 bg-orange-400/10 border border-orange-400/20"
                                  : "text-slate-600 bg-slate-100 border border-slate-200"
                              }`}
                            >
                              {item.prediction.label60Days === "high"
                                ? "高"
                                : item.prediction.label60Days === "medium"
                                ? "中"
                                : "低"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getSegmentColor(
                              segment
                            )}`}
                          >
                            {segmentInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 text-sm">
                          {item.suggestion.title}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const reasons = getChurnPredictionReasons(item.member);
                            const displayReasons = reasons.slice(0, 2); // 最大2つ
                            return displayReasons.length > 0 ? (
                              <ul className="space-y-1">
                                {displayReasons.map((reason, idx) => (
                                  <li key={idx} className="text-slate-600 text-xs">
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-500 text-xs">-</span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/members/${item.member.id}`}
                            className="text-blue-700 hover:text-blue-800 hover:underline text-sm"
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
          )}
        </div>
      </div>
      )}

      {/* 継続率ドライバー分析AI */}
      {shouldShow("retentionDriverAI") && (
        <div className="mb-12">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-2">継続率ドライバー分析AI</h2>
            <p className="text-slate-600 text-sm mb-6">
              継続会員と高リスク会員の差から、継続率に影響する要因を分析しています
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 継続率を上げる要因 */}
              <div className="bg-slate-50 border border-green-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-green-700">
                  継続率を上げる要因 Top3
                </h3>
                {retentionDriverAnalysis.positiveDrivers.length === 0 ? (
                  <p className="text-slate-600 text-sm">データが不足しています</p>
                ) : (
                  <div className="space-y-4">
                    {retentionDriverAnalysis.positiveDrivers.slice(0, 3).map((driver: RetentionDriver, index: number) => (
                      <div
                        key={index}
                        className="bg-white border border-green-500/30 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-green-700 font-semibold text-sm">
                                #{index + 1}
                              </span>
                              <h4 className="text-slate-900 font-semibold">{driver.factor}</h4>
                            </div>
                            <p className="text-slate-600 text-xs mb-2">{driver.description}</p>
                            <p className="text-green-300 text-xs">{driver.suggestion}</p>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-2xl font-bold text-green-700">
                              {driver.impactScore}
                            </div>
                            <div className="text-slate-500 text-xs">影響度</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 継続率を下げる要因 */}
              <div className="bg-slate-50 border border-red-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-red-600">
                  継続率を下げる要因 Top3
                </h3>
                {retentionDriverAnalysis.negativeDrivers.length === 0 ? (
                  <p className="text-slate-600 text-sm">データが不足しています</p>
                ) : (
                  <div className="space-y-4">
                    {retentionDriverAnalysis.negativeDrivers.slice(0, 3).map((driver: RetentionDriver, index: number) => (
                      <div
                        key={index}
                        className="bg-white border border-red-500/30 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-red-600 font-semibold text-sm">
                                #{index + 1}
                              </span>
                              <h4 className="text-slate-900 font-semibold">{driver.factor}</h4>
                            </div>
                            <p className="text-slate-600 text-xs mb-2">{driver.description}</p>
                            <p className="text-red-700 text-xs">{driver.suggestion}</p>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-2xl font-bold text-red-600">
                              {driver.impactScore}
                            </div>
                            <div className="text-slate-500 text-xs">影響度</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 成功店舗の再現AI */}
      {shouldShow("storeSuccessAI") && (
        <div className="mb-12">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-2">成功店舗の再現AI</h2>
            <p className="text-slate-600 text-sm mb-6">
              成果が出ている店舗の特徴を抽出し、他店舗へ展開できる行動を提案します
            </p>

            {storeSuccessAnalysis.topStores.length === 0 ? (
              <p className="text-slate-600 text-sm">データが不足しています</p>
            ) : (
              <div className="space-y-6">
                {storeSuccessAnalysis.topStores.slice(0, 3).map((store: SuccessfulStore, index: number) => (
                  <div
                    key={store.storeName}
                    className="bg-slate-50 border border-green-500/20 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-green-700 font-semibold text-lg">
                            #{index + 1}
                          </span>
                          <h3 className="text-xl font-semibold text-slate-900">
                            {store.storeName}
                          </h3>
                          <Link
                            href={`/store/${encodeURIComponent(store.storeName)}`}
                            className="text-blue-700 hover:text-blue-800 hover:underline text-sm"
                          >
                            詳細を見る →
                          </Link>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-sm">
                            <span className="text-slate-600">成功スコア: </span>
                            <span className="text-green-700 font-bold text-lg">
                              {store.successScore}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-600">継続率: </span>
                            <span className="text-green-700 font-semibold">
                              {store.metrics.estimatedRetentionRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-600">高リスク会員: </span>
                            <span className="text-green-700 font-semibold">
                              {store.metrics.highRiskMembers}人
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 成功要因 */}
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-green-700">
                          成功要因
                        </h4>
                        <ul className="space-y-2">
                          {store.successFactors.map((factor, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-slate-700"
                            >
                              <span className="text-green-700 mt-1">✓</span>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {factor.factor}
                                </div>
                                <div className="text-slate-600 text-xs mt-1">
                                  {factor.description}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 再現アクション */}
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-yellow-700">
                          他店舗への再現アクション
                        </h4>
                        <ul className="space-y-2">
                          {store.recommendedReplicationActions.map((action, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-slate-700"
                            >
                              <span className="text-yellow-700 mt-1">→</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 顧客LTVランキング */}
      {shouldShow("ltvRanking") && (
        <div className="mb-12">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-2">顧客LTVランキング</h2>
            <p className="text-slate-600 text-sm mb-6">
              TwinCoachが会員行動データから推定した将来売上です
            </p>

            {ltvRanking.length === 0 ? (
              <p className="text-slate-600 text-sm">データが不足しています</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        順位
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        名前
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        プラン
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        推定LTV
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        リスク調整後LTV
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        月額売上
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        継続予測
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        リスクレベル
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ltvRanking.map((item: { member: Member; ltv: ReturnType<typeof estimateMemberLTV>; riskResult: RiskScoreResult }, index: number) => {
                      const ltvLevel = getLTVLevel(item.ltv.riskAdjustedLTV);
                      return (
                        <tr
                          key={item.member.id}
                          className="hover:bg-slate-100/80 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-700">#{index + 1}</td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/members/${item.member.id}`}
                              className="text-blue-700 hover:text-blue-800 hover:underline font-medium"
                            >
                              {item.member.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{item.member.plan}</td>
                          <td className="px-4 py-3">
                            <span className="text-slate-900 font-semibold">
                              ¥{item.ltv.estimatedLTV.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${getLTVLevelColor(ltvLevel)}`}>
                              ¥{item.ltv.riskAdjustedLTV.toLocaleString()}
                            </span>
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getLTVLevelBadgeColor(ltvLevel)}`}>
                                {ltvLevel === "high" ? "高LTV" : ltvLevel === "medium" ? "中LTV" : "低LTV"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            ¥{item.ltv.monthlyValue.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {item.ltv.expectedMonths}ヶ月
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getRiskLevelBadgeColor(
                                item.riskResult.level
                              )}`}
                            >
                              {item.riskResult.level.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/members/${item.member.id}`}
                              className="text-blue-700 hover:text-blue-800 hover:underline text-sm"
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
            )}
          </div>
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">クイックリンク</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/members"
            className="bg-white border border-slate-200 shadow-sm rounded-lg px-6 py-4 hover:border-slate-200 hover:bg-slate-100 transition-colors"
          >
            会員一覧
          </Link>
          <Link
            href="/tasks"
            className="bg-white border border-slate-200 shadow-sm rounded-lg px-6 py-4 hover:border-slate-200 hover:bg-slate-100 transition-colors"
          >
            介入タスク
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
