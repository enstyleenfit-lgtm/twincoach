import { getCurrentStoreIdFromCookies } from "@/lib/authz/storeContext";
import {
  getRequestsByStore,
  getOpenRequestsExcluding,
  getApplicationsByStore,
} from "@/lib/helpBoardMockData";
import { StoreHelpBoardClient } from "./StoreHelpBoardClient";

export default async function StoreHelpBoardPage() {
  const storeId = (await getCurrentStoreIdFromCookies()) ?? "ningyocho";
  const ownRequests = getRequestsByStore(storeId);
  const otherOpenRequests = getOpenRequestsExcluding(storeId);
  const ownApplications = getApplicationsByStore(storeId);

  return (
    <StoreHelpBoardClient
      storeId={storeId}
      ownRequests={ownRequests}
      otherOpenRequests={otherOpenRequests}
      ownApplications={ownApplications}
    />
  );
}
