import Link from "next/link";
import { DashboardBackLink } from "@/components/navigation/DashboardBackLink";
import { ContextualMemberLink } from "@/components/navigation/ContextualMemberLink";
import { memberRepository } from "@/lib/repositories";
import { getPriceRevisionImpact } from "@/lib/priceRevisionImpact";
import { calculateRiskScore } from "@/lib/riskScore";
import { getRevenueAtRisk } from "@/lib/revenueRisk";
import { getChurnPrediction } from "@/lib/churnPrediction";
import { getPriorityQueue } from "@/lib/priorityQueue";
import { getInterventionSuggestion } from "@/lib/interventionSuggestion";
import {
  getPriceRevision30DaysSummary,
  getPriceRevisionChurnRanking,
  getPriceRevisionPriorityQueue,
} from "@/lib/priceRevision30Days";
import { PriceRevisionChart } from "@/components/PriceRevisionChart";

export default async function PriceRevisionPage() {
  // データ取得
  const allMembers = await memberRepository.getAll();
  const priceRevisionImpact = getPriceRevisionImpact(allMembers);
  const priceRevision30Days = getPriceRevision30DaysSummary(allMembers);
  const priceRevisionChurnRanking = getPriceRevisionChurnRanking(allMembers);
  const priceRevisionPriorityQueue = getPriceRevisionPriorityQueue(allMembers);

  // 改定前後の比較データを計算
  const beforeRiskResults = priceRevisionImpact.targetMembers.map((member) => ({
    member,
    riskResult: calculateRiskScore(member),
  }));

  const beforeData = {
    totalMembers: priceRevisionImpact.targetMembers.length,
    highRiskMembers: beforeRiskResults.filter(
      (item) => item.riskResult.level === "high"
    ).length,
    lowRiskMembers: beforeRiskResults.filter(
      (item) => item.riskResult.level === "low"
    ).length,
    mediumRiskMembers: beforeRiskResults.filter(
      (item) => item.riskResult.level === "medium"
    ).length,
    retentionRate:
      priceRevisionImpact.targetMembers.length > 0
        ? ((beforeRiskResults.filter(
            (item) =>
              item.riskResult.level === "low" ||
              item.riskResult.level === "medium"
          ).length /
            priceRevisionImpact.targetMembers.length) *
            100)
        : 0,
    monthlyRevenue: priceRevisionImpact.targetMembers.reduce((sum, member) => {
      const revenue =
        member.priceRevisionBeforeRevenue ?? member.monthlyRevenue ?? 0;
      return sum + revenue;
    }, 0),
    monthlyRevenueAtRisk: beforeRiskResults.reduce((sum, item) => {
      if (item.riskResult.level === "high") {
        const revenue =
          item.member.priceRevisionBeforeRevenue ??
          item.member.monthlyRevenue ??
          0;
        return sum + revenue;
      }
      return sum;
    }, 0),
  };

  // 改定後のリスクスコアを計算（価格改定によるリスク上昇を考慮）
  const afterRiskResults = priceRevisionImpact.targetMembers.map((member) => {
    const riskResult = calculateRiskScore(member);
    // 価格改定によるリスク上昇を考慮（簡易的に+10ポイント）
    const adjustedRiskScore = Math.min(100, riskResult.score + 10);
    const adjustedLevel: "low" | "medium" | "high" =
      adjustedRiskScore >= 70
        ? "high"
        : adjustedRiskScore >= 50
        ? "medium"
        : "low";
    return {
      member,
      riskResult: {
        ...riskResult,
        score: adjustedRiskScore,
        level: adjustedLevel,
      },
    };
  });

  const afterData = {
    totalMembers: priceRevisionImpact.targetMembers.length,
    highRiskMembers: priceRevisionImpact.highRiskTargetMembers.length,
    lowRiskMembers: afterRiskResults.filter(
      (item) => item.riskResult.level === "low"
    ).length,
    mediumRiskMembers: afterRiskResults.filter(
      (item) => item.riskResult.level === "medium"
    ).length,
    retentionRate:
      priceRevisionImpact.targetMembers.length > 0
        ? ((afterRiskResults.filter(
            (item) =>
              item.riskResult.level === "low" ||
              item.riskResult.level === "medium"
          ).length /
            priceRevisionImpact.targetMembers.length) *
            100)
        : 0,
    monthlyRevenue: priceRevisionImpact.targetMembers.reduce((sum, member) => {
      const revenue =
        member.priceRevisionAfterRevenue ?? member.monthlyRevenue ?? 0;
      return sum + revenue;
    }, 0),
    monthlyRevenueAtRisk:
      priceRevisionImpact.monthlyRevenueAtRiskAfterRevision,
  };

  // 退会予測ランキング（改定対象会員のみ、30日退会確率順）
  const churnPredictions = priceRevisionImpact.targetMembers
    .map((member) => {
      const prediction = getChurnPrediction(member);
      const riskResult = calculateRiskScore(member);
      // 価格改定によるリスク上昇を考慮
      const adjustedRiskScore = Math.min(100, riskResult.score + 10);
      const adjustedPrediction = {
        ...prediction,
        probability30Days: Math.min(
          100,
          prediction.probability30Days + 10
        ),
        probability60Days: Math.min(
          100,
          prediction.probability60Days + 10
        ),
      };
      const intervention = getInterventionSuggestion(member);
      return {
        member,
        prediction: adjustedPrediction,
        riskScore: adjustedRiskScore,
        riskLevel:
          adjustedRiskScore >= 70
            ? "high"
            : adjustedRiskScore >= 50
            ? "medium"
            : "low",
        intervention,
      };
    })
    .sort(
      (a, b) =>
        b.prediction.probability30Days - a.prediction.probability30Days
    )
    .slice(0, 5);

  // 介入優先キュー（改定対象会員のみ）
  const priorityQueue = getPriorityQueue(priceRevisionImpact.targetMembers);

  // グラフ用データ
  const chartData = [
    {
      name: "会員数",
      before: beforeData.totalMembers,
      after: afterData.totalMembers,
    },
    {
      name: "高リスク会員数",
      before: beforeData.highRiskMembers,
      after: afterData.highRiskMembers,
    },
    {
      name: "月間売上",
      before: beforeData.monthlyRevenue,
      after: afterData.monthlyRevenue,
    },
    {
      name: "月間リスク売上",
      before: beforeData.monthlyRevenueAtRisk,
      after: afterData.monthlyRevenueAtRisk,
    },
  ];

  const revenueChartData = [
    {
      name: "改定前",
      value: beforeData.monthlyRevenue,
      color: "#3b82f6", // blue
    },
    {
      name: "改定後",
      value: afterData.monthlyRevenue,
      color: "#10b981", // green
    },
  ];

  const riskRevenueChartData = [
    {
      name: "改定前",
      value: beforeData.monthlyRevenueAtRisk,
      color: "#ef4444", // red
    },
    {
      name: "改定後",
      value: afterData.monthlyRevenueAtRisk,
      color: "#f59e0b", // orange
    },
  ];

  // 高リスク人数比較グラフ
  const highRiskChartData = [
    {
      name: "改定前",
      value: beforeData.highRiskMembers,
      color: "#ef4444", // red
    },
    {
      name: "改定後",
      value: afterData.highRiskMembers,
      color: "#f59e0b", // orange
    },
  ];

  // 継続率比較グラフ
  const retentionChartData = [
    {
      name: "改定前",
      value: beforeData.retentionRate,
      color: "#10b981", // green
    },
    {
      name: "改定後",
      value: afterData.retentionRate,
      color: "#3b82f6", // blue
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <DashboardBackLink className="text-blue-700 hover:text-blue-800 hover:underline text-sm mb-2 inline-block">
            ← ダッシュボードに戻る
          </DashboardBackLink>
          <h1 className="text-4xl font-bold mb-2">価格改定影響分析</h1>
          <p className="text-slate-600 text-sm">
            価格改定後の離脱リスクを管理し、守るべき売上を可視化します
          </p>
        </div>
      </div>

      {/* KPIカード - 経営陣向けに大きめの数字 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-8">
          <div className="text-slate-600 text-sm mb-2">改定対象会員数</div>
          <div className="text-3xl font-semibold text-slate-900">
            {priceRevisionImpact.targetMembers.length}
          </div>
          <div className="text-slate-500 text-sm mt-2">人</div>
        </div>

        <div className="bg-white border border-red-500/40 rounded-lg p-8">
          <div className="text-slate-600 text-sm mb-2">改定後高リスク会員数</div>
          <div className="text-3xl font-semibold text-red-600">
            {priceRevisionImpact.highRiskTargetMembers.length}
          </div>
          <div className="text-slate-500 text-sm mt-2">人</div>
        </div>

        <div className="bg-white border border-green-500/40 rounded-lg p-8">
          <div className="text-slate-600 text-sm mb-2">月間増収見込み</div>
          <div className="text-3xl font-semibold text-green-700">
            ¥{priceRevisionImpact.monthlyRevenueIncrease.toLocaleString()}
          </div>
          <div className="text-slate-500 text-sm mt-2">/月</div>
        </div>

        <div className="bg-white border border-red-500/40 rounded-lg p-8">
          <div className="text-slate-600 text-sm mb-2">月間リスク売上</div>
          <div className="text-3xl font-semibold text-red-600">
            ¥{priceRevisionImpact.monthlyRevenueAtRiskAfterRevision.toLocaleString()}
          </div>
          <div className="text-slate-500 text-sm mt-2">/月</div>
        </div>

        <div className="bg-white border border-green-500/40 rounded-lg p-8">
          <div className="text-slate-600 text-sm mb-2">守れる売上見込み</div>
          <div className="text-3xl font-semibold text-green-700">
            ¥{priceRevisionImpact.estimatedProtectedRevenue.toLocaleString()}
          </div>
          <div className="text-slate-500 text-sm mt-2">/月</div>
        </div>
      </div>

      {/* 改定前後比較グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 高リスク人数比較 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">高リスク人数</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-slate-600 text-sm mb-1">改定前</div>
              <div className="text-2xl font-semibold text-red-600">
                {beforeData.highRiskMembers}
              </div>
              <div className="text-slate-500 text-xs mt-1">人</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-slate-600 text-sm mb-1">改定後</div>
              <div className="text-2xl font-semibold text-orange-700">
                {afterData.highRiskMembers}
              </div>
              <div className="text-slate-500 text-xs mt-1">人</div>
            </div>
          </div>
          <PriceRevisionChart data={highRiskChartData} />
        </div>

        {/* 推定継続率比較 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">推定継続率</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-slate-600 text-sm mb-1">改定前</div>
              <div className="text-2xl font-semibold text-green-700">
                {beforeData.retentionRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-slate-600 text-sm mb-1">改定後</div>
              <div className="text-2xl font-semibold text-blue-700">
                {afterData.retentionRate.toFixed(1)}%
              </div>
            </div>
          </div>
          <PriceRevisionChart data={retentionChartData} isPercentage={true} />
        </div>

        {/* リスク売上比較 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">リスク売上</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-slate-600 text-sm mb-1">改定前</div>
              <div className="text-2xl font-bold text-red-600">
                ¥{beforeData.monthlyRevenueAtRisk.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-slate-600 text-sm mb-1">改定後</div>
              <div className="text-2xl font-bold text-orange-700">
                ¥{afterData.monthlyRevenueAtRisk.toLocaleString()}
              </div>
            </div>
          </div>
          <PriceRevisionChart data={riskRevenueChartData} />
        </div>
      </div>

      {/* 退会予測ランキングと介入優先キュー */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 退会予測ランキング */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            改定対象会員の退会予測ランキング（上位5名）
          </h2>
          {churnPredictions.length === 0 ? (
            <p className="text-slate-600 text-sm">
              退会予測データがありません
            </p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {churnPredictions.map((item, index) => (
                <ContextualMemberLink
                  key={item.member.id}
                  memberId={item.member.id}
                  className="block bg-slate-50 border border-slate-200 rounded-lg p-4 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-500 text-xs font-semibold">
                          #{index + 1}
                        </span>
                        <div className="font-semibold text-slate-900">
                          {item.member.name}
                        </div>
                      </div>
                      <div className="text-slate-600 text-xs mt-1">
                        {item.member.plan} | {item.member.storeName}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-bold text-red-600">
                        {item.prediction.probability30Days}%
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        30日退会確率
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-2 text-xs">
                      <span className="text-slate-500">
                        60日退会確率: {item.prediction.probability60Days}%
                      </span>
                      <span
                        className={`px-2 py-1 rounded ${
                          item.riskLevel === "high"
                            ? "text-red-600 bg-red-400/10 border border-red-400/20"
                            : item.riskLevel === "medium"
                            ? "text-yellow-700 bg-yellow-400/10 border border-yellow-400/20"
                            : "text-green-700 bg-green-400/10 border border-green-400/20"
                        }`}
                      >
                        {item.riskLevel === "high"
                          ? "高リスク"
                          : item.riskLevel === "medium"
                          ? "中リスク"
                          : "低リスク"}
                      </span>
                    </div>
                    {item.prediction.reasons.length > 0 && (
                      <div className="text-slate-600 text-xs">
                        <span className="font-semibold">予測理由:</span>{" "}
                        {item.prediction.reasons.slice(0, 2).join(", ")}
                      </div>
                    )}
                    <div className="text-slate-600 text-xs">
                      <span className="font-semibold">推奨介入:</span>{" "}
                      {item.intervention.title}
                    </div>
                  </div>
                </ContextualMemberLink>
              ))}
            </div>
          )}
        </div>

        {/* 介入優先キュー */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            改定対象会員の介入優先キュー
          </h2>
          {priorityQueue.length === 0 ? (
            <p className="text-slate-600 text-sm">
              優先対応が必要な会員はありません
            </p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {priorityQueue.map((item, index) => {
                const isHighRisk = item.riskScore >= 80;
                return (
                  <ContextualMemberLink
                    key={item.id}
                    memberId={item.id}
                    className={`block border rounded-lg p-4 hover:bg-slate-100/80 transition-colors ${
                      isHighRisk
                        ? "bg-red-950/30 border-red-800/50"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-500 text-xs font-semibold">
                            #{index + 1}
                          </span>
                          <div className="font-semibold text-slate-900">
                            {item.name}
                          </div>
                        </div>
                        <div className="text-slate-600 text-xs mt-1">
                          {item.member.plan} | {item.member.storeName}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div
                          className={`text-lg font-bold ${
                            item.riskScore >= 80
                              ? "text-red-600"
                              : item.riskScore >= 50
                              ? "text-yellow-700"
                              : "text-green-700"
                          }`}
                        >
                          {item.riskScore}
                        </div>
                        <div className="flex gap-1 mt-1">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              item.priority === "high"
                                ? "text-red-600 bg-red-400/10 border border-red-400/20"
                                : item.priority === "medium"
                                ? "text-orange-700 bg-orange-400/10 border border-orange-400/20"
                                : "text-slate-600 bg-slate-100 border border-slate-200"
                            }`}
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
                      <div className="text-slate-500 text-xs">
                        30日退会確率: {item.probability30Days}%
                      </div>
                      <div className="text-slate-600 text-xs">
                        <span className="font-semibold">推奨アクション:</span>{" "}
                        {item.suggestedAction}
                      </div>
                    </div>
                  </ContextualMemberLink>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 詳細比較テーブル */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">改定前後の比較</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  指標
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  改定前
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  改定後
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  差分
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="hover:bg-slate-100/60 transition-colors">
                <td className="px-4 py-3 text-slate-800">会員数</td>
                <td className="px-4 py-3 text-slate-900">
                  {beforeData.totalMembers}人
                </td>
                <td className="px-4 py-3 text-slate-900">
                  {afterData.totalMembers}人
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {afterData.totalMembers - beforeData.totalMembers > 0
                    ? "+"
                    : ""}
                  {afterData.totalMembers - beforeData.totalMembers}人
                </td>
              </tr>
              <tr className="hover:bg-slate-100/60 transition-colors">
                <td className="px-4 py-3 text-slate-800">高リスク会員数</td>
                <td className="px-4 py-3 text-red-600">
                  {beforeData.highRiskMembers}人
                </td>
                <td className="px-4 py-3 text-red-600">
                  {afterData.highRiskMembers}人
                </td>
                <td
                  className={`px-4 py-3 ${
                    afterData.highRiskMembers - beforeData.highRiskMembers > 0
                      ? "text-red-600"
                      : "text-green-700"
                  }`}
                >
                  {afterData.highRiskMembers - beforeData.highRiskMembers > 0
                    ? "+"
                    : ""}
                  {afterData.highRiskMembers - beforeData.highRiskMembers}人
                </td>
              </tr>
              <tr className="hover:bg-slate-100/60 transition-colors">
                <td className="px-4 py-3 text-slate-800">推定継続率</td>
                <td className="px-4 py-3 text-green-700">
                  {beforeData.retentionRate.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-blue-700">
                  {afterData.retentionRate.toFixed(1)}%
                </td>
                <td
                  className={`px-4 py-3 ${
                    afterData.retentionRate - beforeData.retentionRate < 0
                      ? "text-red-600"
                      : "text-green-700"
                  }`}
                >
                  {afterData.retentionRate - beforeData.retentionRate > 0
                    ? "+"
                    : ""}
                  {(afterData.retentionRate - beforeData.retentionRate).toFixed(1)}%
                </td>
              </tr>
              <tr className="hover:bg-slate-100/60 transition-colors">
                <td className="px-4 py-3 text-slate-800">月間売上</td>
                <td className="px-4 py-3 text-slate-900">
                  ¥{beforeData.monthlyRevenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-900">
                  ¥{afterData.monthlyRevenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-green-700">
                  +
                  ¥{(
                    afterData.monthlyRevenue - beforeData.monthlyRevenue
                  ).toLocaleString()}
                </td>
              </tr>
              <tr className="hover:bg-slate-100/60 transition-colors">
                <td className="px-4 py-3 text-slate-800">月間リスク売上</td>
                <td className="px-4 py-3 text-red-600">
                  ¥{beforeData.monthlyRevenueAtRisk.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-orange-700">
                  ¥{afterData.monthlyRevenueAtRisk.toLocaleString()}
                </td>
                <td
                  className={`px-4 py-3 ${
                    afterData.monthlyRevenueAtRisk -
                      beforeData.monthlyRevenueAtRisk >
                    0
                      ? "text-red-600"
                      : "text-green-700"
                  }`}
                >
                  {afterData.monthlyRevenueAtRisk -
                    beforeData.monthlyRevenueAtRisk >
                  0
                    ? "+"
                    : ""}
                  ¥{(
                    afterData.monthlyRevenueAtRisk -
                    beforeData.monthlyRevenueAtRisk
                  ).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 価格改定後30日モニター */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 mt-8">
        <h2 className="text-3xl font-bold mb-4">価格改定後30日モニター</h2>
        <p className="text-slate-600 text-sm mb-6">
          価格改定後30日間のリスク変化と、優先的に守るべき会員を表示しています
        </p>

        {/* KPIカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <div className="text-slate-600 text-sm mb-2">改定対象会員数</div>
            <div className="text-2xl font-semibold text-slate-900">
              {priceRevision30Days.targetMembers}
            </div>
            <div className="text-slate-500 text-xs mt-1">人</div>
          </div>

          <div className="bg-slate-50 border border-red-500/40 rounded-lg p-6">
            <div className="text-slate-600 text-sm mb-2">改定後高リスク会員数</div>
            <div className="text-2xl font-semibold text-red-600">
              {priceRevision30Days.highRiskMembersAfterRevision}
            </div>
            <div className="text-slate-500 text-xs mt-1">人</div>
          </div>

          <div className="bg-slate-50 border border-orange-500/40 rounded-lg p-6">
            <div className="text-slate-600 text-sm mb-2">リスク上昇会員数</div>
            <div className="text-2xl font-semibold text-orange-700">
              {priceRevision30Days.increasedRiskMembers}
            </div>
            <div className="text-slate-500 text-xs mt-1">人</div>
          </div>

          <div className="bg-slate-50 border border-yellow-500/40 rounded-lg p-6">
            <div className="text-slate-600 text-sm mb-2">来店減少会員数</div>
            <div className="text-2xl font-semibold text-yellow-700">
              {priceRevision30Days.visitDropMembers}
            </div>
            <div className="text-slate-500 text-xs mt-1">人</div>
          </div>

          <div className="bg-slate-50 border border-red-500/40 rounded-lg p-6">
            <div className="text-slate-600 text-sm mb-2">30日損失予測</div>
            <div className="text-2xl font-semibold text-red-600">
              ¥{Math.round(priceRevision30Days.expectedLoss30Days).toLocaleString()}
            </div>
            <div className="text-slate-500 text-xs mt-1">期待損失額</div>
          </div>

          <div className="bg-slate-50 border border-green-500/40 rounded-lg p-6">
            <div className="text-slate-600 text-sm mb-2">守れた売上見込み</div>
            <div className="text-2xl font-semibold text-green-700">
              ¥{Math.round(priceRevision30Days.protectedRevenueEstimate).toLocaleString()}
            </div>
            <div className="text-slate-500 text-xs mt-1">/月</div>
          </div>
        </div>

        {/* 退会予測ランキングと介入優先キュー */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 改定対象会員の退会予測ランキング */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">
              改定対象会員の退会予測ランキング（上位5名）
            </h3>
            {priceRevisionChurnRanking.length === 0 ? (
              <p className="text-slate-600 text-sm">退会予測データがありません</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {priceRevisionChurnRanking.map((item, index) => (
                  <ContextualMemberLink
                    key={item.member.id}
                    memberId={item.member.id}
                    className="block bg-white border border-slate-200 shadow-sm rounded-lg p-4 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-500 text-xs font-semibold">
                            #{index + 1}
                          </span>
                          <div className="font-semibold text-slate-900">
                            {item.member.name}
                          </div>
                        </div>
                        <div className="text-slate-600 text-xs mt-1">
                          {item.member.plan} | {item.member.storeName}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-bold text-red-600">
                          {item.prediction.probability30Days}%
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          30日退会確率
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-2 text-xs">
                        <span className="text-slate-500">
                          60日退会確率: {item.prediction.probability60Days}%
                        </span>
                        <span
                          className={`px-2 py-1 rounded ${
                            item.riskLevel === "high"
                              ? "text-red-600 bg-red-400/10 border border-red-400/20"
                              : item.riskLevel === "medium"
                              ? "text-yellow-700 bg-yellow-400/10 border border-yellow-400/20"
                              : "text-green-700 bg-green-400/10 border border-green-400/20"
                          }`}
                        >
                          {item.riskLevel === "high"
                            ? "高リスク"
                            : item.riskLevel === "medium"
                            ? "中リスク"
                            : "低リスク"}
                        </span>
                      </div>
                      {item.prediction.reasons.length > 0 && (
                        <div className="text-slate-600 text-xs">
                          <span className="font-semibold">リスク理由:</span>{" "}
                          {item.prediction.reasons.slice(0, 2).join(", ")}
                        </div>
                      )}
                      <div className="text-slate-600 text-xs">
                        <span className="font-semibold">推奨介入:</span>{" "}
                        {item.intervention.title}
                      </div>
                    </div>
                  </ContextualMemberLink>
                ))}
              </div>
            )}
          </div>

          {/* 改定対象会員の介入優先キュー */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">
              改定対象会員の介入優先キュー（上位5名）
            </h3>
            {priceRevisionPriorityQueue.length === 0 ? (
              <p className="text-slate-600 text-sm">
                優先対応が必要な会員はありません
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {priceRevisionPriorityQueue.map((item, index) => {
                  const isHighRisk = item.riskScore >= 80;
                  return (
                    <ContextualMemberLink
                      key={item.id}
                      memberId={item.id}
                      className={`block border rounded-lg p-4 hover:bg-slate-100/80 transition-colors ${
                        isHighRisk
                          ? "bg-red-950/30 border-red-800/50"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-500 text-xs font-semibold">
                              #{index + 1}
                            </span>
                            <div className="font-semibold text-slate-900">
                              {item.name}
                            </div>
                          </div>
                          <div className="text-slate-600 text-xs mt-1">
                            {item.member.plan} | {item.member.storeName}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div
                            className={`text-lg font-bold ${
                              item.riskScore >= 80
                                ? "text-red-600"
                                : item.riskScore >= 50
                                ? "text-yellow-700"
                                : "text-green-700"
                            }`}
                          >
                            {item.riskScore}
                          </div>
                          <div className="flex gap-1 mt-1">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                item.priority === "high"
                                  ? "text-red-600 bg-red-400/10 border border-red-400/20"
                                  : item.priority === "medium"
                                  ? "text-orange-700 bg-orange-400/10 border border-orange-400/20"
                                  : "text-slate-600 bg-slate-100 border border-slate-200"
                              }`}
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
                        <div className="text-slate-500 text-xs">
                          30日退会確率: {item.probability30Days}%
                        </div>
                        <div className="text-slate-600 text-xs">
                          <span className="font-semibold">推奨アクション:</span>{" "}
                          {item.suggestedAction}
                        </div>
                      </div>
                    </ContextualMemberLink>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

