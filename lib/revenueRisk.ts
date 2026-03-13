import { Member } from "@/types";

export interface RevenueRisk {
  monthlyRevenue: number;
  annualRevenueAtRisk: number;
}

function estimateMonthlyRevenueFromPlan(plan: string): number {
  // プラン名からの簡易推定（将来プランマスタと連動させてもよい）
  if (plan.includes("無制限")) return 39800;
  if (plan.includes("デュアル月8")) return 33000;
  if (plan.includes("ピラティス月8")) return 36000;
  if (plan.includes("ピラティス月4")) return 28000;
  if (plan.includes("トレーニング月8")) return 26000;
  if (plan.includes("トレーニング月4")) return 16000;

  // 既存の英語プラン名に対するデフォルト
  if (plan === "Premium") return 39800;
  if (plan === "Standard") return 26000;
  if (plan === "Basic") return 16000;

  return 0;
}

export function getRevenueAtRisk(member: Member): RevenueRisk {
  const monthlyRevenue =
    member.monthlyRevenue ?? estimateMonthlyRevenueFromPlan(member.plan);

  return {
    monthlyRevenue,
    annualRevenueAtRisk: monthlyRevenue * 12,
  };
}




