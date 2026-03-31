import type { SuccessSessionAnalysis } from "@/types";

type Props = {
  analysis: SuccessSessionAnalysis;
  /** 取り込みセッションを加味した分析である旨 */
  sessionEnhanced?: boolean;
  /** 親カード内に置くとき true（外枠の背景・枠線を付けない） */
  embedInCard?: boolean;
  patternsHeading?: string;
  traitsHeading?: string;
  actionsHeading?: string;
};

export function SuccessSessionAnalysisPanel({
  analysis,
  sessionEnhanced,
  embedInCard,
  patternsHeading = "継続会員に共通する特徴 Top3",
  traitsHeading = "成功セッションの特徴 Top3",
  actionsHeading = "現場で真似すべきアクション",
}: Props) {
  const inner = (
    <>
      {sessionEnhanced && (
        <p className="text-xs text-emerald-700/90 mb-4">
          /import で取り込んだセッション履歴を加えて再計算しています
        </p>
      )}
      {analysis.commonPatterns.length === 0 ? (
        <p className="text-slate-600 text-sm">分析対象データが不足しています</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`lg:col-span-2 ${embedInCard ? "space-y-2" : "space-y-3"}`}>
            <h3 className="text-sm font-semibold text-green-300">{patternsHeading}</h3>
            {analysis.commonPatterns.map((pattern) => (
              <div
                key={pattern.title}
                className="bg-slate-50 border border-green-500/25 rounded-lg p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-900 font-medium text-sm">{pattern.title}</span>
                  <span className="text-green-300 text-xs font-semibold">{pattern.impactScore}</span>
                </div>
                <p className="mt-1 text-slate-600 text-xs">{pattern.description}</p>
              </div>
            ))}
          </div>
          <div className={embedInCard ? "space-y-2" : "space-y-3"}>
            <h3 className="text-sm font-semibold text-emerald-800">{traitsHeading}</h3>
            {analysis.highPerformingSessionTraits.map((trait) => (
              <div
                key={trait.trait}
                className="bg-slate-50 border border-emerald-500/25 rounded-lg p-3"
              >
                <div className="text-slate-900 text-sm font-medium">{trait.trait}</div>
                <p className="mt-1 text-slate-600 text-xs">{trait.description}</p>
              </div>
            ))}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-slate-700 text-xs font-semibold mb-2">{actionsHeading}</div>
              <ul className="space-y-1">
                {analysis.recommendedActions.map((item, idx) => (
                  <li key={idx} className="text-slate-600 text-xs">
                    ・{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (embedInCard) {
    return inner;
  }

  return <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">{inner}</div>;
}
