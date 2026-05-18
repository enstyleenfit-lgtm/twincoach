import {
  getStoreRevenueById,
  getMemberPaymentsByStore,
  BILLING_DISPLAY_MONTH,
} from "@/lib/financialMockData";
import { OWNER_STORE_IDS } from "@/lib/trialStore";
import { OwnerBillingClient } from "./OwnerBillingClient";

export default async function OwnerBillingPage() {
  const storeRevenues = OWNER_STORE_IDS
    .map((id) => getStoreRevenueById(id))
    .filter((r): r is NonNullable<typeof r> => r !== undefined);

  const memberPayments = OWNER_STORE_IDS.flatMap((id) => getMemberPaymentsByStore(id));

  return (
    <OwnerBillingClient
      storeRevenues={storeRevenues}
      memberPayments={memberPayments}
      displayMonth={BILLING_DISPLAY_MONTH}
    />
  );
}
