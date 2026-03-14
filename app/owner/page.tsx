import { getStoreSummaries, type StoreSummary } from "@/lib/storeSummary";
import { calculateRiskScore } from "@/lib/riskScore";
import { getRevenueAtRisk } from "@/lib/revenueRisk";
import { memberRepository } from "@/lib/repositories";
import { Member } from "@/types";
import Link from "next/link";

// TODO: 認証情報から店舗名を取得する実装に置き換える
function getOwnerStoreName(): string {
  // 現時点ではモックとして最初の店舗を使用
  // 将来的には認証情報（セッション/クッキー）から取得
  return "三軒茶屋本店";
}

export default async function OwnerPage() {
  const members = await memberRepository.getAll();
  const ownerStoreName = getOwnerStoreName();

  // 自店舗の会員のみフィルタ
  const storeMembers = members.filter((m: Member) => m.storeName === ownerStoreName);

  // 自店舗の集計
  const storeSummaries = getStoreSummaries(storeMembers);
  const storeSummary = storeSummaries.find(s => s.storeName === ownerStoreName) || {
    storeName: ownerStoreName,
    totalMembers: 0,
    highRiskMembers: 0,
    mediumRiskMembers: 0,
    lowRiskMembers: 0,
    monthlyRevenue: 0,
    monthlyRevenueAtRisk: 0,
    annualRevenueAtRisk: 0,
    estimatedRetentionRate: 0,
  };

  // 高リスク会員
  const highRiskMembers = storeMembers
    .map((m: Member) => ({
      member: m,
      risk: calculateRiskScore(m),
      revenue: getRevenueAtRisk(m),
    }))
    .filter(({ risk }) => risk.level === "high")
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, 10);

  // 全店舗ランキング（自店舗の位置を確認）
  const allStoreSummaries = getStoreSummaries(members);
  const storeRanking = [...allStoreSummaries]
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);
  const ownStoreRank = storeRanking.findIndex(s => s.storeName === ownerStoreName) + 1;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">オーナーダッシュボード</h1>
      <p className="text-zinc-400 mb-8">店舗: {ownerStoreName}</p>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-400 text-sm mb-2">自店舗売上（月間）</h3>
          <p className="text-3xl font-bold text-white">
            ¥{storeSummary.monthlyRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-400 text-sm mb-2">収益リスク（月間）</h3>
          <p className="text-3xl font-bold text-red-400">
            ¥{storeSummary.monthlyRevenueAtRisk.toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-400 text-sm mb-2">収益リスク（年間）</h3>
          <p className="text-3xl font-bold text-red-400">
            ¥{storeSummary.annualRevenueAtRisk.toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-zinc-400 text-sm mb-2">継続率</h3>
          <p className="text-3xl font-bold text-white">
            {storeSummary.estimatedRetentionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* 店舗ランキング */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">店舗ランキング（月間売上）</h2>
        <div className="mb-4">
          <p className="text-lg">
            自店舗の順位: <span className="font-bold text-blue-400">{ownStoreRank}位</span> / {storeRanking.length}店舗中
          </p>
        </div>
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
              {storeRanking.slice(0, 10).map((store, index) => (
                <tr
                  key={store.storeName}
                  className={`border-b border-zinc-800 hover:bg-zinc-800/50 ${
                    store.storeName === ownerStoreName ? "bg-blue-900/20" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <span className={`text-lg font-bold ${
                      store.storeName === ownerStoreName ? "text-blue-400" : "text-white"
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {store.storeName === ownerStoreName ? (
                      <span className="text-blue-400 font-bold">{store.storeName}（自店舗）</span>
                    ) : (
                      <span className="text-white">{store.storeName}</span>
                    )}
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

      {/* 高リスク会員 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">高リスク会員</h2>
        {highRiskMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-zinc-400">会員名</th>
                  <th className="text-left py-3 px-4 text-zinc-400">プラン</th>
                  <th className="text-right py-3 px-4 text-zinc-400">リスクスコア</th>
                  <th className="text-right py-3 px-4 text-zinc-400">月間売上</th>
                  <th className="text-left py-3 px-4 text-zinc-400">最終来店日</th>
                  <th className="text-left py-3 px-4 text-zinc-400">来店間隔</th>
                </tr>
              </thead>
              <tbody>
                {highRiskMembers.map(({ member, risk, revenue }) => (
                  <tr key={member.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/members/${member.id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {member.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-white">{member.plan}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-red-400 font-bold">{risk.score}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      ¥{revenue.monthlyRevenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-white">{member.lastVisitDate}</td>
                    <td className="py-3 px-4 text-white">{member.visitInterval}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-zinc-400 text-center py-8">高リスク会員はありません</p>
        )}
      </div>
    </div>
  );
}

