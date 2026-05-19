import {
  getRequestsByStore,
  getApplicationsByStore,
  getOpenRequests,
} from "@/lib/helpBoardMockData";
import { OWNER_STORE_IDS, getTrialStoreNameForData } from "@/lib/trialStore";
import { OwnerHelpBoardClient } from "./OwnerHelpBoardClient";

export default async function OwnerHelpBoardPage() {
  const ownerStoreIdSet = new Set(OWNER_STORE_IDS);

  const stores = OWNER_STORE_IDS.map((storeId) => {
    const requests = getRequestsByStore(storeId);
    const applications = getApplicationsByStore(storeId);
    const storeName = requests[0]?.storeName ?? getTrialStoreNameForData(storeId);
    return { storeId, storeName, requests, applications };
  });

  const otherOpenRequests = getOpenRequests().filter(
    (r) => !ownerStoreIdSet.has(r.storeId)
  );

  return (
    <OwnerHelpBoardClient stores={stores} otherOpenRequests={otherOpenRequests} />
  );
}
