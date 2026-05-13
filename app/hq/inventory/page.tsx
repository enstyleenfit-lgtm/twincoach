import {
  getStoreInventorySummaries,
  getAllInventory,
  getAllOrders,
} from "@/lib/inventoryMockData";
import { HQInventoryClient } from "./HQInventoryClient";

export default function HQInventoryPage() {
  const summaries = getStoreInventorySummaries();
  const allInventory = getAllInventory();
  const allOrders = getAllOrders();
  return (
    <HQInventoryClient
      summaries={summaries}
      allInventory={allInventory}
      allOrders={allOrders}
    />
  );
}
