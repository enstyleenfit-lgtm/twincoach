import { getRevenueRiskForecast } from "@/lib/revenueForecast";
import type { Member } from "@/types";

export interface StoreRevenueRiskSummary {
  storeName: string;
  expectedLoss30Days: number;
  expectedLoss60Days: number;
}

export function getStoreRevenueRiskSummaries(members: Member[]): StoreRevenueRiskSummary[] {
  const map = new Map<string, StoreRevenueRiskSummary>();

  for (const member of members) {
    const storeName = member.storeName || "店舗未設定";
    const forecast = getRevenueRiskForecast(member);

    if (!map.has(storeName)) {
      map.set(storeName, {
        storeName,
        expectedLoss30Days: 0,
        expectedLoss60Days: 0,
      });
    }

    const row = map.get(storeName)!;
    row.expectedLoss30Days += forecast.expectedLoss30Days;
    row.expectedLoss60Days += forecast.expectedLoss60Days;
  }

  return Array.from(map.values());
}
