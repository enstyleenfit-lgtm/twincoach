import { getCurrentStoreIdFromCookies } from "@/lib/authz/storeContext";
import {
  getStoreRevenueById,
  getMemberPaymentsByStore,
  BILLING_DISPLAY_MONTH,
} from "@/lib/financialMockData";
import { OwnerBillingClient } from "./OwnerBillingClient";

export default async function OwnerBillingPage() {
  const storeId = (await getCurrentStoreIdFromCookies()) ?? "ningyocho";
  const storeRevenue = getStoreRevenueById(storeId);
  const memberPayments = getMemberPaymentsByStore(storeId);

  return (
    <OwnerBillingClient
      storeRevenue={storeRevenue}
      memberPayments={memberPayments}
      displayMonth={BILLING_DISPLAY_MONTH}
    />
  );
}
