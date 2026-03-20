import { getStoreSummaries, type StoreSummary } from "@/lib/storeSummary";
import { calculateRetentionMetrics } from "@/lib/retentionMetrics";
import { memberRepository } from "@/lib/repositories";
import { generateHQActionPlan } from "@/lib/hqActionAI";
import Link from "next/link";

export default async function HQPage() {
  const members = await memberRepository.getAll();

  const hqActionPlan = generateHQActionPlan(members);

  // 全店舗の集計
  const storeSummaries = getStoreSummaries(members);
  const totalRevenue = storeSummaries.reduce((sum, store) => sum + store.monthlyRevenue, 0);
  const totalRevenueAtRisk = storeSummaries.reduce((sum, store) => sum + store.monthlyRevenueAtRisk, 0);
  
  // 全店舗継続率
  const retentionMetrics = calculateRetentionMetrics(members);

  // 店舗ランキング（月間売上順）
  const storeRanking = [...storeSummaries]
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 10);

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
      ? "bg-red-500/15 text-red-400 border-red-500/40"
      : hqActionPlan.priorityLabel === "medium"
        ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
        : "bg-emerald-500/10 text-emerald-400/90 border-emerald-500/30";

  const priorityLabelJa =
    hqActionPlan.priorityLabel === "high"
      ? "HIGH"
      : hqActionPlan.priorityLabel === "medium"
        ? "MEDIUM"
        : "LOW";

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
        HQダッシュボード
      </h1>
      <p className="text-zinc-500 text-sm mb-12 md:mb-14">
        全店舗のパフォーマンスとリスクの要約
      </p>

      {/* 本部向け改善提案AI */}
      <section className="mb-14 md:mb-14">
        <div className="mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-zinc-300 tracking-wide">
            本部向け改善提案AI
          </h2>
          <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
            店舗比較・収益リスク・価格改定モニター・予約リスク・収益改善AIを統合した今月の優先事項です。
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 md:p-10 ring-1 ring-emerald-500/10 shadow-2xl shadow-black/50">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div className="space-y-3 min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-medium">
                最重要課題
              </p>
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-snug">
                {hqActionPlan.topIssue}
              </p>
            </div>
            <div
              className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-bold tracking-wider ${priorityBadgeClass}`}
            >
              優先度：{priorityLabelJa}
            </div>
          </div>

          <p className="text-zinc-300 text-base md:text-lg leading-relaxed mb-10 max-w-3xl">
            {hqActionPlan.summary}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-4 tracking-wide">
                今月やるべきこと（Top 3）
              </h3>
              <ul className="space-y-4">
                {hqActionPlan.actions.map((action, i) => (
                  <li key={i} className="flex gap-4 text-zinc-100">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/10 text-emerald-400 text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className="text-base leading-relaxed pt-0.5">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black/40 p-6 md:p-8">
              <h3 className="text-sm font-semibold text-zinc-400 mb-5 tracking-wide">
                優先対応店舗（Top 3）
              </h3>
              {hqActionPlan.priorityStores.length > 0 ? (
                <ol className="space-y-4">
                  {hqActionPlan.priorityStores.map((name, i) => (
                    <li key={name} className="flex items-center gap-4">
                      <span className="text-zinc-500 font-mono text-sm w-6">
                        {i + 1}.
                      </span>
                      <Link
                        href={`/stores/${encodeURIComponent(name)}`}
                        className="text-lg font-semibold text-white hover:text-emerald-400 transition-colors border-b border-transparent hover:border-emerald-400/50 pb-0.5"
                      >
                        {name}
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-zinc-500 text-sm">該当店舗を特定できませんでした</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-400 text-sm mb-2">全店舗売上（月間）</h3>
          <p className="text-3xl font-bold text-white">
            ¥{totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-400 text-sm mb-2">収益リスク（月間）</h3>
          <p className="text-3xl font-bold text-red-400">
            ¥{totalRevenueAtRisk.toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-400 text-sm mb-2">全店舗継続率</h3>
          <p className="text-3xl font-bold text-white">
            {retentionMetrics.estimatedRetentionRate}%
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-400 text-sm mb-2">総店舗数</h3>
          <p className="text-3xl font-bold text-white">
            {storeSummaries.length}
          </p>
        </div>
      </div>

      {/* 店舗ランキング */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">店舗ランキング（月間売上）</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-zinc-400">順位</th>
                <th className="text-left py-3 px-4 text-zinc-400">店舗名</th>
                <th className="text-right py-3 px-4 text-zinc-400">月間売上</th>
                <th className="text-right py-3 px-4 text-zinc-400">会員数</th>
                <th className="text-right py-3 px-4 text-zinc-400">継続率</th>
              </tr>
            </thead>
            <tbody>
              {storeRanking.map((store, index) => (
                <tr key={store.storeName} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="py-3 px-4">
                    <span className="text-lg font-bold text-white">{index + 1}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/stores/${encodeURIComponent(store.storeName)}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {store.storeName}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-right text-white">
                    ¥{store.monthlyRevenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-white">
                    {store.totalMembers}名
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`${
                      store.estimatedRetentionRate >= 80 ? "text-green-400" :
                      store.estimatedRetentionRate >= 60 ? "text-yellow-400" :
                      "text-red-400"
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

      {/* 問題店舗 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">問題店舗（高リスク会員が多い店舗）</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-zinc-400">店舗名</th>
                <th className="text-right py-3 px-4 text-zinc-400">高リスク会員数</th>
                <th className="text-right py-3 px-4 text-zinc-400">収益リスク（月間）</th>
                <th className="text-right py-3 px-4 text-zinc-400">収益リスク（年間）</th>
                <th className="text-right py-3 px-4 text-zinc-400">継続率</th>
              </tr>
            </thead>
            <tbody>
              {problemStores.length > 0 ? (
                problemStores.map((store) => (
                  <tr key={store.storeName} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/stores/${encodeURIComponent(store.storeName)}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {store.storeName}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-red-400 font-bold">{store.highRiskMembers}名</span>
                    </td>
                    <td className="py-3 px-4 text-right text-red-400">
                      ¥{store.monthlyRevenueAtRisk.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-red-400">
                      ¥{store.annualRevenueAtRisk.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-red-400">
                        {store.estimatedRetentionRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400">
                    問題店舗はありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

