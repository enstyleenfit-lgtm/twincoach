import Link from "next/link";
import { memberRepository } from "@/lib/repositories";
import { calculateRiskScore } from "@/lib/riskScore";
import { getInterventionSuggestion } from "@/lib/interventionSuggestion";
import { getChurnPrediction } from "@/lib/churnPrediction";
import { getPriorityQueue } from "@/lib/priorityQueue";
import { getRevenueRiskForecast } from "@/lib/revenueForecast";
import { getPriceRevisionImpact } from "@/lib/priceRevisionImpact";
import { getPriceRevision30DaysSummary } from "@/lib/priceRevision30Days";
import { getStoreSummaries } from "@/lib/storeSummary";
import { getRevenueDefenseSimulation } from "@/lib/revenueDefenseSimulation";

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

export default async function PocSummaryPage() {
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
  const totalExpectedLoss60Days = revenueRiskForecasts.reduce(
    (sum, { forecast }) => sum + forecast.expectedLoss60Days,
    0
  );

  // 収益防衛シミュレーション
  const revenueDefenseSimulation = getRevenueDefenseSimulation(allMembers);

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
  const priceRevision30Days = getPriceRevision30DaysSummary(allMembers);

  // 店舗別収益リスク 上位3店舗
  const storeSummaries = getStoreSummaries(allMembers)
    .sort((a, b) => b.annualRevenueAtRisk - a.annualRevenueAtRisk)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-8 py-12 max-w-7xl">
        {/* ヘッダー */}
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-bold mb-6">PoC結果サマリー</h1>
          <p className="text-2xl text-zinc-300 mb-4">
            TwinCoachにより、守るべき会員・売上・店舗課題が可視化されました
          </p>
          <p className="text-xl text-zinc-400">
            継続率改善と収益防衛の優先順位を明確にします
          </p>
        </div>

        {/* 重要指標カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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

          <div className="bg-zinc-900 border-2 border-red-500/50 rounded-xl p-8">
            <div className="text-zinc-400 text-lg mb-2">60日損失予測</div>
            <div className="text-6xl font-bold text-red-400 mb-2">
              ¥{Math.round(totalExpectedLoss60Days).toLocaleString()}
            </div>
            <div className="text-zinc-500 text-sm">60日期待損失額</div>
          </div>

          <div className="bg-zinc-900 border-2 border-yellow-500/50 rounded-xl p-8">
            <div className="text-zinc-400 text-lg mb-2">守るべき会員数</div>
            <div className="text-6xl font-bold text-yellow-400 mb-2">
              {revenueDefenseSimulation.membersToSaveForGoal}
            </div>
            <div className="text-zinc-500 text-sm">人</div>
          </div>

          <div className="bg-zinc-900 border-2 border-orange-500/50 rounded-xl p-8">
            <div className="text-zinc-400 text-lg mb-2">高リスク上位店舗</div>
            <div className="text-6xl font-bold text-orange-400 mb-2">
              {storeSummaries.length > 0 ? storeSummaries[0].storeName : "なし"}
            </div>
            <div className="text-zinc-500 text-sm">
              {storeSummaries.length > 0 &&
                `年間リスク売上: ¥${Math.round(storeSummaries[0].annualRevenueAtRisk).toLocaleString()}`}
            </div>
          </div>

          <div className="bg-zinc-900 border-2 border-red-500/50 rounded-xl p-8">
            <div className="text-zinc-400 text-lg mb-2">
              価格改定対象の高リスク会員数
            </div>
            <div className="text-6xl font-bold text-red-400 mb-2">
              {priceRevisionImpact.highRiskTargetMembers.length}
            </div>
            <div className="text-zinc-500 text-sm">人</div>
          </div>
        </div>

        {/* 退会予測ランキング */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">退会予測ランキング（上位5名）</h2>
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
                      <div className="text-zinc-400 text-sm">
                        {item.member.plan} | {item.member.storeName}
                      </div>
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
                      <div className="text-zinc-500 text-xs mt-1">
                        年間リスク売上
                      </div>
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

        {/* 今日の優先対応 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">今日の優先対応（上位5名）</h2>
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
                        <div className="text-zinc-400 text-sm">
                          {item.member.plan} | {item.member.storeName}
                        </div>
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

        {/* 価格改定後30日モニターの要約 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">価格改定後30日モニターの要約</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
              <div className="text-zinc-400 text-sm mb-2">改定対象会員数</div>
              <div className="text-4xl font-bold text-white">
                {priceRevision30Days.targetMembers}
              </div>
              <div className="text-zinc-500 text-xs mt-1">人</div>
            </div>

            <div className="bg-zinc-950 border border-red-500/40 rounded-lg p-6">
              <div className="text-zinc-400 text-sm mb-2">リスク上昇会員数</div>
              <div className="text-4xl font-bold text-red-400">
                {priceRevision30Days.increasedRiskMembers}
              </div>
              <div className="text-zinc-500 text-xs mt-1">人</div>
            </div>

            <div className="bg-zinc-950 border border-red-500/40 rounded-lg p-6">
              <div className="text-zinc-400 text-sm mb-2">30日損失予測</div>
              <div className="text-4xl font-bold text-red-400">
                ¥{Math.round(priceRevision30Days.expectedLoss30Days).toLocaleString()}
              </div>
              <div className="text-zinc-500 text-xs mt-1">期待損失額</div>
            </div>
          </div>
        </div>

        {/* 収益防衛シミュレーションの要約 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">収益防衛シミュレーションの要約</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-950 border border-green-500/40 rounded-lg p-6">
              <div className="text-zinc-400 text-sm mb-2">上位3人を守った場合</div>
              <div className="text-4xl font-bold text-green-400">
                ¥{Math.round(
                  revenueDefenseSimulation.protectedRevenueIfTop3Saved
                ).toLocaleString()}
              </div>
              <div className="text-zinc-500 text-xs mt-1">防衛可能売上</div>
            </div>

            <div className="bg-zinc-950 border border-green-500/40 rounded-lg p-6">
              <div className="text-zinc-400 text-sm mb-2">上位5人を守った場合</div>
              <div className="text-4xl font-bold text-green-400">
                ¥{Math.round(
                  revenueDefenseSimulation.protectedRevenueIfTop5Saved
                ).toLocaleString()}
              </div>
              <div className="text-zinc-500 text-xs mt-1">防衛可能売上</div>
            </div>

            <div className="bg-zinc-950 border border-green-500/40 rounded-lg p-6">
              <div className="text-zinc-400 text-sm mb-2">高リスク全体を守った場合</div>
              <div className="text-4xl font-bold text-green-400">
                ¥{Math.round(
                  revenueDefenseSimulation.protectedRevenueIfHighRiskSaved
                ).toLocaleString()}
              </div>
              <div className="text-zinc-500 text-xs mt-1">防衛可能売上</div>
            </div>
          </div>
        </div>

        {/* 提案メッセージ */}
        <div className="bg-zinc-900 border-2 border-blue-500/50 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">PoC結果からの提案</h2>
          <div className="space-y-4 text-lg text-zinc-300 leading-relaxed">
            <p>
              本PoCにより、価格改定後に優先して守るべき会員と売上を可視化できました。
              来月失う可能性のある売上は¥{Math.round(totalExpectedLoss30Days).toLocaleString()}と高く、
              上位{revenueDefenseSimulation.membersToSaveForGoal}名の会員を守ることで、
              ¥{Math.round(revenueDefenseSimulation.protectedRevenueIfTop5Saved).toLocaleString()}の売上を防衛可能です。
            </p>
            <p>
              価格改定対象会員のうち、{priceRevision30Days.increasedRiskMembers}名がリスク上昇しており、
              特に{storeSummaries.length > 0 ? storeSummaries[0].storeName : "一部店舗"}での重点的なサポートが必要です。
            </p>
            <p>
              今後は実データ連携により、継続率改善の精度をさらに高められます。
              TwinCoachの継続的な活用により、会員満足度向上と収益安定化の両立が期待できます。
            </p>
          </div>
        </div>

        {/* 導線リンク */}
        <div className="text-center">
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/demo"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
            >
              Demo画面を見る
            </Link>
            <Link
              href="/price-revision"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
            >
              価格改定影響分析を見る
            </Link>
            <Link
              href="/stores"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
            >
              店舗一覧を見る
            </Link>
            <Link
              href="/members"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
            >
              会員一覧を見る
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






