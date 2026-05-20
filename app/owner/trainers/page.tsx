import Link from "next/link";
import { memberRepository } from "@/lib/repositories";
import { getTrainerMetrics, TrainerMetrics } from "@/lib/trainerMetrics";
import { OWNER_STORE_IDS, getTrialStoreNameForData } from "@/lib/trialStore";

function calcEstimatedSessions(t: TrainerMetrics): number {
  return t.lowRiskMembers * 4 + t.mediumRiskMembers * 2 + t.highRiskMembers * 1;
}

function calcGoodRetentionRate(t: TrainerMetrics): number {
  if (t.totalMembers === 0) return 0;
  return Math.round((t.lowRiskMembers / t.totalMembers) * 100);
}

export default async function OwnerTrainersPage() {
  const membersByStore = await Promise.all(
    OWNER_STORE_IDS.map((id) =>
      memberRepository.getAllForStore(getTrialStoreNameForData(id))
    )
  );
  const allMembers = membersByStore.flat();

  const trainerMetrics = getTrainerMetrics(allMembers).filter(
    (t) => t.trainerName !== "未割り当て"
  );

  const trainerCount = trainerMetrics.length;
  const avgRetentionRate =
    trainerCount > 0
      ? Math.round(
          trainerMetrics.reduce((sum, t) => sum + t.estimatedRetentionRate, 0) / trainerCount
        )
      : 0;
  const totalHighRisk = trainerMetrics.reduce((sum, t) => sum + t.highRiskMembers, 0);
  const totalEstimatedSessions = trainerMetrics.reduce(
    (sum, t) => sum + calcEstimatedSessions(t),
    0
  );

  const highRiskTrainers = [...trainerMetrics]
    .sort((a, b) => b.highRiskMembers - a.highRiskMembers)
    .slice(0, 2)
    .filter((t) => t.highRiskMembers > 0);

  const lowRetentionTrainers = [...trainerMetrics]
    .sort((a, b) => a.estimatedRetentionRate - b.estimatedRetentionRate)
    .slice(0, 2)
    .filter((t) => t.estimatedRetentionRate < 80);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">トレーナー分析</h1>
      <p className="text-slate-500 text-sm mb-8">管轄店舗のトレーナー成果と改善ポイントを可視化</p>

      {/* KPIカード */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-xs mb-2">管轄トレーナー数</p>
          <p className="text-2xl font-bold text-slate-900">
            {trainerCount}
            <span className="text-sm font-normal text-slate-500 ml-1">名</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-xs mb-2">平均継続率</p>
          <p className="text-2xl font-bold text-slate-900">
            {avgRetentionRate}
            <span className="text-sm font-normal text-slate-500 ml-1">%</span>
          </p>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-xs mb-2">高リスク担当数</p>
          <p className="text-2xl font-bold text-red-600">
            {totalHighRisk}
            <span className="text-sm font-normal text-slate-500 ml-1">名</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-xs mb-2">推定セッション数</p>
          <p className="text-2xl font-bold text-slate-900">
            {totalEstimatedSessions}
            <span className="text-sm font-normal text-slate-500 ml-1">回/月</span>
          </p>
        </div>
      </div>

      {/* トレーナーカードグリッド */}
      {trainerMetrics.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm mb-8">
          <p className="text-slate-500 text-sm">担当トレーナーが見つかりません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {trainerMetrics.map((t) => {
            const sessions = calcEstimatedSessions(t);
            const goodRate = calcGoodRetentionRate(t);
            return (
              <div
                key={t.trainerName}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-base font-bold text-slate-500 shrink-0">
                      {t.trainerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {t.trainerName}
                      </p>
                      <p className="text-xs text-slate-500">担当 {t.totalMembers}名</p>
                    </div>
                  </div>
                  {t.highRiskMembers > 0 && (
                    <span className="shrink-0 inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      高リスク {t.highRiskMembers}名
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">推定継続率</p>
                    <p
                      className={`text-sm font-semibold ${
                        t.estimatedRetentionRate >= 70 ? "text-slate-900" : "text-red-600"
                      }`}
                    >
                      {t.estimatedRetentionRate.toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">継続良好率</p>
                    <p className="text-sm font-semibold text-slate-900">{goodRate}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">月間売上</p>
                    <p className="text-sm font-semibold text-slate-900">
                      ¥{t.monthlyRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">推定セッション数</p>
                    <p className="text-sm font-semibold text-slate-900">{sessions}回/月</p>
                  </div>
                </div>

                <Link
                  href={`/owner/trainers/${encodeURIComponent(t.trainerName)}`}
                  className="block w-full text-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  詳細を見る
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* 改善提案 */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">改善提案</h2>
        <div className="space-y-3">
          {highRiskTrainers.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200/80 p-4">
              <p className="text-xs font-semibold text-red-700 mb-1">
                高リスク担当が多いトレーナー
              </p>
              <p className="text-sm text-slate-700">
                {highRiskTrainers.map((t) => t.trainerName).join("、")}
                の担当会員に高リスクが集中しています。早期フォロー介入とセッション記録の確認を優先してください。
              </p>
            </div>
          )}
          {lowRetentionTrainers.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200/80 p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">
                継続率が低いトレーナー
              </p>
              <p className="text-sm text-slate-700">
                {lowRetentionTrainers
                  .map((t) => `${t.trainerName}（${t.estimatedRetentionRate.toFixed(0)}%）`)
                  .join("、")}
                の継続率が平均を下回っています。担当会員との関係性や来店頻度を確認してください。
              </p>
            </div>
          )}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 mb-1">記録品質の改善</p>
            <p className="text-sm text-slate-700">
              セッション記録が少ないトレーナーは会員の来店傾向が把握しづらくなります。週次でセッション入力状況を確認し、記録漏れを防いでください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
