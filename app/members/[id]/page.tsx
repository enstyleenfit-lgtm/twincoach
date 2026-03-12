import Link from "next/link";
import { memberRepository, visitRepository, interventionRepository } from "@/lib/repositories";
import { calculateRiskScore, getRiskReasons } from "@/lib/riskScore";
import { getInterventionSuggestion } from "@/lib/interventionSuggestion";
import { getMemberSegment, getSegmentInfo, getSegmentColor } from "@/lib/memberSegmentation";
import { getDualMembers, getRecommendedNextPlan } from "@/lib/planTransition";
import { getChurnPrediction, getChurnPredictionReasons } from "@/lib/churnPrediction";
import { getRevenueRiskForecast } from "@/lib/revenueForecast";

function getRiskScoreColor(score: number): string {
  if (score >= 80) {
    return "text-red-400";
  } else if (score >= 50) {
    return "text-yellow-400";
  } else {
    return "text-green-400";
  }
}

function getRiskLevelColor(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "high":
      return "text-red-400";
  }
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await memberRepository.getById(id);
  const visitHistory = await visitRepository.getByMemberId(id);
  const interventionHistory = await interventionRepository.getByMemberId(id);

  // デュアル移行最適化（デュアル会員の場合のみ）
  const isDualMember =
    member &&
    (member.plan === "デュアル月8" || member.currentPlan === "デュアル月8");
  const planTransitionRecommendation = isDualMember
    ? getRecommendedNextPlan(member)
    : null;

  if (!member) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link
          href="/members"
          className="text-blue-400 hover:text-blue-300 hover:underline mb-4 inline-block"
        >
          ← 会員一覧に戻る
        </Link>
        <h1 className="text-4xl font-bold mb-8">Member Not Found</h1>
        <p className="text-zinc-400">The member with ID "{id}" could not be found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link
        href="/members"
        className="text-blue-400 hover:text-blue-300 hover:underline mb-6 inline-block"
      >
        ← Back to Members
      </Link>

      <h1 className="text-4xl font-bold mb-8">{member.name}</h1>

      {/* 収益リスク */}
      {(() => {
        const forecast = getRevenueRiskForecast(member);
        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">収益リスク</h2>
            <p className="text-zinc-400 text-xs mb-4">
              退会確率をもとに、失う可能性のある売上を試算しています
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <div className="text-zinc-400 text-sm mb-1">月額売上</div>
                <div className="text-2xl font-bold text-white">
                  ¥{forecast.monthlyRevenue.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <div className="text-zinc-400 text-sm mb-1">年間売上</div>
                <div className="text-2xl font-bold text-white">
                  ¥{forecast.annualRevenue.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <div className="text-zinc-400 text-sm mb-1">30日退会確率</div>
                <div className="text-2xl font-bold text-red-400">
                  {forecast.probability30Days}%
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <div className="text-zinc-400 text-sm mb-1">60日退会確率</div>
                <div className="text-2xl font-bold text-red-400">
                  {forecast.probability60Days}%
                </div>
              </div>
              <div className="bg-zinc-950 border border-red-500/40 rounded-lg p-4">
                <div className="text-zinc-400 text-sm mb-1">30日期待損失額</div>
                <div className="text-2xl font-bold text-red-400">
                  ¥{forecast.expectedLoss30Days.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-950 border border-red-500/40 rounded-lg p-4">
                <div className="text-zinc-400 text-sm mb-1">60日期待損失額</div>
                <div className="text-2xl font-bold text-red-400">
                  ¥{forecast.expectedLoss60Days.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">会員情報</h2>
          <div className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm">名前</label>
              <p className="text-white font-medium">{member.name}</p>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Plan</label>
              <p className="text-white">{member.plan}</p>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Join Date</label>
              <p className="text-white">{member.joinDate}</p>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Last Visit</label>
              <p className="text-white">{member.lastVisitDate}</p>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">リスクスコア</label>
              {(() => {
                const riskResult = calculateRiskScore(member);
                return (
                  <div>
                    <p className={`text-2xl font-bold ${getRiskScoreColor(riskResult.score)}`}>
                      {riskResult.score}
                    </p>
                    <p className={`text-sm mt-1 ${getRiskLevelColor(riskResult.level)}`}>
                      Level: {riskResult.level.toUpperCase()}
                    </p>
                  </div>
                );
              })()}
            </div>
            <div>
              <label className="text-zinc-400 text-sm">会員タイプ</label>
              {(() => {
                const segment = getMemberSegment(member);
                const segmentInfo = getSegmentInfo(segment);
                return (
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSegmentColor(
                        segment
                      )}`}
                    >
                      {segmentInfo.label}
                    </span>
                    <p className="text-zinc-400 text-xs mt-2">{segmentInfo.description}</p>
                  </div>
                );
              })()}
            </div>
            <div>
              <label className="text-zinc-400 text-sm">退会リスクの要因</label>
              {(() => {
                const reasons = getRiskReasons(member);
                return reasons.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-zinc-400 text-sm">
                    {reasons.map((reason) => (
                      <li key={reason} className="flex gap-2">
                        <span>・</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-zinc-500 text-sm">-</p>
                );
              })()}
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-2 block">未来退会予測</label>
              {(() => {
                const prediction = getChurnPrediction(member);
                return (
                  <div className="mt-2 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-400 text-sm">30日退会確率</span>
                        <span
                          className={`text-lg font-bold ${
                            prediction.label30Days === "high"
                              ? "text-red-400"
                              : prediction.label30Days === "medium"
                              ? "text-orange-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {prediction.probability30Days}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              prediction.label30Days === "high"
                                ? "bg-red-400"
                                : prediction.label30Days === "medium"
                                ? "bg-orange-400"
                                : "bg-zinc-400"
                            }`}
                            style={{ width: `${prediction.probability30Days}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            prediction.label30Days === "high"
                              ? "text-red-400 bg-red-400/10 border border-red-400/20"
                              : prediction.label30Days === "medium"
                              ? "text-orange-400 bg-orange-400/10 border border-orange-400/20"
                              : "text-zinc-400 bg-zinc-400/10 border border-zinc-400/20"
                          }`}
                        >
                          {prediction.label30Days === "high"
                            ? "高"
                            : prediction.label30Days === "medium"
                            ? "中"
                            : "低"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-400 text-sm">60日退会確率</span>
                        <span
                          className={`text-lg font-bold ${
                            prediction.label60Days === "high"
                              ? "text-red-400"
                              : prediction.label60Days === "medium"
                              ? "text-orange-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {prediction.probability60Days}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              prediction.label60Days === "high"
                                ? "bg-red-400"
                                : prediction.label60Days === "medium"
                                ? "bg-orange-400"
                                : "bg-zinc-400"
                            }`}
                            style={{ width: `${prediction.probability60Days}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            prediction.label60Days === "high"
                              ? "text-red-400 bg-red-400/10 border border-red-400/20"
                              : prediction.label60Days === "medium"
                              ? "text-orange-400 bg-orange-400/10 border border-orange-400/20"
                              : "text-zinc-400 bg-zinc-400/10 border border-zinc-400/20"
                          }`}
                        >
                          {prediction.label60Days === "high"
                            ? "高"
                            : prediction.label60Days === "medium"
                            ? "中"
                            : "低"}
                        </span>
                      </div>
                    </div>
                    {prediction.reasons.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-800">
                        <p className="text-zinc-400 text-xs mb-2">予測理由</p>
                        <ul className="space-y-1 text-zinc-400 text-xs">
                          {prediction.reasons.map((reason, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span>・</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-2 block">未来退会予測の要因</label>
              {(() => {
                const reasons = getChurnPredictionReasons(member);
                return reasons.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-zinc-400 text-xs">
                    {reasons.map((reason, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span>・</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-zinc-500 text-xs">-</p>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">介入提案とメモ</h2>
          <div className="space-y-4">
            {(() => {
              const suggestion = getInterventionSuggestion(member);
              return (
                <div>
                  <label className="text-zinc-400 text-sm">推奨介入</label>
                  <div className="mt-2 space-y-2">
                    <p className="text-white font-medium">{suggestion.title}</p>
                    <p className="text-white text-sm">{suggestion.action}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-xs">タイプ:</span>
                      <span className="text-blue-400 text-xs font-medium capitalize">
                        {suggestion.type}
                      </span>
                      <span className="text-zinc-400 text-xs">•</span>
                      <span className="text-zinc-400 text-xs">優先度:</span>
                      <span
                        className={`text-xs font-medium capitalize ${
                          suggestion.priority === "high"
                            ? "text-red-400"
                            : suggestion.priority === "medium"
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                      >
                        {suggestion.priority}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div>
              <label className="text-zinc-400 text-sm">メモ</label>
              <p className="text-white text-sm leading-relaxed">{member.notes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* デュアル移行最適化 */}
      {isDualMember && planTransitionRecommendation && (
        <div className="mb-8">
          <div className="bg-zinc-900 border-2 border-blue-500/40 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">デュアル移行最適化</h2>
            <div className="space-y-6">
              <div>
                <label className="text-zinc-400 text-sm mb-2 block">
                  推奨移行先
                </label>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-base font-medium border ${
                    planTransitionRecommendation.recommendedNextPlan === "トレーニング月8"
                      ? "text-blue-400 bg-blue-400/10 border-blue-400/20"
                      : "text-purple-400 bg-purple-400/10 border-purple-400/20"
                  }`}
                >
                  {planTransitionRecommendation.recommendedNextPlan}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-zinc-400 text-sm mb-2 block">
                    トレーニング適性
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-zinc-800 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            planTransitionRecommendation.trainingFitScore >= 70
                              ? "bg-blue-400"
                              : planTransitionRecommendation.trainingFitScore >= 50
                              ? "bg-blue-500/60"
                              : "bg-zinc-600"
                          }`}
                          style={{
                            width: `${planTransitionRecommendation.trainingFitScore}%`,
                          }}
                        />
                      </div>
                      <span className="text-lg font-bold text-zinc-300 w-16 text-right">
                        {planTransitionRecommendation.trainingFitScore}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 text-sm mb-2 block">
                    ピラティス適性
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-zinc-800 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            planTransitionRecommendation.pilatesFitScore >= 70
                              ? "bg-purple-400"
                              : planTransitionRecommendation.pilatesFitScore >= 50
                              ? "bg-purple-500/60"
                              : "bg-zinc-600"
                          }`}
                          style={{
                            width: `${planTransitionRecommendation.pilatesFitScore}%`,
                          }}
                        />
                      </div>
                      <span className="text-lg font-bold text-zinc-300 w-16 text-right">
                        {planTransitionRecommendation.pilatesFitScore}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 text-sm mb-2 block">
                  推奨理由
                </label>
                <ul className="space-y-2 text-zinc-300 text-sm">
                  {planTransitionRecommendation.reason.map((reason, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-zinc-500">・</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">来店履歴</h2>
          <div className="space-y-4">
            {visitHistory.length > 0 ? (
              visitHistory.map((visit) => (
                <div
                  key={visit.id}
                  className="border-b border-zinc-800 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-white font-medium">来店</span>
                    <span className="text-zinc-400 text-sm">{visit.visitDate}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-zinc-400 text-sm">来店履歴がありません</p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">介入ログ</h2>
          {interventionHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800 border-b border-zinc-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300">
                      日付
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300">
                      タイプ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300">
                      アクション
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300">
                      ステータス
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300">
                      トレーナー
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {interventionHistory.map((intervention) => (
                    <tr
                      key={intervention.id}
                      className="hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-300 text-sm">
                        {intervention.createdAt}
                      </td>
                      <td className="px-4 py-3 text-white text-sm font-medium">
                        {intervention.type}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-sm">
                        {intervention.action || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-green-400 text-xs font-medium">
                          {intervention.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-300 text-sm">
                        {intervention.trainer || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-zinc-400 text-sm">介入履歴がありません</p>
          )}
        </div>
      </div>
    </div>
  );
}
