import Link from "next/link";
import { memberRepository } from "@/lib/repositories";
import { calculateRiskScore } from "@/lib/riskScore";
import { getInterventionSuggestion } from "@/lib/interventionSuggestion";
import { getChurnPrediction } from "@/lib/churnPrediction";
import { getPriorityQueue } from "@/lib/priorityQueue";
import { getRevenueRiskForecast } from "@/lib/revenueForecast";
import { getPriceRevisionImpact } from "@/lib/priceRevisionImpact";
import { getStoreSummaries } from "@/lib/storeSummary";
import { getRevenueAtRisk } from "@/lib/revenueRisk";

function getRiskScoreColor(score: number): string {
  if (score >= 80) {
    return "text-red-400";
  } else if (score >= 50) {
    return "text-yellow-400";
  } else {
    return "text-green-400";
  }
}

function getPriorityBadgeColor(priority: "low" | "medium" | "high"): string {
  switch (priority) {
    case "high":
      return "text-red-400 bg-red-400/10 border border-red-400/20";
    case "medium":
      return "text-orange-400 bg-orange-400/10 border border-orange-400/20";
    case "low":
      return "text-zinc-400 bg-zinc-400/10 border border-zinc-400/20";
  }
}

export default async function DemoPage() {
  // データ取得
  const allMembers = await memberRepository.getAll();

  // 高リスク会員数
  const highRiskMembers = allMembers.filter((member) => {
    const riskResult = calculateRiskScore(member);
    return riskResult.level === "high";
  }).length;

  // 来月失う可能性のある売上
  const revenueRiskForecasts = allMembers.map((member) => ({
    member,
    forecast: getRevenueRiskForecast(member),
  }));
  const totalExpectedLoss30Days = revenueRiskForecasts.reduce(
    (sum, { forecast }) => sum + forecast.expectedLoss30Days,
    0
  );

  // 退会予測ランキング（上位5名）
  const churnRanking = allMembers
    .map((member) => {
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
    .sort((a, b) => b.prediction.probability30Days - a.prediction.probability30Days)
    .slice(0, 5);

  // 今日の優先対応（上位5名）
  const priorityQueue = getPriorityQueue(allMembers).slice(0, 5);

  // 価格改定影響モニター
  const priceRevisionImpact = getPriceRevisionImpact(allMembers);

  // 店舗別収益リスク 上位3店舗
  const storeSummaries = getStoreSummaries(allMembers)
    .sort((a, b) => b.annualRevenueAtRisk - a.annualRevenueAtRisk)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-8 py-12 max-w-7xl">
        {/* ヘッダー */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4">TwinCoach Demo</h1>
          <p className="text-2xl text-zinc-300 mb-6">
            価格改定後に守るべき会員と売上を可視化します
          </p>
          <p className="text-lg text-zinc-400">
            TwinCoachは継続率改善と収益防衛を同時に支援します
          </p>
        </div>

        {/* 重要KPIカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-zinc-900 border-2 border-red-500/50 rounded-xl p-8">
            <div className="text-zinc-400 text-lg mb-2">高リスク会員数</div>
            <div className="text-6xl font-bold text-red-400 mb-2">
              {highRiskMembers}
            </div>
            <div className="text-zinc-500 text-sm">人</div>
          </div>

          <div className="bg-zinc-900 border-2 border-red-500/50 rounded-xl p-8">
            <div className="text-zinc-400 text-lg mb-2">
              来月失う可能性のある売上
            </div>
            <div className="text-6xl font-bold text-red-400 mb-2">
              ¥{Math.round(totalExpectedLoss30Days).toLocaleString()}
            </div>
            <div className="text-zinc-500 text-sm">30日期待損失額</div>
          </div>
        </div>

        {/* 退会予測ランキング */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">退会予測ランキング</h2>
          <div className="space-y-4">
            {churnRanking.map((item, index) => (
              <Link
                key={item.member.id}
                href={`/members/${item.member.id}`}
                className="block bg-zinc-950 border border-zinc-800 rounded-lg p-6 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <span className="text-2xl font-bold text-zinc-500 w-8">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-xl font-semibold text-white mb-1">
                        {item.member.name}
                      </div>
                      <div className="text-zinc-400 text-sm">{item.member.plan}</div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-3xl font-bold ${getRiskScoreColor(
                          item.riskResult.score
                        )}`}
                      >
                        {item.riskResult.score}
                      </div>
                      <div
                        className={`text-xl font-semibold mt-1 ${
                          item.prediction.label30Days === "high"
                            ? "text-red-400"
                            : item.prediction.label30Days === "medium"
                            ? "text-orange-400"
                            : "text-zinc-400"
                        }`}
                      >
                        {item.prediction.probability30Days}%
                      </div>
                      <div className="text-zinc-500 text-xs mt-1">30日退会確率</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-zinc-400 text-sm">
                  <span className="font-semibold">推奨アクション:</span>{" "}
                  {item.intervention.title}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 今日の優先対応 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">今日の優先対応</h2>
          <div className="space-y-4">
            {priorityQueue.map((item, index) => {
              const isHighRisk =
                item.riskScore >= 70 || item.probability30Days >= 70;
              return (
                <Link
                  key={item.id}
                  href={`/members/${item.id}`}
                  className={`block bg-zinc-950 border rounded-lg p-6 hover:bg-zinc-800/50 transition-colors ${
                    isHighRisk ? "border-red-500/40" : "border-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1">
                      <span
                        className={`text-2xl font-bold ${
                          isHighRisk ? "text-red-400" : "text-zinc-500"
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <div
                          className={`text-xl font-semibold ${
                            isHighRisk ? "text-red-300" : "text-white"
                          }`}
                        >
                          {item.name}
                        </div>
                        <div className="text-zinc-400 text-sm">{item.member.plan}</div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-sm px-3 py-1 rounded ${getPriorityBadgeColor(
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
                  <div className="mt-4 space-y-1">
                    <div className="text-zinc-500 text-sm">
                      30日退会確率: {item.probability30Days}%
                    </div>
                    <div className="text-zinc-400 text-sm">
                      <span className="font-semibold">推奨アクション:</span>{" "}
                      {item.suggestedAction}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 価格改定影響モニター */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">価格改定影響モニター</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <div className="text-zinc-400 text-sm mb-2">改定対象会員数</div>
              <div className="text-4xl font-bold text-white">
                {priceRevisionImpact.targetMembers.length}
              </div>
              <div className="text-zinc-500 text-xs mt-1">人</div>
            </div>

            <div className="bg-zinc-950 border border-red-500/40 rounded-lg p-6">
              <div className="text-zinc-400 text-sm mb-2">改定後高リスク会員数</div>
              <div className="text-4xl font-bold text-red-400">
                {priceRevisionImpact.highRiskTargetMembers.length}
              </div>
              <div className="text-zinc-500 text-xs mt-1">人</div>
            </div>

            <div className="bg-zinc-950 border border-green-500/40 rounded-lg p-6">
              <div className="text-zinc-400 text-sm mb-2">月間売上増加額</div>
              <div className="text-4xl font-bold text-green-400">
                ¥{priceRevisionImpact.monthlyRevenueIncrease.toLocaleString()}
              </div>
              <div className="text-zinc-500 text-xs mt-1">/月</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-950 border border-red-500/40 rounded-lg p-6">
              <div className="text-zinc-400 text-sm mb-2">
                改定後リスク売上
              </div>
              <div className="text-4xl font-bold text-red-400">
                ¥{priceRevisionImpact.monthlyRevenueAtRiskAfterRevision.toLocaleString()}
              </div>
              <div className="text-zinc-500 text-xs mt-1">/月</div>
            </div>

            <div className="bg-zinc-950 border border-green-500/40 rounded-lg p-6">
              <div className="text-zinc-400 text-sm mb-2">防衛可能売上</div>
              <div className="text-4xl font-bold text-green-400">
                ¥{priceRevisionImpact.estimatedProtectedRevenue.toLocaleString()}
              </div>
              <div className="text-zinc-500 text-xs mt-1">/月</div>
            </div>
          </div>
        </div>

        {/* 店舗別収益リスク 上位3店舗 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">店舗別収益リスク 上位3店舗</h2>
          <div className="space-y-4">
            {storeSummaries.map((store, index) => (
              <Link
                key={store.storeName}
                href={`/stores/${encodeURIComponent(store.storeName)}`}
                className="block bg-zinc-950 border border-zinc-800 rounded-lg p-6 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <span className="text-2xl font-bold text-zinc-500 w-8">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-xl font-semibold text-white mb-1">
                        {store.storeName}
                      </div>
                      <div className="text-zinc-400 text-sm">
                        会員数: {store.totalMembers}人 / 高リスク: {store.highRiskMembers}人
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-red-400">
                        ¥{Math.round(store.annualRevenueAtRisk).toLocaleString()}
                      </div>
                      <div className="text-zinc-500 text-xs mt-1">年間リスク売上</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">月間売上</div>
                    <div className="text-lg font-semibold text-white">
                      ¥{Math.round(store.monthlyRevenue).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">継続率</div>
                    <div className="text-lg font-semibold text-green-400">
                      {store.estimatedRetentionRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">月間リスク売上</div>
                    <div className="text-lg font-semibold text-red-400">
                      ¥{Math.round(store.monthlyRevenueAtRisk).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 導線リンク */}
        <div className="text-center mt-12">
          <div className="flex justify-center gap-4">
            <Link
              href="/stores"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
            >
              店舗一覧を見る
            </Link>
            <Link
              href="/price-revision"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
            >
              価格改定影響分析を見る
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
            >
              ダッシュボードを見る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

