import { Member } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";
import { getRevenueAtRisk } from "@/lib/revenueRisk";

export interface TrainerMetrics {
  trainerName: string;
  totalMembers: number;
  highRiskMembers: number;
  mediumRiskMembers: number;
  lowRiskMembers: number;
  estimatedRetentionRate: number;
  monthlyRevenue: number;
  annualRevenueAtRisk: number;
}

export function getTrainerMetrics(members: Member[]): TrainerMetrics[] {
  const trainerMap = new Map<string, TrainerMetrics>();

  for (const member of members) {
    const trainerName = member.assignedTrainer || "未割り当て";
    const risk = calculateRiskScore(member);
    const revenue = getRevenueAtRisk(member);

    if (!trainerMap.has(trainerName)) {
      trainerMap.set(trainerName, {
        trainerName,
        totalMembers: 0,
        highRiskMembers: 0,
        mediumRiskMembers: 0,
        lowRiskMembers: 0,
        monthlyRevenue: 0,
        annualRevenueAtRisk: 0,
        estimatedRetentionRate: 0,
      });
    }

    const metrics = trainerMap.get(trainerName)!;

    metrics.totalMembers += 1;
    metrics.monthlyRevenue += revenue.monthlyRevenue;

    if (risk.level === "high") {
      metrics.highRiskMembers += 1;
      metrics.annualRevenueAtRisk += revenue.annualRevenueAtRisk;
    } else if (risk.level === "medium") {
      metrics.mediumRiskMembers += 1;
    } else {
      metrics.lowRiskMembers += 1;
    }
  }

  for (const metrics of trainerMap.values()) {
    if (metrics.totalMembers > 0) {
      const safeMembers = metrics.lowRiskMembers + metrics.mediumRiskMembers;
      metrics.estimatedRetentionRate = (safeMembers / metrics.totalMembers) * 100;
    } else {
      metrics.estimatedRetentionRate = 0;
    }
  }

  // 年間リスク売上が高い順にソート
  return Array.from(trainerMap.values()).sort(
    (a, b) => b.annualRevenueAtRisk - a.annualRevenueAtRisk
  );
}



