import { Member } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";

export interface PriceRevisionImpact {
  targetMembers: Member[];
  highRiskTargetMembers: Member[];
  monthlyRevenueIncrease: number;
  monthlyRevenueAtRiskAfterRevision: number;
  estimatedProtectedRevenue: number;
}

/**
 * 価格改定影響を分析
 * @param members 会員リスト
 * @returns 価格改定影響の分析結果
 */
export function getPriceRevisionImpact(
  members: Member[]
): PriceRevisionImpact {
  // 価格改定対象会員を取得
  const targetMembers = members.filter(
    (member) => member.isPriceRevisionTarget === true
  );

  // 改定後のリスクスコアを計算（価格改定によりリスクが上がる可能性を考慮）
  // 簡易ロジック: 改定対象会員のリスクスコアを+10ポイント加算して評価
  const highRiskTargetMembers = targetMembers.filter((member) => {
    const riskResult = calculateRiskScore(member);
    // 価格改定によるリスク上昇を考慮（簡易的に+10ポイント）
    const adjustedRiskScore = Math.min(100, riskResult.score + 10);
    return adjustedRiskScore >= 70; // 高リスク判定
  });

  // 月間増収見込みを計算
  const monthlyRevenueIncrease = targetMembers.reduce((sum, member) => {
    const beforeRevenue =
      member.priceRevisionBeforeRevenue ?? member.monthlyRevenue ?? 0;
    const afterRevenue =
      member.priceRevisionAfterRevenue ?? member.monthlyRevenue ?? 0;
    return sum + (afterRevenue - beforeRevenue);
  }, 0);

  // 改定後高リスク会員の月間リスク売上
  const monthlyRevenueAtRiskAfterRevision = highRiskTargetMembers.reduce(
    (sum, member) => {
      const afterRevenue =
        member.priceRevisionAfterRevenue ?? member.monthlyRevenue ?? 0;
      return sum + afterRevenue;
    },
    0
  );

  // 守れた売上見込み（改定対象会員の改定後売上の合計から、高リスク会員の売上を引いたもの）
  const totalAfterRevenue = targetMembers.reduce((sum, member) => {
    const afterRevenue =
      member.priceRevisionAfterRevenue ?? member.monthlyRevenue ?? 0;
    return sum + afterRevenue;
  }, 0);
  const estimatedProtectedRevenue =
    totalAfterRevenue - monthlyRevenueAtRiskAfterRevision;

  return {
    targetMembers,
    highRiskTargetMembers,
    monthlyRevenueIncrease,
    monthlyRevenueAtRiskAfterRevision,
    estimatedProtectedRevenue,
  };
}








