import {
  getInventoryByStore,
  getOrdersByStore,
  getStoreInventorySummaries,
} from "@/lib/inventoryMockData";
import { OWNER_STORE_IDS } from "@/lib/trialStore";
import { OwnerInventoryClient } from "./OwnerInventoryClient";

export default async function OwnerInventoryPage() {
  const summaries = getStoreInventorySummaries();

  const stores = OWNER_STORE_IDS.map((storeId) => ({
    storeId,
    storeName: summaries.find((s) => s.storeId === storeId)?.storeName ?? storeId,
    inventory: getInventoryByStore(storeId),
    orders: getOrdersByStore(storeId),
  }));

  return <OwnerInventoryClient stores={stores} />;
}
