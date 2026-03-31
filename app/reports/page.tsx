import { DashboardBackLink } from "@/components/navigation/DashboardBackLink";
import { ContextualStoreLink } from "@/components/navigation/ContextualStoreLink";
import { ContextualTrainerLink } from "@/components/navigation/ContextualTrainerLink";
import { memberRepository } from "@/lib/repositories";
import { getMonthlyReportSummary } from "@/lib/monthlyReport";

export default async function ReportsPage() {
  // データ取得
  const allMembers = await memberRepository.getAll();

  // 月次レポートサマリー
  const report = getMonthlyReportSummary(allMembers);

  // 現在の月を取得
  const now = new Date();
  const monthYear = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="container mx-auto px-8 py-12 max-w-7xl">
        {/* ヘッダー */}
        <div className="mb-12">
          <DashboardBackLink className="text-blue-700 hover:text-blue-800 hover:underline text-sm mb-4 inline-block">
            ← ダッシュボードに戻る
          </DashboardBackLink>
          <h1 className="text-5xl font-bold mb-4">月次レポート</h1>
          <p className="text-2xl text-slate-600">{monthYear}</p>
        </div>

        {/* 月次サマリー */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">月次サマリー</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <div className="text-slate-600 text-sm mb-2">総会員数</div>
              <div className="text-4xl font-bold text-slate-900">
                {report.totalMembers}
              </div>
              <div className="text-slate-500 text-xs mt-1">人</div>
            </div>

            <div className="bg-slate-50 border border-red-500/40 rounded-lg p-6">
              <div className="text-slate-600 text-sm mb-2">高リスク会員数</div>
              <div className="text-4xl font-bold text-red-600">
                {report.highRiskMembers}
              </div>
              <div className="text-slate-500 text-xs mt-1">人</div>
            </div>

            <div className="bg-slate-50 border border-green-500/40 rounded-lg p-6">
              <div className="text-slate-600 text-sm mb-2">推定継続率</div>
              <div className="text-4xl font-bold text-green-700">
                {report.estimatedRetentionRate.toFixed(1)}%
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {report.totalMembers - report.highRiskMembers}/
                {report.totalMembers}人
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <div className="text-slate-600 text-sm mb-2">月間売上</div>
              <div className="text-4xl font-bold text-slate-900">
                ¥{Math.round(report.monthlyRevenue).toLocaleString()}
              </div>
              <div className="text-slate-500 text-xs mt-1">/月</div>
            </div>
          </div>

          {/* サマリーコメント */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">今月の状況</h3>
            <p className="text-slate-700 leading-relaxed">{report.summaryComment}</p>
          </div>
        </div>

        {/* 売上と損失予測 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">売上と損失予測</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-red-500/40 rounded-lg p-6">
              <div className="text-slate-600 text-sm mb-2">来月損失予測</div>
              <div className="text-4xl font-bold text-red-600">
                ¥{Math.round(report.monthlyLossForecast30Days).toLocaleString()}
              </div>
              <div className="text-slate-500 text-xs mt-1">30日期待損失額</div>
            </div>

            <div className="bg-slate-50 border border-red-500/40 rounded-lg p-6">
              <div className="text-slate-600 text-sm mb-2">60日損失予測</div>
              <div className="text-4xl font-bold text-red-600">
                ¥{Math.round(report.monthlyLossForecast60Days).toLocaleString()}
              </div>
              <div className="text-slate-500 text-xs mt-1">60日期待損失額</div>
            </div>

            <div className="bg-slate-50 border border-yellow-500/40 rounded-lg p-6">
              <div className="text-slate-600 text-sm mb-2">守るべき会員数</div>
              <div className="text-4xl font-bold text-yellow-700">
                {report.membersToSaveForGoal}
              </div>
              <div className="text-slate-500 text-xs mt-1">人</div>
            </div>
          </div>
        </div>

        {/* 店舗別状況 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">店舗別リスク 上位3店舗</h2>
          <div className="space-y-4">
            {report.top3Stores.map((store, index) => (
              <ContextualStoreLink
                key={store.storeName}
                storeName={store.storeName}
                className="block bg-slate-50 border border-slate-200 rounded-lg p-6 hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <span className="text-2xl font-bold text-slate-500 w-8">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-xl font-semibold text-slate-900 mb-1">
                        {store.storeName}
                      </div>
                      <div className="text-slate-600 text-sm">
                        会員数: {store.totalMembers}人 / 高リスク:{" "}
                        {store.highRiskMembers}人
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-red-600">
                        ¥{Math.round(store.annualRevenueAtRisk).toLocaleString()}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        年間リスク売上
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-slate-500 text-xs mb-1">月間売上</div>
                    <div className="text-lg font-semibold text-slate-900">
                      ¥{Math.round(store.monthlyRevenue).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">継続率</div>
                    <div className="text-lg font-semibold text-green-700">
                      {store.estimatedRetentionRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">月間リスク売上</div>
                    <div className="text-lg font-semibold text-red-600">
                      ¥{Math.round(store.monthlyRevenueAtRisk).toLocaleString()}
                    </div>
                  </div>
                </div>
              </ContextualStoreLink>
            ))}
          </div>
        </div>

        {/* トレーナー別状況 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6">トレーナー別リスク 上位3名</h2>
          <div className="space-y-4">
            {report.top3Trainers.map((trainer, index) => (
              <ContextualTrainerLink
                key={trainer.trainerName}
                trainerName={trainer.trainerName}
                className="block bg-slate-50 border border-slate-200 rounded-lg p-6 hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <span className="text-2xl font-bold text-slate-500 w-8">
                      #{index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-xl font-semibold text-slate-900 mb-1">
                        {trainer.trainerName}
                      </div>
                      <div className="text-slate-600 text-sm">
                        担当会員数: {trainer.totalMembers}人 / 高リスク:{" "}
                        {trainer.highRiskMembers}人
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-red-600">
                        ¥{Math.round(trainer.annualRevenueAtRisk).toLocaleString()}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        年間リスク売上
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-slate-500 text-xs mb-1">月間売上</div>
                    <div className="text-lg font-semibold text-slate-900">
                      ¥{Math.round(trainer.monthlyRevenue).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">継続率</div>
                    <div className="text-lg font-semibold text-green-700">
                      {trainer.estimatedRetentionRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">高リスク会員</div>
                    <div className="text-lg font-semibold text-red-600">
                      {trainer.highRiskMembers}人
                    </div>
                  </div>
                </div>
              </ContextualTrainerLink>
            ))}
          </div>
        </div>

        {/* 来月アクション提案 */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-6">来月アクション提案</h2>
          <div className="bg-slate-50 border border-yellow-500/40 rounded-lg p-6">
            <p className="text-slate-700 leading-relaxed text-lg">
              {report.actionProposal}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}







