import { notFound } from "next/navigation";
import { ContextualMemberLink } from "@/components/navigation/ContextualMemberLink";
import { StoresListBackLink } from "@/components/navigation/StoresListBackLink";
import { memberRepository, taskRepository } from "@/lib/repositories";
import { getStoreScopeId } from "@/lib/authz/serverScope";
import { getTrialStoreNameForData } from "@/lib/trialStore";
import { calculateRiskScore, getRiskReasons } from "@/lib/riskScore";
import { getRevenueAtRisk } from "@/lib/revenueRisk";
import { getInterventionSuggestion } from "@/lib/interventionSuggestion";
import { getChurnPrediction } from "@/lib/churnPrediction";
import { getPriorityQueue, type PriorityQueueItem } from "@/lib/priorityQueue";
import { getReservationAnalysis } from "@/lib/reservationAnalysis";
import { getReservationHeatmapData } from "@/lib/reservationHeatmap";
import { ReservationHeatmap } from "@/components/ReservationHeatmap";
import { getFirst90DaysRiskSummary } from "@/lib/first90Days";
import { getRevenueRiskForecast } from "@/lib/revenueForecast";
import { getRevenueDefenseSimulation } from "@/lib/revenueDefenseSimulation";
import { generateRevenueImprovementPlan } from "@/lib/revenueImprovementAI";
import { getStoreActionPlan } from "@/lib/storeActionPlan";
import { getStoreSuccessFactors } from "@/lib/storeSuccessAI";
import { Member, Task } from "@/types";

