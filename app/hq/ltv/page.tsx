import { memberRepository } from "@/lib/repositories";
import { getStoreSummaries, StoreSummary } from "@/lib/storeSummary";

function calcAvgMonths(retentionRate: number): number {
  const r = Math.min(retentionRate / 100, 0.95);
  return Math.round((1 / (1 - r)) * 10) / 10;
}

function calcStoreLTV(summary: StoreSummary): number {
  const avgMonths = calcAvgMonths(summary.estimatedRetentionRate);
  return Math.round(summary.monthlyRevenue * avgMonths);
}

function calcAvgMemberLTV(summary: StoreSummary): number {
  if (summary.totalMembers === 0) return 0;
  return Math.round(calcStoreLTV(summary) / summary.totalMembers);
}

const ACTIONS = [
  "高リスク会員の多い店舗を優先フォロー",
  "未予約・キャンセル増加会員への介入",
  "LTV低下店舗の原因確認",
  "トレーナー別の継続率確認",
];

export default async function HQLTVPage() {
  const members = await memberRepository.getAll();
  const storeSummaries = getStoreSummaries(members);

  const totalLTV = storeSummaries.reduce((sum, s) => sum + calcStoreLTV(s), 0);
  const totalMembers = storeSummaries.reduce((sum, s) => sum + s.totalMembers, 0);
  const avgMemberLTV = totalMembers > 0 ? Math.round(totalLTV / totalMembers) : 0;
  const totalLTVRisk = storeSummaries.reduce((sum, s) => sum + s.annualRevenueAtRisk, 0);
  const totalLoss30Days = storeSummaries.reduce((sum, s) => sum + s.expectedLoss30Days, 0);

  const sortedStores = [...storeSummaries].sort((a, b) => calcStoreLTV(b) - calcStoreLTV(a));

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">LTV管理</h1>
      <p className="text-slate-500 text-sm mb-8">全店舗のLTVと退会リスクによる損失を可視化</p>

      {/* KPIカード */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-xs mb-2">全店舗推定LTV</p>
          <p className="text-2xl font-bold text-slate-900">¥{totalLTV.toLocaleString()}</p>
          <p className="text-slate-400 text-xs mt-1">全会員LTV合計</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-xs mb-2">平均LTV（会員1名）</p>
          <p className="text-2xl font-bold text-slate-900">¥{avgMemberLTV.toLocaleString()}</p>
          <p className="text-slate-400 text-xs mt-1">{totalMembers}名平均</p>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-xs mb-2">LTV損失リスク（年間）</p>
          <p className="text-2xl font-bold text-red-600">¥{totalLTVRisk.toLocaleString()}</p>
          <p className="text-slate-400 text-xs mt-1">高リスク会員売上 × 12</p>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-xs mb-2">30日損失予測</p>
          <p className="text-2xl font-bold text-red-600">¥{totalLoss30Days.toLocaleString()}</p>
          <p className="text-slate-400 text-xs mt-1">来月の期待損失合計</p>
        </div>
      </div>

      {/* 店舗別LTV */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">店舗別LTV</h2>
          <p className="text-slate-500 text-xs mt-0.5">LTV降順。平均継続月数は継続率から算出（上限95%換算）</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">店舗名</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">会員数</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">推定LTV</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">平均LTV</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">高リスク会員</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">30日損失予測</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedStores.map((store) => (
                <tr key={store.storeName} className="hover:bg-slate-50/80">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{store.storeName}</td>
                  <td className="px-5 py-4 text-sm text-right text-slate-700">{store.totalMembers}名</td>
                  <td className="px-5 py-4 text-sm text-right font-semibold text-slate-900">
                    ¥{calcStoreLTV(store).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-sm text-right text-slate-700">
                    ¥{calcAvgMemberLTV(store).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-sm text-right">
                    <span className={store.highRiskMembers > 0 ? "text-red-600 font-semibold" : "text-slate-400"}>
                      {store.highRiskMembers}名
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-right text-red-600">
                    ¥{store.expectedLoss30Days.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 本部が打つべき施策 */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">本部が打つべき施策</h2>
        <ul className="space-y-3">
          {ACTIONS.map((action) => (
            <li key={action} className="flex items-start gap-3">
              <span className="mt-1 shrink-0 w-4 h-4 rounded-full bg-slate-200 border border-slate-300 block" />
              <span className="text-sm text-slate-700">{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
