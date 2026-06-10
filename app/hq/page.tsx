import { getStoreSummaries } from "@/lib/storeSummary";
import { calculateRetentionMetrics } from "@/lib/retentionMetrics";
import { memberRepository } from "@/lib/repositories";
import { generateHQActionPlan } from "@/lib/hqActionAI";
import { calculateRiskScore } from "@/lib/riskScore";
import { getRevenueRiskForecast } from "@/lib/revenueForecast";
import { ContextualStoreLink } from "@/components/navigation/ContextualStoreLink";

function IconRevenue() {
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function IconRetention() {
  return (
    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

function IconRisk() {
  return (
    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function IconLoss() {
  return (
    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
    </svg>
  );
}

export default async function HQPage() {
  const members = await memberRepository.getAll();

  const hqActionPlan = generateHQActionPlan(members);

  const storeSummaries = getStoreSummaries(members);
  const totalRevenue = storeSummaries.reduce((sum, store) => sum + store.monthlyRevenue, 0);
  const totalMembers = storeSummaries.reduce((sum, s) => sum + s.totalMembers, 0);
  const highRiskMembersCount = members.filter(
    (m) => calculateRiskScore(m).level === "high"
  ).length;

  const nextMonthLoss = members.reduce((sum, m) => {
    const forecast = getRevenueRiskForecast(m);
    return sum + forecast.expectedLoss30Days;
  }, 0);

  const retentionMetrics = calculateRetentionMetrics(members);

  const storeRanking = [...storeSummaries]
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 5);

  const problemStores = [...storeSummaries]
    .filter(store => store.highRiskMembers > 0)
    .sort((a, b) => {
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
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* ページヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            HQダッシュボード
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            全店舗のパフォーマンスとリスクの要約
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
            <IconCalendar />
            今月
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
          >
            更新
          </button>
        </div>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* 全店舗売上 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-medium text-slate-500">全店舗売上（月間）</p>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <IconRevenue />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ¥{totalRevenue.toLocaleString()}
          </p>
          <p className="mt-1.5 text-xs text-slate-400">
            {storeSummaries.length}店舗の合計
          </p>
        </div>

        {/* 全店舗継続率 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-medium text-slate-500">全店舗継続率</p>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <IconRetention />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {retentionMetrics.estimatedRetentionRate}%
          </p>
          <p className="mt-1.5 text-xs text-slate-400">
            全会員 {totalMembers}名
          </p>
        </div>

        {/* 高リスク会員数 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-medium text-slate-500">高リスク会員数</p>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50">
              <IconRisk />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{highRiskMembersCount}</p>
          <p className="mt-1.5 text-xs text-slate-400">優先介入対象</p>
        </div>

        {/* 来月損失予測 */}
        <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-medium text-slate-500">来月損失予測</p>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
              <IconLoss />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">
            ¥{nextMonthLoss.toLocaleString()}
          </p>
          <p className="mt-1.5 text-xs text-slate-400">30日間の期待損失合計</p>
        </div>
      </div>

      {/* メインコンテンツ 2カラム */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* 左列：問題店舗 + 改善提案AI */}
        <div className="space-y-6">
          {/* 問題店舗 */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">問題店舗</h2>
              <p className="text-xs text-slate-400 mt-0.5">高リスク会員が多い店舗</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">店舗名</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">高リスク</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">月間リスク</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">継続率</th>
                  </tr>
                </thead>
                <tbody>
                  {problemStores.length > 0 ? (
                    problemStores.map((store) => (
                      <tr key={store.storeName} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <ContextualStoreLink
                            storeName={store.storeName}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            {store.storeName}
                          </ContextualStoreLink>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            {store.highRiskMembers}名
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-red-600">
                          ¥{store.monthlyRevenueAtRisk.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-red-600">
                            {store.estimatedRetentionRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                        問題店舗はありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 本部向け改善提案AI */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="mb-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    本部向け改善提案AI
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    店舗比較・収益リスク・予約リスク・収益改善AIを統合した今月の優先事項
                  </p>
                </div>
                <div
                  className={`shrink-0 rounded-lg border px-3 py-1 text-xs font-bold tracking-wider ${priorityBadgeClass}`}
                >
                  {priorityLabelJa}
                </div>
              </div>
            </div>

            <div className="mb-5 rounded-lg bg-slate-50 px-4 py-3 border border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-1">最重要課題</p>
              <p className="text-base font-bold text-slate-900 leading-snug">
                {hqActionPlan.topIssue}
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              {hqActionPlan.summary}
            </p>

            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  今月やるべきこと（Top 3）
                </h3>
                <ul className="space-y-2.5">
                  {hqActionPlan.actions.map((action, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-[11px] font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-700 leading-relaxed pt-0.5">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  優先対応店舗（Top 3）
                </h3>
                {hqActionPlan.priorityStores.length > 0 ? (
                  <ol className="space-y-2">
                    {hqActionPlan.priorityStores.map((name, i) => (
                      <li key={name} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-mono w-4 shrink-0">{i + 1}.</span>
                        <ContextualStoreLink
                          storeName={name}
                          className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {name}
                        </ContextualStoreLink>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-slate-400">該当店舗を特定できませんでした</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右列：店舗ランキング */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">店舗ランキング</h2>
              <p className="text-xs text-slate-400 mt-0.5">月間売上順</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">順位</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">店舗名</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">月間売上</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">会員数</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">継続率</th>
                  </tr>
                </thead>
                <tbody>
                  {storeRanking.map((store, index) => (
                    <tr key={store.storeName} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-slate-100 text-slate-600" :
                          index === 2 ? "bg-orange-100 text-orange-700" :
                          "text-slate-400"
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <ContextualStoreLink
                          storeName={store.storeName}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          {store.storeName}
                        </ContextualStoreLink>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-900">
                        ¥{store.monthlyRevenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-slate-600">
                        {store.totalMembers}名
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-medium ${
                          store.estimatedRetentionRate >= 80 ? "text-emerald-600" :
                          store.estimatedRetentionRate >= 60 ? "text-yellow-600" :
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