interface StoreDetailPageProps {
  params: Promise<{ storeName: string }>;
}

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

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const { storeName } = await params;
  const decodedStoreIdOrName = decodeURIComponent(storeName);

  const scopeStoreId = await getStoreScopeId();
  if (scopeStoreId) {
    const allowedStoreName = getTrialStoreNameForData(scopeStoreId);
    if (decodedStoreIdOrName !== allowedStoreName && decodedStoreIdOrName !== scopeStoreId) {
      notFound();
    }
  }

  // 店舗スコープの会員・タスクのみ取得（全会員取得は行わない）
  const storeMembers = await memberRepository.getAllForStore(decodedStoreIdOrName);

  // タスクは store_id 優先。モック環境では getAllForStore が空を返すため、
  // storeMembers に含まれる会員のIDセットで絞り込む
  const scopedTasks = await taskRepository.getAllForStore(decodedStoreIdOrName);
  const storeMemberIds = new Set(storeMembers.map((m) => m.id));
  const storeTasks =
    scopedTasks.length > 0
      ? scopedTasks
      : (await taskRepository.getAll()).filter((task: Task) =>
          storeMemberIds.has(task.memberId)
        );

  // 基本統計
  const totalMembers = storeMembers.length;
  const highRiskMembers = storeMembers.filter((member: Member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "high";
  }).length;

  // 月間売上とリスク売上、損失予測
  let monthlyRevenue = 0;
  let monthlyRevenueAtRisk = 0;
  let annualRevenueAtRisk = 0;
  let expectedLoss30Days = 0;
  let expectedLoss60Days = 0;

  storeMembers.forEach((member: Member) => {
    const revenue = getRevenueAtRisk(member);
    monthlyRevenue += revenue.monthlyRevenue;

    const forecast = getRevenueRiskForecast(member);
    expectedLoss30Days += forecast.expectedLoss30Days;
    expectedLoss60Days += forecast.expectedLoss60Days;

    const riskResult = calculateRiskScore(member);
    if (riskResult.level === "high") {
      monthlyRevenueAtRisk += revenue.monthlyRevenue;
      annualRevenueAtRisk += revenue.annualRevenueAtRisk;
    }
  });

  // 推定継続率
  const lowRiskMembers = storeMembers.filter((member: Member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "low";
  }).length;

  const mediumRiskMembers = storeMembers.filter((member: Member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "medium";
  }).length;

  const safeMembers = lowRiskMembers + mediumRiskMembers;
  const estimatedRetentionRate =
    totalMembers > 0 ? (safeMembers / totalMembers) * 100 : 0;

  // 危険会員ランキング（リスクスコア順）
  const highRiskMembersList = storeMembers
    .map((member: Member) => {
      const riskResult = calculateRiskScore(member);
      const revenue = getRevenueAtRisk(member);
      return {
        member,
        riskScore: riskResult.score,
        riskLevel: riskResult.level,
        riskReasons: getRiskReasons(member),
        monthlyRevenue: revenue.monthlyRevenue,
        intervention: getInterventionSuggestion(member),
      };
    })
    .filter((item: { member: Member; riskScore: number; riskLevel: "low" | "medium" | "high"; riskReasons: string[]; monthlyRevenue: number; intervention: ReturnType<typeof getInterventionSuggestion> }) => item.riskLevel === "high")
    .sort((a: { member: Member; riskScore: number; riskLevel: "low" | "medium" | "high"; riskReasons: string[]; monthlyRevenue: number; intervention: ReturnType<typeof getInterventionSuggestion> }, b: { member: Member; riskScore: number; riskLevel: "low" | "medium" | "high"; riskReasons: string[]; monthlyRevenue: number; intervention: ReturnType<typeof getInterventionSuggestion> }) => b.riskScore - a.riskScore)
    .slice(0, 10); // トップ10

  // 店舗内の退会予測ランキング（30日予測順、上位5名）
  const churnRanking = storeMembers
    .map((member: Member) => {
      const prediction = getChurnPrediction(member);
      const riskResult = calculateRiskScore(member);
      const intervention = getInterventionSuggestion(member);
      return {
        member,
        prediction,
        riskResult,
        intervention,
      };
    })
    .sort((a: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; riskResult: ReturnType<typeof calculateRiskScore>; intervention: ReturnType<typeof getInterventionSuggestion> }, b: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; riskResult: ReturnType<typeof calculateRiskScore>; intervention: ReturnType<typeof getInterventionSuggestion> }) => b.prediction.probability30Days - a.prediction.probability30Days)
    .slice(0, 5);

  // 今日の優先対応（店舗内の会員から優先キューを取得）
  const priorityQueue = getPriorityQueue(storeMembers).slice(0, 5);

  // 予約問題リスク会員数（店舗内の会員のみで計算）
  const storeReservationAnalysis = getReservationAnalysis(storeMembers);
  const reservationRiskMembersCount = storeReservationAnalysis.reservationRiskMembers.length;
  const difficultReservationMembersCount = storeReservationAnalysis.difficultReservationMembers.length;

  // 入会後90日高リスク会員数
  const first90DaysSummary = getFirst90DaysRiskSummary(storeMembers);
  const first90DaysHighRiskCount = first90DaysSummary.highRiskFirst90DaysMembers.length;

  // 収益防衛シミュレーション（店舗版）
  const storeRevenueDefenseSimulation = getRevenueDefenseSimulation(storeMembers);

  const storeRevenueImprovementPlan = generateRevenueImprovementPlan(storeMembers);

  // 店舗別アクションプラン
  const storeActionPlan = getStoreActionPlan(storeMembers, decodedStoreIdOrName);

  // 予約詰まり時間帯ヒートマップ（店舗専用）
  const storeReservationHeatmap = getReservationHeatmapData(storeMembers);

  // 成功要因分析（他店舗が参考にすべき成功要因）
  const storeSuccessFactors = getStoreSuccessFactors(storeMembers, decodedStoreIdOrName);

  // 介入優先キュー（タスクを優先度順にソート）
  const interventionQueue = storeTasks
    .filter(
      (task: Task) => task.status === "pending" || task.status === "in progress"
    )
    .map((task: Task) => {
      const member = storeMembers.find((m: Member) => m.id === task.memberId);
      const intervention = member
        ? getInterventionSuggestion(member)
        : { priority: "medium" as const };
      return {
        task,
        member,
        priority: intervention.priority,
      };
    })
    .sort((a: { task: Task; member: Member | undefined; priority: "low" | "medium" | "high" }, b: { task: Task; member: Member | undefined; priority: "low" | "medium" | "high" }) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <StoresListBackLink className="text-blue-700 hover:text-blue-800 hover:underline text-sm mb-2 inline-block">
            ← Back to Stores
          </StoresListBackLink>
          <h1 className="text-4xl font-bold mb-2">{decodedStoreIdOrName}</h1>
          <p className="text-slate-600 text-sm">店舗詳細ダッシュボード</p>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <div className="text-slate-600 text-sm mb-1">会員数</div>
          <div className="text-3xl font-bold text-slate-900">{totalMembers}</div>
          <div className="text-slate-500 text-xs mt-1">人</div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <div className="text-slate-600 text-sm mb-1">高リスク会員数</div>
          <div className="text-3xl font-bold text-red-600">{highRiskMembers}</div>
          <div className="text-slate-500 text-xs mt-1">人</div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <div className="text-slate-600 text-sm mb-1">推定継続率</div>
          <div className="text-4xl font-bold text-green-700">
            {estimatedRetentionRate.toFixed(1)}%
          </div>
          <div className="text-slate-500 text-xs mt-1">
            {safeMembers}/{totalMembers}人
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <div className="text-slate-600 text-sm mb-1">月間売上</div>
          <div className="text-3xl font-bold text-slate-900">
            ¥{monthlyRevenue.toLocaleString()}
          </div>
          <div className="text-slate-500 text-xs mt-1">/月</div>
        </div>

        <div className="bg-white border border-red-500/40 rounded-lg p-6">
          <div className="text-slate-600 text-sm mb-1">来月損失予測</div>
          <div className="text-3xl font-bold text-red-600">
            ¥{expectedLoss30Days.toLocaleString()}
          </div>
          <div className="text-slate-500 text-xs mt-1">30日期待損失額</div>
        </div>

        <div className="bg-white border border-red-500/40 rounded-lg p-6">
          <div className="text-slate-600 text-sm mb-1">60日損失予測</div>
          <div className="text-3xl font-bold text-red-600">
            ¥{expectedLoss60Days.toLocaleString()}
          </div>
          <div className="text-slate-500 text-xs mt-1">60日期待損失額</div>
        </div>
      </div>

      {/* リスク売上カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-red-500/40 rounded-lg p-6">
          <div className="text-slate-600 text-sm mb-1">月間リスク売上</div>
          <div className="text-3xl font-bold text-red-600">
            ¥{monthlyRevenueAtRisk.toLocaleString()}
          </div>
          <div className="text-slate-500 text-xs mt-1">/月</div>
        </div>

        <div className="bg-white border border-red-500/40 rounded-lg p-6">
          <div className="text-slate-600 text-sm mb-1">年間リスク売上</div>
          <div className="text-3xl font-bold text-red-600">
            ¥{annualRevenueAtRisk.toLocaleString()}
          </div>
          <div className="text-slate-500 text-xs mt-1">/年</div>
        </div>

        <div className="bg-white border border-orange-500/40 rounded-lg p-6">
          <div className="text-slate-600 text-sm mb-1">予約問題リスク会員数</div>
          <div className="text-3xl font-bold text-orange-700">
            {reservationRiskMembersCount}
          </div>
          <div className="text-slate-500 text-xs mt-1">人</div>
        </div>

        <div className="bg-white border border-red-500/40 rounded-lg p-6">
          <div className="text-slate-600 text-sm mb-1">入会後90日高リスク会員数</div>
          <div className="text-3xl font-bold text-red-600">
            {first90DaysHighRiskCount}
          </div>
          <div className="text-slate-500 text-xs mt-1">人</div>
        </div>
      </div>

      {/* この店舗の収益改善プラン */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-1">この店舗の収益改善プラン</h2>
          <p className="text-slate-600 text-sm">
            当店のLTV・損失予測・90日リスク・予約リスクを踏まえた優先アクションです
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
                  {storeRevenueImprovementPlan.topPriority}
                </p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  想定改善インパクト
                </div>
                <p className="text-xl md:text-2xl font-bold text-emerald-700 leading-snug">
                  {storeRevenueImprovementPlan.expectedImpact}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-white border border-emerald-500/20 p-4">
                  <div className="text-slate-500 mb-1">高インパクト会員数</div>
                  <div className="text-3xl font-bold text-emerald-700">
                    {storeRevenueImprovementPlan.highImpactMemberCount}
                  </div>
                  <div className="text-slate-500 mt-1">高LTV×高リスク</div>
                </div>
                <div className="rounded-lg bg-white border border-slate-200 shadow-sm p-4">
                  <div className="text-slate-500 mb-1">月間売上</div>
                  <div className="text-xl font-bold text-slate-900">
                    ¥{storeRevenueImprovementPlan.metrics.monthlyRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg bg-white border border-red-500/30 p-4">
                  <div className="text-slate-500 mb-1">30日期待損失</div>
                  <div className="text-xl font-bold text-red-600">
                    ¥{storeRevenueImprovementPlan.metrics.expectedLoss30Days.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-white/80 border border-slate-200 p-6">
              <div className="text-sm font-semibold text-slate-700 mb-4">
                今やること（Top 3）
              </div>
              <ul className="space-y-4">
                {storeRevenueImprovementPlan.actions.map((action, idx) => (
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
              <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
                <div>
                  高リスク {storeRevenueImprovementPlan.metrics.highRiskMembers}名 / 90日高リスク{" "}
                  {storeRevenueImprovementPlan.metrics.first90HighRiskCount}名 / 予約リスク{" "}
                  {storeRevenueImprovementPlan.metrics.reservationRiskCount}名
                </div>
                <div>
                  60日期待損失{" "}
                  <span className="text-red-600 font-semibold">
                    ¥{storeRevenueImprovementPlan.metrics.expectedLoss60Days.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 店舗内の退会予測ランキング */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">店舗内 退会予測ランキング</h2>
          {churnRanking.length === 0 ? (
            <p className="text-slate-600 text-sm">退会予測データがありません</p>
          ) : (
            <div className="space-y-3">
              {churnRanking.map((item: { member: Member; prediction: ReturnType<typeof getChurnPrediction>; riskResult: ReturnType<typeof calculateRiskScore>; intervention: ReturnType<typeof getInterventionSuggestion> }, index: number) => (
                <ContextualMemberLink
                  key={item.member.id}
                  memberId={item.member.id}
                  className="block bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-slate-500 text-sm font-semibold w-6">
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">
                          {item.member.name}
                        </div>
                        <div className="text-slate-600 text-xs">
                          {item.member.plan}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div
                        className={`text-lg font-bold ${getRiskScoreColor(
                          item.riskResult.score
                        )}`}
                      >
                        {item.riskResult.score}
                      </div>
                      <div
                        className={`text-sm font-semibold mt-1 ${
                          item.prediction.label30Days === "high"
                            ? "text-red-600"
                            : item.prediction.label30Days === "medium"
                            ? "text-orange-700"
                            : "text-slate-600"
                        }`}
                      >
                        {item.prediction.probability30Days}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="text-slate-600 text-xs">
                      <span className="font-semibold">推奨アクション:</span>{" "}
                      {item.intervention.title}
                    </div>
                    <div className="text-blue-700 text-xs hover:underline">
                      詳細を見る →
                    </div>
                  </div>
                </ContextualMemberLink>
              ))}
            </div>
          )}
        </div>

        {/* 今日の優先対応 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">今日の優先対応</h2>
          {priorityQueue.length === 0 ? (
            <p className="text-slate-600 text-sm">優先対応が必要な会員はありません</p>
          ) : (
            <div className="space-y-3">
              {priorityQueue.map((item: PriorityQueueItem, index: number) => {
                const isHighRisk = item.riskScore >= 70 || item.probability30Days >= 70;
                return (
                  <ContextualMemberLink
                    key={item.id}
                    memberId={item.id}
                    className={`block bg-slate-50 border rounded-lg p-4 hover:bg-slate-100/80 transition-colors ${
                      isHighRisk
                        ? "border-red-500/40"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <span className={`text-sm font-semibold ${
                          isHighRisk ? "text-red-600" : "text-slate-500"
                        }`}>
                          #{index + 1}
                        </span>
                        <div className="flex-1">
                          <div className={`font-semibold ${
                            isHighRisk ? "text-red-700" : "text-slate-900"
                          }`}>
                            {item.name}
                          </div>
                          <div className="text-slate-600 text-xs">
                            {item.member.plan}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span
                          className={`text-xs px-2 py-1 rounded ${getPriorityBadgeColor(
                            item.priority
                          )}`}
                        >
                          {item.priority === "high" ? "高" : item.priority === "medium" ? "中" : "低"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="text-slate-500 text-xs">
                        30日退会確率: {item.probability30Days}%
                      </div>
                      <div className="text-slate-600 text-xs">
                        <span className="font-semibold">推奨アクション:</span>{" "}
                        {item.suggestedAction}
                      </div>
                      <div className="text-blue-700 text-xs hover:underline">
                        詳細を見る →
                      </div>
                    </div>
                  </ContextualMemberLink>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 店舗内の90日モニター */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">入会後90日モニター</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-slate-600 text-sm mb-1">0〜30日会員数</div>
                <div className="text-2xl font-bold text-slate-900">
                  {first90DaysSummary.membersInFirst30Days.length}
                </div>
                <div className="text-slate-500 text-xs mt-1">人</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-slate-600 text-sm mb-1">31〜60日会員数</div>
                <div className="text-2xl font-bold text-slate-900">
                  {first90DaysSummary.membersIn31to60Days.length}
                </div>
                <div className="text-slate-500 text-xs mt-1">人</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-slate-600 text-sm mb-1">61〜90日会員数</div>
                <div className="text-2xl font-bold text-slate-900">
                  {first90DaysSummary.membersIn61to90Days.length}
                </div>
                <div className="text-slate-500 text-xs mt-1">人</div>
              </div>
              <div className="bg-slate-50 border border-red-500/40 rounded-lg p-4">
                <div className="text-slate-600 text-sm mb-1">90日以内高リスク会員数</div>
                <div className="text-2xl font-bold text-red-600">
                  {first90DaysHighRiskCount}
                </div>
                <div className="text-slate-500 text-xs mt-1">人</div>
              </div>
            </div>
          </div>
        </div>

        {/* 店舗内の予約問題サマリー */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">予約問題リスク</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-50 border border-orange-500/40 rounded-lg p-4">
                <div className="text-slate-600 text-sm mb-1">予約問題リスク会員数</div>
                <div className="text-2xl font-bold text-orange-700">
                  {reservationRiskMembersCount}
                </div>
                <div className="text-slate-500 text-xs mt-1">人</div>
              </div>
              <div className="bg-slate-50 border border-orange-500/40 rounded-lg p-4">
                <div className="text-slate-600 text-sm mb-1">予約詰まりが疑われる会員数</div>
                <div className="text-2xl font-bold text-orange-700">
                  {difficultReservationMembersCount}
                </div>
                <div className="text-slate-500 text-xs mt-1">人</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 予約詰まり時間帯ヒートマップ（店舗専用） */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          予約詰まり時間帯ヒートマップ
        </h2>
        <p className="text-slate-600 text-xs mb-6">
          予約が集中している曜日・時間帯を可視化しています
        </p>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-slate-600 text-sm mb-1">予約問題リスク会員数</div>
            <div className="text-2xl font-bold text-orange-700">
              {storeReservationHeatmap.reservationRiskMembersCount}
            </div>
            <div className="text-slate-500 text-xs mt-1">人</div>
          </div>

          <div className="bg-slate-50 border border-red-500/40 rounded-lg p-4">
            <div className="text-slate-600 text-sm mb-1">最も詰まっている時間帯</div>
            <div className="text-lg font-bold text-red-600">
              {storeReservationHeatmap.busiestTimeSlot || "なし"}
            </div>
          </div>

          <div className="bg-slate-50 border border-yellow-500/40 rounded-lg p-4">
            <div className="text-slate-600 text-sm mb-1">分散提案が必要な時間帯</div>
            <div className="text-lg font-bold text-yellow-700">
              {storeReservationHeatmap.needsDiversionTimeSlots.length}箇所
            </div>
            {storeReservationHeatmap.needsDiversionTimeSlots.length > 0 && (
              <div className="text-slate-500 text-xs mt-1">
                {storeReservationHeatmap.needsDiversionTimeSlots.slice(0, 2).join(", ")}
                {storeReservationHeatmap.needsDiversionTimeSlots.length > 2 && "..."}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <ReservationHeatmap
            cells={storeReservationHeatmap.cells}
            maxPressure={storeReservationHeatmap.maxPressure}
          />
        </div>
      </div>

      {/* この店舗のアクションプラン */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          この店舗のアクションプラン
        </h2>
        <p className="text-slate-600 text-xs mb-6">
          店舗状況に応じて優先すべき改善行動を自動生成しています
        </p>

        <div
          className={`bg-slate-50 border rounded-lg p-6 ${
            storeActionPlan.priorityLabel === "high"
              ? "border-red-500/40"
              : storeActionPlan.priorityLabel === "medium"
              ? "border-yellow-500/40"
              : "border-slate-200"
          }`}
        >
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`text-sm font-semibold px-3 py-1 rounded ${
                  storeActionPlan.priorityLabel === "high"
                    ? "text-red-600 bg-red-400/10 border border-red-400/20"
                    : storeActionPlan.priorityLabel === "medium"
                    ? "text-yellow-700 bg-yellow-400/10 border border-yellow-400/20"
                    : "text-slate-600 bg-slate-100 border border-slate-200"
                }`}
              >
                {storeActionPlan.priorityLabel === "high"
                  ? "高優先度"
                  : storeActionPlan.priorityLabel === "medium"
                  ? "中優先度"
                  : "低優先度"}
              </span>
              <h3 className="text-lg font-semibold text-slate-900">
                {storeActionPlan.topIssue}
              </h3>
            </div>
            <p className="text-slate-600 text-sm mt-2">
              {storeActionPlan.expectedImpact}
            </p>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              今やること
            </h4>
            <ul className="space-y-2">
              {storeActionPlan.actionItems.map((item: string, index: number) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-slate-700"
                >
                  <span
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                      storeActionPlan.priorityLabel === "high"
                        ? "bg-red-400/20 text-red-600"
                        : storeActionPlan.priorityLabel === "medium"
                        ? "bg-yellow-400/20 text-yellow-700"
                        : "bg-slate-200/90 text-slate-600"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* この店舗の収益防衛シミュレーション */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          この店舗の収益防衛シミュレーション
        </h2>
        <p className="text-slate-600 text-xs mb-6">
          この店舗で優先的に対応すべき会員を守った場合の防衛売上です
        </p>

        {/* KPIカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 border border-red-500/40 rounded-lg p-4">
            <div className="text-slate-600 text-sm mb-1">この店舗の来月損失予測</div>
            <div className="text-3xl font-bold text-red-600">
              ¥{storeRevenueDefenseSimulation.monthlyLossForecast30Days.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 border border-red-500/40 rounded-lg p-4">
            <div className="text-slate-600 text-sm mb-1">この店舗の60日損失予測</div>
            <div className="text-3xl font-bold text-red-600">
              ¥{storeRevenueDefenseSimulation.monthlyLossForecast60Days.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 border border-yellow-500/40 rounded-lg p-4">
            <div className="text-slate-600 text-sm mb-1">あと何円守ればよいか</div>
            <div className="text-3xl font-bold text-yellow-700">
              ¥{storeRevenueDefenseSimulation.revenueGap.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-50 border border-yellow-500/40 rounded-lg p-4">
            <div className="text-slate-600 text-sm mb-1">あと何人守ればよいか</div>
            <div className="text-3xl font-bold text-yellow-700">
              {storeRevenueDefenseSimulation.membersToSaveForGoal}
            </div>
            <div className="text-slate-500 text-xs mt-1">人</div>
          </div>
        </div>

        {/* 防衛シナリオ比較 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-green-500/40 rounded-lg p-4">
            <div className="text-slate-600 text-sm mb-2">上位3人を守った場合の防衛額</div>
            <div className="text-2xl font-bold text-green-700">
              ¥{storeRevenueDefenseSimulation.protectedRevenueIfTop3Saved.toLocaleString()}
            </div>
            <div className="text-slate-500 text-xs mt-2">
              防衛率:{" "}
              {storeRevenueDefenseSimulation.monthlyLossForecast30Days > 0
                ? (
                    (storeRevenueDefenseSimulation.protectedRevenueIfTop3Saved /
                      storeRevenueDefenseSimulation.monthlyLossForecast30Days) *
                    100
                  ).toFixed(1)
                : "0.0"}
              %
            </div>
          </div>

          <div className="bg-slate-50 border border-green-500/40 rounded-lg p-4">
            <div className="text-slate-600 text-sm mb-2">上位5人を守った場合の防衛額</div>
            <div className="text-2xl font-bold text-green-700">
              ¥{storeRevenueDefenseSimulation.protectedRevenueIfTop5Saved.toLocaleString()}
            </div>
            <div className="text-slate-500 text-xs mt-2">
              防衛率:{" "}
              {storeRevenueDefenseSimulation.monthlyLossForecast30Days > 0
                ? (
                    (storeRevenueDefenseSimulation.protectedRevenueIfTop5Saved /
                      storeRevenueDefenseSimulation.monthlyLossForecast30Days) *
                    100
                  ).toFixed(1)
                : "0.0"}
              %
            </div>
          </div>
        </div>
      </div>

      {/* 成功要因（他店舗が参考にすべき成功要因） */}
      {storeSuccessFactors && (
        <div className="bg-white border border-green-500/20 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700">
            成功要因（他店舗が参考にすべき成功要因）
          </h2>
          <p className="text-slate-600 text-xs mb-6">
            この店舗の成功要因を分析し、他店舗への再現アクションを提案しています
          </p>

          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-green-700 font-semibold">成功スコア:</span>
              <span className="text-2xl font-bold text-green-700">
                {storeSuccessFactors.successScore}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 成功要因 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-700">
                成功要因
              </h3>
              {storeSuccessFactors.successFactors.length === 0 ? (
                <p className="text-slate-600 text-sm">成功要因が見つかりませんでした</p>
              ) : (
                <ul className="space-y-2">
                  {storeSuccessFactors.successFactors.map((factor, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 border border-green-500/20 rounded-lg p-3"
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
              )}
            </div>

            {/* 再現アクション */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-yellow-700">
                他店舗への再現アクション
              </h3>
              {storeSuccessFactors.recommendedReplicationActions.length === 0 ? (
                <p className="text-slate-600 text-sm">再現アクションが見つかりませんでした</p>
              ) : (
                <ul className="space-y-2">
                  {storeSuccessFactors.recommendedReplicationActions.map((action, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 border border-yellow-500/20 rounded-lg p-3"
                    >
                      <span className="text-yellow-700 mt-1">→</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

