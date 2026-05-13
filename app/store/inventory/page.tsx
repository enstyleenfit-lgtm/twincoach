import { getCurrentStoreIdFromCookies } from "@/lib/authz/storeContext";
import {
  getInventoryByStore,
  getOrdersByStore,
  getStoreInventorySummaries,
} from "@/lib/inventoryMockData";
import { StoreInventoryClient } from "./StoreInventoryClient";

export default async function StoreInventoryPage() {
  const storeId = (await getCurrentStoreIdFromCookies()) ?? "ningyocho";
  const summary = getStoreInventorySummaries().find((s) => s.storeId === storeId);
  const inventory = getInventoryByStore(storeId);
  const orders = getOrdersByStore(storeId);

  return (
    <StoreInventoryClient
      storeId={storeId}
      storeName={summary?.storeName ?? storeId}
      inventory={inventory}
      orders={orders}
    />
  );
}
