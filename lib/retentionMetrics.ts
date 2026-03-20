import { Member } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";

export interface RetentionMetrics {
  activeMembers: number;
  highRiskMembers: number;
  mediumRiskMembers: number;
  lowRiskMembers: number;
  estimatedRetentionRate: number;
}

/**
 * 会員リストから継続率メトリクスを計算
 * @param members 会員リスト
 * @returns 継続率メトリクス
 */
export function calculateRetentionMetrics(
  members: Member[]
): RetentionMetrics {
  const totalMembers = members.length;
  
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;

  members.forEach((member) => {
    const riskResult = calculateRiskScore(member);
    switch (riskResult.level) {
      case "high":
        highRiskCount++;
        break;
      case "medium":
        mediumRiskCount++;
        break;
      case "low":
        lowRiskCount++;
        break;
    }
  });

  // Active Members: low + medium リスクの会員（継続見込みが高い）
  const activeMembers = lowRiskCount + mediumRiskCount;

  // Estimated Retention Rate: 全会員数に対する low + medium 会員比率
  // 簡易計算として、low + medium 会員の割合を継続率として見積もる
  const estimatedRetentionRate =
    totalMembers > 0
      ? Math.round(((lowRiskCount + mediumRiskCount) / totalMembers) * 100)
      : 0;

  return {
    activeMembers,
    highRiskMembers: highRiskCount,
    mediumRiskMembers: mediumRiskCount,
    lowRiskMembers: lowRiskCount,
    estimatedRetentionRate,
  };
}







