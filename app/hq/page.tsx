import { getStoreSummaries } from "@/lib/storeSummary";
import { calculateRetentionMetrics } from "@/lib/retentionMetrics";
import { memberRepository } from "@/lib/repositories";
import { generateHQActionPlan } from "@/lib/hqActionAI";
import { calculateRiskScore } from "@/lib/riskScore";
import { getRevenueRiskForecast } from "@/lib/revenueForecast";
import { ContextualStoreLink } from "@/components/navigation/ContextualStoreLink";

export default async function HQPage() {
  const members = await memberRepository.getAll();

  const hqActionPlan = generateHQActionPlan(members);

  // 全店舗の集計
  const storeSummaries = getStoreSummaries(members);
  const totalRevenue = storeSummaries.reduce((sum, store) => sum + store.monthlyRevenue, 0);
  const highRiskMembersCount = members.filter(
    (m) => calculateRiskScore(m).level === "high"
  ).length;

  const nextMonthLoss = members.reduce((sum, m) => {
    const forecast = getRevenueRiskForecast(m);
    return sum + forecast.expectedLoss30Days;
  }, 0);

  // 全店舗継続率
  const retentionMetrics = calculateRetentionMetrics(members);

  // 店舗ランキング（月間売上順）
  const storeRanking = [...storeSummaries]
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 5);

  // 問題店舗（高リスク会員が多い店舗）
  const problemStores = [...storeSummaries]
    .filter(store => store.highRiskMembers > 0)
    .sort((a, b) => {
      // 高リスク会員数の降順、次にリスク売上の降順
      if (b.highRiskMembers !== a.highRiskMembers) {
        return b.highRiskMembers - a.highRiskMembers;
      }
      return b.monthlyRevenueAtRisk - a.monthlyRevenueAtRisk;
    })
    .slice(0, 5);

  const priorityBadgeClass =
    hqActionPlan.priorityLabel === "high"
      ? "bg-red-500/15 text-red-600 border-red-500/40"
      : hqActionPlan.priorityLabel === "medium"
        ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
        : "bg-emerald-500/10 text-emerald-700/90 border-emerald-500/30";

  const priorityLabelJa =
    hqActionPlan.priorityLabel === "high"
      ? "HIGH"
      : hqActionPlan.priorityLabel === "medium"
        ? "MEDIUM"
        : "LOW";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        HQダッシュボード
      </h1>
      <p className="text-slate-500 text-sm mb-8">
        全店舗のパフォーマンスとリスクの要約
      </p>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-2">全店舗売上（月間）</h3>
          <p className="text-2xl font-bold text-slate-900">
            ¥{totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-2">全店舗継続率</h3>
          <p className="text-2xl font-bold text-emerald-600">
            {retentionMetrics.estimatedRetentionRate}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-2">高リスク会員数</h3>
          <p className="text-2xl font-bold text-red-600">{highRiskMembersCount}</p>
          <p className="text-xs text-slate-500 mt-2">優先介入対象</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-2">来月損失予測</h3>
          <p className="text-2xl font-bold text-red-600">
            ¥{nextMonthLoss.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-2">30日期待損失の合計</p>
        </div>
      </div>

      {/* KPI以下 2カラム */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* 左列：要対応・リスク */}
        <div className="space-y-6">
          {/* 問題店舗 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">問題店舗（高リスク会員が多い店舗）</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-600">店舗名</th>
                    <th className="text-right py-3 px-4 text-slate-600">高リスク会員数</th>
                    <th className="text-right py-3 px-4 text-slate-600">収益リスク（月間）</th>
                    <th className="text-right py-3 px-4 text-slate-600">収益リスク（年間）</th>
                    <th className="text-right py-3 px-4 text-slate-600">継続率</th>
                  </tr>
                </thead>
                <tbody>
                  {problemStores.length > 0 ? (
                    problemStores.map((store) => (
                      <tr key={store.storeName} className="border-b border-slate-200 hover:bg-slate-100/80">
                        <td className="py-3 px-4">
                          <ContextualStoreLink
                            storeName={store.storeName}
                            className="text-blue-700 hover:text-blue-800"
                          >
                            {store.storeName}
                          </ContextualStoreLink>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-red-600 font-bold">{store.highRiskMembers}名</span>
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">
                          ¥{store.monthlyRevenueAtRisk.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600">
                          ¥{store.annualRevenueAtRisk.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-red-600">
                            {store.estimatedRetentionRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-600">
                        問題店舗はありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 本部向け改善提案AI */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 md:p-8 ring-1 ring-emerald-500/10 shadow-2xl shadow-black/50">
            <div className="mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-slate-700 tracking-wide">
                本部向け改善提案AI
              </h2>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                店舗比較・収益リスク・予約リスク・収益改善AIを統合した今月の優先事項です。
              </p>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div className="space-y-2 min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
                  最重要課題
                </p>
                <p className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
                  {hqActionPlan.topIssue}
                </p>
              </div>
              <div
                className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-bold tracking-wider ${priorityBadgeClass}`}
              >
                優先度：{priorityLabelJa}
              </div>
            </div>

            <p className="text-slate-700 text-sm leading-relaxed mb-8">
              {hqActionPlan.summary}
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-4 tracking-wide">
                  今月やるべきこと（Top 3）
                </h3>
                <ul className="space-y-4">
                  {hqActionPlan.actions.map((action, i) => (
                    <li key={i} className="flex gap-4 text-slate-900">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/10 text-emerald-700 text-sm font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed pt-1">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-100/90 p-5">
                <h3 className="text-sm font-semibold text-slate-600 mb-4 tracking-wide">
                  優先対応店舗（Top 3）
                </h3>
                {hqActionPlan.priorityStores.length > 0 ? (
                  <ol className="space-y-3">
                    {hqActionPlan.priorityStores.map((name, i) => (
                      <li key={name} className="flex items-center gap-4">
                        <span className="text-slate-500 font-mono text-sm w-6">
                          {i + 1}.
                        </span>
                        <ContextualStoreLink
                          storeName={name}
                          className="text-base font-semibold text-slate-900 hover:text-emerald-700 transition-colors border-b border-transparent hover:border-emerald-400/50 pb-0.5"
                        >
                          {name}
                        </ContextualStoreLink>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-slate-500 text-sm">該当店舗を特定できませんでした</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右列：分析 */}
        <div className="space-y-6">
          {/* 店舗ランキング */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">店舗ランキング（月間売上）</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-600">順位</th>
                    <th className="text-left py-3 px-4 text-slate-600">店舗名</th>
                    <th className="text-right py-3 px-4 text-slate-600">月間売上</th>
                    <th className="text-right py-3 px-4 text-slate-600">会員数</th>
                    <th className="text-right py-3 px-4 text-slate-600">継続率</th>
                  </tr>
                </thead>
                <tbody>
                  {storeRanking.map((store, index) => (
                    <tr key={store.storeName} className="border-b border-slate-200 hover:bg-slate-100/80">
                      <td className="py-3 px-4">
                        <span className="text-lg font-bold text-slate-900">{index + 1}</span>
                      </td>
                      <td className="py-3 px-4">
                        <ContextualStoreLink
                          storeName={store.storeName}
                          className="text-blue-700 hover:text-blue-800"
                        >
                          {store.storeName}
                        </ContextualStoreLink>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900">
                        ¥{store.monthlyRevenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900">
                        {store.totalMembers}名
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`${
                          store.estimatedRetentionRate >= 80 ? "text-green-700" :
                          store.estimatedRetentionRate >= 60 ? "text-yellow-700" :
                          "text-red-600"
                        }`}>
                          {store.estimatedRetentionRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
