import { getCurrentStoreIdFromCookies } from "@/lib/authz/storeContext";
import {
  getRequestsByStore,
  getOpenRequestsExcluding,
  getApplicationsByStore,
} from "@/lib/helpBoardMockData";
import { OwnerHelpBoardClient } from "./OwnerHelpBoardClient";

export default async function OwnerHelpBoardPage() {
  const storeId = (await getCurrentStoreIdFromCookies()) ?? "ningyocho";
  const ownRequests = getRequestsByStore(storeId);
  const otherOpenRequests = getOpenRequestsExcluding(storeId);
  const ownApplications = getApplicationsByStore(storeId);

  return (
    <OwnerHelpBoardClient
      storeId={storeId}
      ownRequests={ownRequests}
      otherOpenRequests={otherOpenRequests}
      ownApplications={ownApplications}
    />
  );
}
