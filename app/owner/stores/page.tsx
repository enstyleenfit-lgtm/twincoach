import { memberRepository } from "@/lib/repositories";
import { getStoreSummaries } from "@/lib/storeSummary";
import { getPriorityQueue } from "@/lib/priorityQueue";
import { OWNER_STORE_IDS, getTrialStoreNameForData } from "@/lib/trialStore";
import OwnerStoresClient from "./OwnerStoresClient";

export default async function OwnerStoresPage() {
  const storeDataList = await Promise.all(
    OWNER_STORE_IDS.map(async (storeId) => {
      const storeNameForData = getTrialStoreNameForData(storeId);
      const members = await memberRepository.getAllForStore(storeNameForData);
      const storeName = members[0]?.storeName ?? storeNameForData;
      const summaries = getStoreSummaries(members);
      const summary = summaries.find((s) => s.storeName === storeName) ?? {
        storeName,
        totalMembers: 0,
        highRiskMembers: 0,
        monthlyRevenue: 0,
        estimatedRetentionRate: 0,
      };
      return {
        storeId,
        storeName,
        totalMembers: summary.totalMembers,
        highRiskMembers: summary.highRiskMembers,
        interventionCount: getPriorityQueue(members).length,
        monthlyRevenue: summary.monthlyRevenue,
        estimatedRetentionRate: summary.estimatedRetentionRate,
      };
    })
  );

  return <OwnerStoresClient stores={storeDataList} />;
}
