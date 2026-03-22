import Link from "next/link";
import { memberRepository, taskRepository } from "@/lib/repositories";
import { calculateRiskScore, getRiskReasons } from "@/lib/riskScore";
import { getRevenueAtRisk } from "@/lib/revenueRisk";
import { getInterventionSuggestion } from "@/lib/interventionSuggestion";
import { getChurnPrediction } from "@/lib/churnPrediction";
import { getPriorityQueue } from "@/lib/priorityQueue";
import { getTrainerImprovementSuggestion } from "@/lib/trainerImprovementAI";
import {
  evaluateTrainerPerformance,
  getTrainerEvaluationLevelLabel,
} from "@/lib/trainerEvaluationAI";
import { analyzeSuccessfulSessions } from "@/lib/successSessionAI";
import { SuccessSessionAnalysisBridge } from "@/components/successSession/SuccessSessionAnalysisBridge";
import { Member, Task } from "@/types";

interface TrainerDetailPageProps {
  params: Promise<{ trainerName: string }>;
}

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

export default async function TrainerDetailPage({
  params,
}: TrainerDetailPageProps) {
  const { trainerName } = await params;
  const decodedTrainerName = decodeURIComponent(trainerName);

  // データ取得
  const allMembers = await memberRepository.getAll();
  const allTasks = await taskRepository.getAll();

  // トレーナーごとの会員をフィルタリング
  const trainerMembers = allMembers.filter(
    (member) => member.assignedTrainer === decodedTrainerName
  );

  // トレーナーごとのタスクをフィルタリング
  const trainerTasks = allTasks.filter(
    (task) => task.assignedTrainer === decodedTrainerName
  );

  // 基本統計
  const totalMembers = trainerMembers.length;
  const highRiskMembers = trainerMembers.filter((member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "high";
  }).length;

  // 月間売上と年間リスク売上
  let monthlyRevenue = 0;
  let annualRevenueAtRisk = 0;

  trainerMembers.forEach((member) => {
    const revenue = getRevenueAtRisk(member);
    monthlyRevenue += revenue.monthlyRevenue;

    const riskResult = calculateRiskScore(member);
    if (riskResult.level === "high") {
      annualRevenueAtRisk += revenue.annualRevenueAtRisk;
    }
  });

  // 継続率
  const lowRiskMembers = trainerMembers.filter((member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "low";
  }).length;

  const mediumRiskMembers = trainerMembers.filter((member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "medium";
  }).length;

  const safeMembers = lowRiskMembers + mediumRiskMembers;
  const retentionRate =
    totalMembers > 0 ? (safeMembers / totalMembers) * 100 : 0;

  // 担当会員一覧（リスクスコア順）
  const membersList = trainerMembers
    .map((member) => {
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
    .sort((a, b) => b.riskScore - a.riskScore);

  // 退会予測ランキング（30日退会確率順）
  const churnPredictions = trainerMembers
    .map((member) => {
      const prediction = getChurnPrediction(member);
      const riskResult = calculateRiskScore(member);
      const intervention = getInterventionSuggestion(member);
      return {
        member,
        prediction,
        riskScore: riskResult.score,
        riskLevel: riskResult.level,
        intervention,
      };
    })
    .sort((a, b) => b.prediction.probability30Days - a.prediction.probability30Days)
    .slice(0, 5);

  // 今日の優先対応（getPriorityQueueを使用）
  const priorityQueue = getPriorityQueue(trainerMembers);

  // トレーナー別改善提案AI
  const improvementSuggestion = getTrainerImprovementSuggestion(
    allMembers,
    decodedTrainerName
  );
  const trainerEvaluation = evaluateTrainerPerformance(allMembers, decodedTrainerName);
  const successPatternAnalysis = analyzeSuccessfulSessions(trainerMembers);

  // 介入タスク一覧（pending + in progress）
  const interventionTasks = trainerTasks
    .filter((task) => task.status === "pending" || task.status === "in progress")
    .map((task) => {
      const member = trainerMembers.find((m) => m.id === task.memberId);
      return {
        task,
        member,
      };
    })
    .sort((a, b) => {
      // 優先度順、その後期限順
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = a.task.priority || "low";
      const bPriority = b.task.priority || "low";
      if (priorityOrder[bPriority] !== priorityOrder[aPriority]) {
        return priorityOrder[bPriority] - priorityOrder[aPriority];
      }
      return new Date(a.task.dueDate).getTime() - new Date(b.task.dueDate).getTime();
    });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 hover:underline text-sm mb-2 inline-block"
          >
            ← ダッシュボードに戻る
          </Link>
          <h1 className="text-4xl font-bold mb-2">{decodedTrainerName}</h1>
          <p className="text-zinc-400 text-sm">
            担当会員の状況と優先対応を確認して、継続率改善に取り組みましょう
          </p>
        </div>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-400 text-sm mb-1">担当会員数</div>
          <div className="text-3xl font-bold text-white">{totalMembers}</div>
          <div className="text-zinc-500 text-xs mt-1">人</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-400 text-sm mb-1">高リスク会員数</div>
          <div className="text-3xl font-bold text-red-400">
            {highRiskMembers}
          </div>
          <div className="text-zinc-500 text-xs mt-1">人</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-400 text-sm mb-1">継続率</div>
          <div className="text-3xl font-bold text-green-400">
            {retentionRate.toFixed(1)}%
          </div>
          <div className="text-zinc-500 text-xs mt-1">
            {safeMembers}/{totalMembers}人
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-400 text-sm mb-1">月間売上</div>
          <div className="text-3xl font-bold text-white">
            ¥{monthlyRevenue.toLocaleString()}
          </div>
          <div className="text-zinc-500 text-xs mt-1">/月</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-400 text-sm mb-1">年間リスク売上</div>
          <div className="text-3xl font-bold text-red-400">
            ¥{annualRevenueAtRisk.toLocaleString()}
          </div>
          <div className="text-zinc-500 text-xs mt-1">/年</div>
        </div>
      </div>

      {/* このトレーナーの改善提案 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-1">このトレーナーの改善提案</h2>
          <p className="text-zinc-500 text-xs">
            担当会員の状況をもとに、改善の優先行動を自動提案しています
          </p>
        </div>

        <div
          className={`bg-zinc-950 border rounded-lg p-6 ${
            improvementSuggestion.priorityLabel === "high"
              ? "border-red-500/40"
              : improvementSuggestion.priorityLabel === "medium"
              ? "border-yellow-500/40"
              : "border-zinc-800"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    improvementSuggestion.priorityLabel === "high"
                      ? "text-red-400 bg-red-400/10 border border-red-400/20"
                      : improvementSuggestion.priorityLabel === "medium"
                      ? "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20"
                      : "text-zinc-400 bg-zinc-400/10 border border-zinc-400/20"
                  }`}
                >
                  {improvementSuggestion.priorityLabel === "high"
                    ? "高優先度"
                    : improvementSuggestion.priorityLabel === "medium"
                    ? "中優先度"
                    : "低優先度"}
                </span>
                <span className="text-zinc-400 text-xs">
                  最優先課題: {improvementSuggestion.topIssue}
                </span>
              </div>
              <div className="text-lg font-semibold text-white mb-2">
                {improvementSuggestion.suggestionTitle}
              </div>
              <div className="text-zinc-300 text-sm leading-relaxed">
                {improvementSuggestion.suggestionBody}
              </div>
            </div>
            <div className="text-right">
              <div className="text-zinc-500 text-xs mb-1">期待効果</div>
              <div className="text-green-400 text-sm font-semibold">
                {improvementSuggestion.expectedImpact}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-zinc-400 text-xs font-semibold mb-3">
              今やること
            </div>
            <ul className="space-y-2">
              {improvementSuggestion.actionItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span
                    className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                      improvementSuggestion.priorityLabel === "high"
                        ? "bg-red-400/20 text-red-400"
                        : improvementSuggestion.priorityLabel === "medium"
                        ? "bg-yellow-400/20 text-yellow-400"
                        : "bg-zinc-400/20 text-zinc-400"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-zinc-200 flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* トレーナー評価AI */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-1">トレーナー評価AI</h2>
          <p className="text-zinc-500 text-xs">
            人を責めるためではなく、育成・改善支援のための指標として表示しています
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <div className="text-zinc-400 text-xs mb-1">総合スコア</div>
            <div className="text-3xl font-bold text-white">{trainerEvaluation.summaryScore}</div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <div className="text-zinc-400 text-xs mb-1">評価</div>
            <div
              className={`text-lg font-semibold ${
                trainerEvaluation.level === "excellent"
                  ? "text-green-400"
                  : trainerEvaluation.level === "good"
                  ? "text-blue-300"
                  : trainerEvaluation.level === "watch"
                  ? "text-yellow-300"
                  : "text-red-300"
              }`}
            >
              {getTrainerEvaluationLevelLabel(trainerEvaluation.level)}
            </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <div className="text-zinc-400 text-xs mb-1">30日 high 予測会員</div>
            <div className="text-2xl font-bold text-zinc-200">
              {trainerEvaluation.metrics.highChurn30DaysMembers}人
            </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <div className="text-zinc-400 text-xs mb-1">記録品質</div>
            <div className="text-2xl font-bold text-zinc-200">
              {trainerEvaluation.metrics.sessionRecordQuality}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-zinc-950 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-300 mb-2">強み</h3>
            {trainerEvaluation.strengths.length === 0 ? (
              <p className="text-zinc-500 text-xs">現時点では抽出中です</p>
            ) : (
              <ul className="space-y-2">
                {trainerEvaluation.strengths.map((item, idx) => (
                  <li key={idx} className="text-xs text-zinc-300">
                    <span className="text-green-300">・{item.title}</span>
                    <p className="text-zinc-500 mt-1">{item.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-zinc-950 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-300 mb-2">改善ポイント</h3>
            {trainerEvaluation.improvementPoints.length === 0 ? (
              <p className="text-zinc-500 text-xs">大きな改善ポイントはありません</p>
            ) : (
              <ul className="space-y-2">
                {trainerEvaluation.improvementPoints.map((item, idx) => (
                  <li key={idx} className="text-xs text-zinc-300">
                    <span className="text-yellow-300">・{item.title}</span>
                    <p className="text-zinc-500 mt-1">{item.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-zinc-200 mb-2">今やること</h3>
            <ul className="space-y-2">
              {trainerEvaluation.actionItems.map((item, idx) => (
                <li key={idx} className="text-xs text-zinc-300">
                  ・{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-1">成功パターン分析</h2>
          <p className="text-zinc-500 text-xs">
            担当会員の中で再現性の高い成功要因を抽出し、日々の指導に活かせる形で提示します
          </p>
        </div>
        <SuccessSessionAnalysisBridge
          serverAnalysis={successPatternAnalysis}
          baseMembersFromServer={allMembers}
          trainerName={decodedTrainerName}
          embedInCard
          patternsHeading="このトレーナーで多い成功要因"
          traitsHeading="真似すべき行動"
          actionsHeading="維持すべき強み"
        />
      </div>

      {/* 担当会員一覧 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-1">担当会員一覧</h2>
          <p className="text-zinc-500 text-xs">
            リスクスコア順に表示しています。各会員をクリックして詳細を確認できます
          </p>
        </div>
        {membersList.length === 0 ? (
          <p className="text-zinc-400 text-sm">担当会員はありません</p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {membersList.map((item) => (
              <Link
                key={item.member.id}
                href={`/members/${item.member.id}`}
                className="block bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-white">
                      {item.member.name}
                    </div>
                    <div className="text-zinc-400 text-xs mt-1">
                      {item.member.plan} | {item.member.storeName}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div
                      className={`text-lg font-bold ${getRiskScoreColor(
                        item.riskScore
                      )}`}
                    >
                      {item.riskScore}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getRiskLevelBadgeColor(
                        item.riskLevel
                      )}`}
                    >
                      {item.riskLevel === "high"
                        ? "高リスク"
                        : item.riskLevel === "medium"
                        ? "中リスク"
                        : "低リスク"}
                    </span>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="text-zinc-500 text-xs">
                    月額売上: ¥{item.monthlyRevenue.toLocaleString()}
                  </div>
                  {item.riskReasons.length > 0 && (
                    <div className="text-zinc-400 text-xs">
                      <span className="font-semibold">リスク要因:</span>{" "}
                      {item.riskReasons.join(", ")}
                    </div>
                  )}
                  <div className="text-zinc-400 text-xs">
                    <span className="font-semibold">推奨介入:</span>{" "}
                    {item.intervention.title}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 退会予測ランキング */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">
              退会予測ランキング（上位5名）
            </h2>
            <p className="text-zinc-500 text-xs">
              30日以内の退会確率が高い会員を優先的にサポートしましょう
            </p>
          </div>
          {churnPredictions.length === 0 ? (
            <p className="text-zinc-400 text-sm">
              退会予測データがありません
            </p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {churnPredictions.map((item, index) => (
                <Link
                  key={item.member.id}
                  href={`/members/${item.member.id}`}
                  className="block bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-zinc-500 text-xs font-semibold">
                          #{index + 1}
                        </span>
                        <div className="font-semibold text-white">
                          {item.member.name}
                        </div>
                      </div>
                      <div className="text-zinc-400 text-xs mt-1">
                        {item.member.plan} | {item.member.storeName}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-bold text-red-400">
                        {item.prediction.probability30Days}%
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        30日退会確率
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-2 text-xs">
                      <span className="text-zinc-500">
                        60日退会確率: {item.prediction.probability60Days}%
                      </span>
                      <span
                        className={`px-2 py-1 rounded ${getRiskLevelBadgeColor(
                          item.riskLevel
                        )}`}
                      >
                        {item.riskLevel === "high"
                          ? "高リスク"
                          : item.riskLevel === "medium"
                          ? "中リスク"
                          : "低リスク"}
                      </span>
                    </div>
                    {item.prediction.reasons.length > 0 && (
                      <div className="text-zinc-400 text-xs">
                        <span className="font-semibold">予測理由:</span>{" "}
                        {item.prediction.reasons.slice(0, 2).join(", ")}
                      </div>
                    )}
                    <div className="text-zinc-400 text-xs">
                      <span className="font-semibold">推奨介入:</span>{" "}
                      {item.intervention.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 今日の優先対応 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">今日の優先対応</h2>
            <p className="text-zinc-500 text-xs">
              システムが推奨する優先度の高い会員です。早期の介入で継続率向上が期待できます
            </p>
          </div>
          {priorityQueue.length === 0 ? (
            <p className="text-zinc-400 text-sm">
              優先対応が必要な会員はありません
            </p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {priorityQueue.map((item, index) => {
                const isHighRisk = item.riskScore >= 80;
                return (
                  <Link
                    key={item.id}
                    href={`/members/${item.id}`}
                    className={`block border rounded-lg p-4 hover:bg-zinc-800/50 transition-colors ${
                      isHighRisk
                        ? "bg-red-950/30 border-red-800/50"
                        : "bg-zinc-950 border-zinc-800"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-zinc-500 text-xs font-semibold">
                            #{index + 1}
                          </span>
                          <div className="font-semibold text-white">
                            {item.name}
                          </div>
                        </div>
                        <div className="text-zinc-400 text-xs mt-1">
                          {item.member.plan} | {item.member.storeName}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div
                          className={`text-lg font-bold ${getRiskScoreColor(
                            item.riskScore
                          )}`}
                        >
                          {item.riskScore}
                        </div>
                        <div className="flex gap-1 mt-1">
                          <span
                            className={`text-xs px-2 py-1 rounded ${getPriorityBadgeColor(
                              item.priority
                            )}`}
                          >
                            {item.priority === "high"
                              ? "高"
                              : item.priority === "medium"
                              ? "中"
                              : "低"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="text-zinc-500 text-xs">
                        30日退会確率: {item.probability30Days}%
                      </div>
                      <div className="text-zinc-400 text-xs">
                        <span className="font-semibold">推奨アクション:</span>{" "}
                        {item.suggestedAction}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 介入タスク一覧 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-1">介入タスク一覧</h2>
          <p className="text-zinc-500 text-xs">
            未対応・対応中のタスクを優先度順に表示しています
          </p>
        </div>
        {interventionTasks.length === 0 ? (
          <p className="text-zinc-400 text-sm">介入タスクはありません</p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {interventionTasks.map((item) => (
              <div
                key={item.task.id}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-white">
                      {item.member?.name || item.task.memberName}
                    </div>
                    <div className="text-zinc-400 text-xs mt-1">
                      {item.task.action}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {item.task.priority && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${getPriorityBadgeColor(
                          item.task.priority
                        )}`}
                      >
                        {item.task.priority === "high"
                          ? "高"
                          : item.task.priority === "medium"
                          ? "中"
                          : "低"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="text-zinc-500">
                    期限: {new Date(item.task.dueDate).toLocaleDateString("ja-JP")}
                  </div>
                  <div
                    className={`inline-block px-2 py-1 rounded ${
                      item.task.status === "done"
                        ? "text-green-400 bg-green-400/10 border border-green-400/20"
                        : item.task.status === "in progress"
                        ? "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20"
                        : "text-zinc-400 bg-zinc-400/10 border border-zinc-400/20"
                    }`}
                  >
                    {item.task.status === "done"
                      ? "完了"
                      : item.task.status === "in progress"
                      ? "対応中"
                      : "未対応"}
                  </div>
                  {item.task.isAutoGenerated && (
                    <span className="ml-2 text-xs text-blue-400">
                      (自動生成)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

