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
        <p className="text-xs text-emerald-400/90 mb-4">
          /import で取り込んだセッション履歴を加えて再計算しています
        </p>
      )}
      {analysis.commonPatterns.length === 0 ? (
        <p className="text-zinc-400 text-sm">分析対象データが不足しています</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`lg:col-span-2 ${embedInCard ? "space-y-2" : "space-y-3"}`}>
            <h3 className="text-sm font-semibold text-green-300">{patternsHeading}</h3>
            {analysis.commonPatterns.map((pattern) => (
              <div
                key={pattern.title}
                className="bg-zinc-950 border border-green-500/25 rounded-lg p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-100 font-medium text-sm">{pattern.title}</span>
                  <span className="text-green-300 text-xs font-semibold">{pattern.impactScore}</span>
                </div>
                <p className="mt-1 text-zinc-400 text-xs">{pattern.description}</p>
              </div>
            ))}
          </div>
          <div className={embedInCard ? "space-y-2" : "space-y-3"}>
            <h3 className="text-sm font-semibold text-emerald-300">{traitsHeading}</h3>
            {analysis.highPerformingSessionTraits.map((trait) => (
              <div
                key={trait.trait}
                className="bg-zinc-950 border border-emerald-500/25 rounded-lg p-3"
              >
                <div className="text-zinc-100 text-sm font-medium">{trait.trait}</div>
                <p className="mt-1 text-zinc-400 text-xs">{trait.description}</p>
              </div>
            ))}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
              <div className="text-zinc-300 text-xs font-semibold mb-2">{actionsHeading}</div>
              <ul className="space-y-1">
                {analysis.recommendedActions.map((item, idx) => (
                  <li key={idx} className="text-zinc-400 text-xs">
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

  return <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">{inner}</div>;
}
