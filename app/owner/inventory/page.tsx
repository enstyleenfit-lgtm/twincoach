import { getCurrentStoreIdFromCookies } from "@/lib/authz/storeContext";
import {
  getInventoryByStore,
  getOrdersByStore,
  getStoreInventorySummaries,
} from "@/lib/inventoryMockData";
import { OwnerInventoryClient } from "./OwnerInventoryClient";

export default async function OwnerInventoryPage() {
  const storeId = (await getCurrentStoreIdFromCookies()) ?? "ningyocho";
  const summary = getStoreInventorySummaries().find((s) => s.storeId === storeId);
  const inventory = getInventoryByStore(storeId);
  const orders = getOrdersByStore(storeId);

  return (
    <OwnerInventoryClient
      storeId={storeId}
      storeName={summary?.storeName ?? storeId}
      inventory={inventory}
      orders={orders}
    />
  );
}
