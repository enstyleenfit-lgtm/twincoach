import { getStoreSummaries, type StoreSummary } from "@/lib/storeSummary";
import { calculateRetentionMetrics } from "@/lib/retentionMetrics";
import { memberRepository } from "@/lib/repositories";
import Link from "next/link";

export default async function HQPage() {
  const members = await memberRepository.getAll();

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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">HQダッシュボード</h1>

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

