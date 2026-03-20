import { StoreSummary } from "@/lib/storeSummary";

export interface StoreKpiTarget {
  storeName: string;
  targetRetentionRate: number; // %
  targetMonthlyRevenue: number;
  targetHighRiskMembersMax: number;
}

export interface StoreKpiGap {
  retentionGap: number;
  revenueGap: number;
  highRiskGap: number;
  membersToSave: number;
  revenueToProtect: number;
}

// 店舗ごとの仮KPI目標値（モック）
export function getStoreKpiTargets(): StoreKpiTarget[] {
  return [
    {
      storeName: "三軒茶屋本店",
      targetRetentionRate: 90,
      targetMonthlyRevenue: 70000,
      targetHighRiskMembersMax: 1,
    },
    {
      storeName: "人形町店",
      targetRetentionRate: 88,
      targetMonthlyRevenue: 30000,
      targetHighRiskMembersMax: 1,
    },
    {
      storeName: "水天宮前店",
      targetRetentionRate: 88,
      targetMonthlyRevenue: 20000,
      targetHighRiskMembersMax: 1,
    },
    {
      storeName: "中野店",
      targetRetentionRate: 85,
      targetMonthlyRevenue: 30000,
      targetHighRiskMembersMax: 1,
    },
    {
      storeName: "渋谷店",
      targetRetentionRate: 90,
      targetMonthlyRevenue: 50000,
      targetHighRiskMembersMax: 1,
    },
  ];
}

export function getKpiGap(
  summary: StoreSummary,
  target: StoreKpiTarget
): StoreKpiGap {
  const retentionGap = target.targetRetentionRate - summary.estimatedRetentionRate;
  const revenueGap = target.targetMonthlyRevenue - summary.monthlyRevenue;
  const highRiskGap = summary.highRiskMembers - target.targetHighRiskMembersMax;

  const safeMembers = summary.lowRiskMembers + summary.mediumRiskMembers;
  const targetSafeMembers = Math.ceil(
    (target.targetRetentionRate / 100) * summary.totalMembers
  );
  const membersToSave = Math.max(0, targetSafeMembers - safeMembers);

  const avgRevenuePerMember =
    summary.totalMembers > 0
      ? summary.monthlyRevenue / summary.totalMembers
      : 0;
  const revenueToProtect = Math.max(
    0,
    Math.round(membersToSave * avgRevenuePerMember)
  );

  return {
    retentionGap,
    revenueGap,
    highRiskGap,
    membersToSave,
    revenueToProtect,
  };
}








