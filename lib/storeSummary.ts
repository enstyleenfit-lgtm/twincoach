import { Member } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";
import { getRevenueAtRisk } from "@/lib/revenueRisk";

export interface StoreSummary {
  storeName: string;
  totalMembers: number;
  highRiskMembers: number;
  mediumRiskMembers: number;
  lowRiskMembers: number;
  monthlyRevenue: number;
  monthlyRevenueAtRisk: number;
  annualRevenueAtRisk: number;
  estimatedRetentionRate: number;
}

export function getStoreSummaries(members: Member[]): StoreSummary[] {
  const storeMap = new Map<string, StoreSummary>();

  for (const member of members) {
    const storeName = member.storeName || "店舗未設定";
    const risk = calculateRiskScore(member);
    const revenue = getRevenueAtRisk(member);

    if (!storeMap.has(storeName)) {
      storeMap.set(storeName, {
        storeName,
        totalMembers: 0,
        highRiskMembers: 0,
        mediumRiskMembers: 0,
        lowRiskMembers: 0,
        monthlyRevenue: 0,
        monthlyRevenueAtRisk: 0,
        annualRevenueAtRisk: 0,
        estimatedRetentionRate: 0,
      });
    }

    const summary = storeMap.get(storeName)!;

    summary.totalMembers += 1;
    summary.monthlyRevenue += revenue.monthlyRevenue;

    if (risk.level === "high") {
      summary.highRiskMembers += 1;
      summary.monthlyRevenueAtRisk += revenue.monthlyRevenue;
    } else if (risk.level === "medium") {
      summary.mediumRiskMembers += 1;
    } else {
      summary.lowRiskMembers += 1;
    }
  }

  for (const summary of storeMap.values()) {
    summary.annualRevenueAtRisk = summary.monthlyRevenueAtRisk * 12;
    if (summary.totalMembers > 0) {
      const safeMembers = summary.lowRiskMembers + summary.mediumRiskMembers;
      summary.estimatedRetentionRate = (safeMembers / summary.totalMembers) * 100;
    } else {
      summary.estimatedRetentionRate = 0;
    }
  }

  return Array.from(storeMap.values());
}








