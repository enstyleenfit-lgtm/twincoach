import { getStoreRevenues, getUnpaidAndOverdueMembers } from "@/lib/financialMockData";
import { HQBillingClient } from "./HQBillingClient";

export default function HQBillingPage() {
  const storeRevenues = getStoreRevenues();
  const unpaidMembers = getUnpaidAndOverdueMembers();
  return <HQBillingClient storeRevenues={storeRevenues} unpaidMembers={unpaidMembers} />;
}
