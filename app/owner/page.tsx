import { getStoreSummaries } from "@/lib/storeSummary";
import { calculateRiskScore } from "@/lib/riskScore";
import { getRevenueAtRisk } from "@/lib/revenueRisk";
import { getRevenueRiskForecast } from "@/lib/revenueForecast";
import { getPriorityQueue } from "@/lib/priorityQueue";
import { estimateChurnReasons } from "@/lib/churnReasonAI";
import { generateNextActions } from "@/lib/nextActionAI";
import { memberRepository } from "@/lib/repositories";
import { Member } from "@/types";
import Link from "next/link";
import { ContextualStoreLink } from "@/components/navigation/ContextualStoreLink";
import { getTrainerMetrics } from "@/lib/trainerMetrics";
import { generateRevenueImprovementPlan } from "@/lib/revenueImprovementAI";
import { getStoreActionPlan } from "@/lib/storeActionPlan";
import { getCurrentStoreIdFromCookies } from "@/lib/authz/storeContext";

export default async function OwnerPage() {
  const ownerStoreId = await getCurrentStoreIdFromCookies();

  // オーナーは所属店舗のみを取得（モック互換のため name fallback 付き）
  const storeMembers = ownerStoreId
    ? await memberRepository.getAllForStore(ownerStoreId)
    : [];
  const ownerStoreName =
    storeMembers[0]?.storeName ??
    "店舗未選択";

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
    expectedLoss30Days: 0,
    estimatedRetentionRate: 0,
  };

  const highRiskCount = storeSummary.highRiskMembers;
  const nextMonthLoss = storeSummary.expectedLoss30Days;

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

  const priorityToday = getPriorityQueue(storeMembers).slice(0, 5);

  const totalLoss60Days = storeMembers.reduce((sum, m) => {
    const f = getRevenueRiskForecast(m);
    return sum + f.expectedLoss60Days;
  }, 0);

  const annualDanger = storeMembers
    .filter((m) => calculateRiskScore(m).level === "high")
    .reduce((sum, m) => sum + getRevenueRiskForecast(m).annualRevenue, 0);

  const topStoresByLoss = getStoreSummaries(storeMembers)
    .slice()
    .sort((a, b) => b.expectedLoss30Days - a.expectedLoss30Days)
    .slice(0, 5);

  const trainerRetention = getTrainerMetrics(storeMembers)
    .slice()
    .sort((a, b) => a.estimatedRetentionRate - b.estimatedRetentionRate)
    .slice(0, 5);

  const revenueImprovementPlan = generateRevenueImprovementPlan(storeMembers, ownerStoreName);
  const storeActionPlan = getStoreActionPlan(storeMembers, ownerStoreName);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">オーナーダッシュボード</h1>
      <p className="text-slate-600 mb-8">店舗: {ownerStoreName}</p>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h3 className="text-slate-600 text-sm mb-2">自店舗売上（月間）</h3>
          <p className="text-3xl font-bold text-slate-900">
            ¥{storeSummary.monthlyRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h3 className="text-slate-600 text-sm mb-2">推定継続率</h3>
          <p className="text-3xl font-bold text-red-600">
            {storeSummary.estimatedRetentionRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h3 className="text-slate-600 text-sm mb-2">高リスク会員数</h3>
          <p className="text-3xl font-bold text-red-600">
            {highRiskCount}
          </p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          <h3 className="text-slate-600 text-sm mb-2">来月損失予測</h3>
          <p className="text-3xl font-bold text-red-600">
            ¥{nextMonthLoss.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 高リスク会員 */}

      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">高リスク会員</h2>
        {highRiskMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-slate-600">会員名</th>
                  <th className="text-left py-3 px-4 text-slate-600">プラン</th>
                  <th className="text-right py-3 px-4 text-slate-600">リスクスコア</th>
                  <th className="text-right py-3 px-4 text-slate-600">月間売上</th>
                  <th className="text-left py-3 px-4 text-slate-600">最終来店日</th>
                  <th className="text-left py-3 px-4 text-slate-600">来店間隔</th>
                </tr>
              </thead>
              <tbody>
                {highRiskMembers.map(({ member, risk, revenue }) => (
                  <tr key={member.id} className="border-b border-slate-200 hover:bg-slate-100/80">
                    <td className="py-3 px-4">
                      <Link
                        href={`/owner/members/${member.id}`}
                        className="text-blue-700 hover:text-blue-800"
                      >
                        {member.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-900">{member.plan}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-red-600 font-bold">{risk.score}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-900">
                      ¥{revenue.monthlyRevenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-900">{member.lastVisitDate}</td>
                    <td className="py-3 px-4 text-slate-900">{member.visitInterval}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-600 text-center py-8">高リスク会員はありません</p>
        )}
      </div>

      {/* 収益リスク */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">収益リスク</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-4">
            <div className="text-slate-600 text-xs mb-1">来月損失予測</div>
            <div className="text-2xl font-bold text-red-600">
              ¥{nextMonthLoss.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-4">
            <div className="text-slate-600 text-xs mb-1">60日損失予測</div>
            <div className="text-2xl font-bold text-red-600">
              ¥{totalLoss60Days.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-4">
            <div className="text-slate-600 text-xs mb-1">年間危険売上</div>
            <div className="text-2xl font-bold text-red-700">
              ¥{annualDanger.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 今日の優先対応 */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">今日の優先対応</h2>
        {priorityToday.length === 0 ? (
          <p className="text-slate-600">対象会員はいません</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {priorityToday.map((item) => {
              const churnReasons = estimateChurnReasons(item.member);
              const tags = churnReasons.reasons.slice(0, 2).map((r) => r.tag);
              const next = generateNextActions(item.member, undefined, churnReasons);
              const first = next.actions[0];
              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 shadow-sm rounded-lg p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/owner/members/${item.id}`}
                        className="text-slate-900 font-semibold hover:text-blue-700"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-slate-500 text-xs">30日</span>
                        <span className="text-red-600 text-lg font-bold tabular-nums">
                          {item.probability30Days}%
                        </span>
                      </div>
                      {tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="rounded border border-slate-200 bg-slate-100/80 px-2 py-0.5 text-[11px] text-slate-700"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500 text-xs mb-1">次回提案AI</div>
                      <div className="text-sm font-medium text-slate-900">
                        {first ? first.title : "—"}
                      </div>
                      {first?.description ? (
                        <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {first.description}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/owner/members/${item.id}`}
                      className="text-blue-700 hover:text-blue-800 hover:underline text-sm"
                    >
                      詳細を見る →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 店舗別サマリー */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">店舗別サマリー</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topStoresByLoss.map((store) => (
            <ContextualStoreLink
              key={store.storeName}
              storeName={store.storeName}
              className="rounded-lg border border-slate-200 bg-slate-50/80 p-5 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-slate-900 font-semibold truncate">
                    {store.storeName}
                  </div>
                  {store.storeName === ownerStoreName ? (
                    <div className="text-emerald-800 text-[11px] mt-1 font-semibold">
                      自店舗
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">継続率</span>
                  <span className="text-emerald-800 font-semibold">
                    {store.estimatedRetentionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-500">高リスク</span>
                  <span className="text-red-700 font-semibold">
                    {store.highRiskMembers}名
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-500">来月損失</span>
                  <span className="text-red-600 font-semibold">
                    ¥{store.expectedLoss30Days.toLocaleString()}
                  </span>
                </div>
              </div>
            </ContextualStoreLink>
          ))}
        </div>
      </div>

      {/* トレーナー別継続率 */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">トレーナー別継続率</h2>
        {trainerRetention.length === 0 ? (
          <p className="text-slate-600">対象がありません</p>
        ) : (
          <div className="space-y-3">
            {trainerRetention.map((t) => (
              <div
                key={t.trainerName}
                className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="text-slate-900 font-semibold truncate">
                    {t.trainerName}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    高リスク {t.highRiskMembers}名
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-xs mb-1">推定継続率</div>
                  <div className="text-2xl font-bold text-emerald-800 tabular-nums">
                    {t.estimatedRetentionRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 収益改善AI */}
      <div className="mb-12 mt-8">
        <h2 className="text-xl font-bold mb-4">収益改善AI</h2>
        <div className="bg-slate-50 border border-emerald-500/35 rounded-xl p-6">
          <div className="text-xs uppercase tracking-wider text-emerald-700/90 font-semibold mb-3">
            最優先の改善テーマ
          </div>
          <div className="text-2xl font-bold text-slate-900 leading-tight">
            {revenueImprovementPlan.topPriority}
          </div>
          <div className="text-emerald-700/90 text-sm mt-3">
            想定改善インパクト: {revenueImprovementPlan.expectedImpact}
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-100/80 p-4">
              <div className="text-slate-500 text-xs">30日期待損失</div>
              <div className="text-red-600 font-bold text-lg tabular-nums">
                ¥{revenueImprovementPlan.metrics.expectedLoss30Days.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-100/80 p-4">
              <div className="text-slate-500 text-xs">60日期待損失</div>
              <div className="text-red-600 font-bold text-lg tabular-nums">
                ¥{revenueImprovementPlan.metrics.expectedLoss60Days.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-100/80 p-4">
              <div className="text-slate-500 text-xs">高LTV高リスク</div>
              <div className="text-slate-900 font-bold text-lg tabular-nums">
                {revenueImprovementPlan.highImpactMemberCount}人
              </div>
            </div>
          </div>
          <div className="mt-5">
            <div className="text-sm font-semibold text-slate-800 mb-3">今やること（Top3）</div>
            <ul className="space-y-2">
              {revenueImprovementPlan.actions.map((a) => (
                <li key={a.title} className="flex gap-3 text-sm text-slate-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 text-xs font-bold border border-emerald-500/30">
                    ①
                  </span>
                  <div>
                    <div className="text-slate-900 font-medium">{a.title}</div>
                    <div className="text-emerald-700/90 text-xs mt-1">{a.impact}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 店舗アクションプラン */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">店舗アクションプラン</h2>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="min-w-0">
            <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider">
              最重要課題
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {storeActionPlan.topIssue}
            </div>
            <div className="text-sm text-slate-600 mt-2">
              想定改善インパクト: {storeActionPlan.expectedImpact}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-100/80 px-4 py-2 text-sm font-semibold text-slate-900">
            優先度: {storeActionPlan.priorityLabel === "high" ? "高" : storeActionPlan.priorityLabel === "medium" ? "中" : "低"}
          </div>
        </div>
        <ul className="space-y-2">
          {storeActionPlan.actionItems.slice(0, 6).map((item) => (
            <li key={item} className="text-sm text-slate-700 flex gap-2">
              <span className="text-emerald-700">・</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

