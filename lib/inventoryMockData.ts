/**
 * 在庫管理デモデータ（モック）。
 * 実在庫管理APIは呼ばず、将来の hacomono / 外部WMS 連携を想定した型設計。
 */

export type ProductCategory = "protein" | "supplement" | "consumable";
export type OrderStatus = "requested" | "approved" | "shipped" | "received";
export type InventorySource = "manual" | "hacomono" | "external_wms";

export type InventoryItem = {
  itemId: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  storeId: string;
  storeName: string;
  stockQuantity: number;
  minStockThreshold: number;
  unit: string;
  source: InventorySource;
  lastUpdated: string;
};

export type PurchaseOrder = {
  orderId: string;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  requestedQuantity: number;
  unit: string;
  status: OrderStatus;
  requestedAt: string;
  requestedBy: string;
  note?: string;
};

export type StoreInventorySummary = {
  storeId: string;
  storeName: string;
  totalItems: number;
  lowStockCount: number;
  pendingOrderCount: number;
};

export function isLowStock(item: InventoryItem): boolean {
  return item.stockQuantity <= item.minStockThreshold;
}

const INVENTORY_ITEMS: InventoryItem[] = [
  // 人形町店
  { itemId: "i-nc-p001", productId: "p001", productName: "ホエイプロテイン バニラ", category: "protein",    storeId: "ningyocho",    storeName: "人形町店",     stockQuantity: 12, minStockThreshold: 5,  unit: "袋", source: "manual", lastUpdated: "2026-05-10" },
  { itemId: "i-nc-p002", productId: "p002", productName: "ホエイプロテイン チョコ", category: "protein",    storeId: "ningyocho",    storeName: "人形町店",     stockQuantity:  3, minStockThreshold: 5,  unit: "袋", source: "manual", lastUpdated: "2026-05-10" },
  { itemId: "i-nc-p003", productId: "p003", productName: "BCAA",                   category: "supplement", storeId: "ningyocho",    storeName: "人形町店",     stockQuantity:  8, minStockThreshold: 4,  unit: "本", source: "manual", lastUpdated: "2026-05-10" },
  { itemId: "i-nc-p004", productId: "p004", productName: "マルチビタミン",           category: "supplement", storeId: "ningyocho",    storeName: "人形町店",     stockQuantity:  2, minStockThreshold: 4,  unit: "本", source: "manual", lastUpdated: "2026-05-10" },
  { itemId: "i-nc-p005", productId: "p005", productName: "消毒液",                  category: "consumable", storeId: "ningyocho",    storeName: "人形町店",     stockQuantity: 15, minStockThreshold: 3,  unit: "本", source: "manual", lastUpdated: "2026-05-10" },

  // 水天宮前店
  { itemId: "i-su-p001", productId: "p001", productName: "ホエイプロテイン バニラ", category: "protein",    storeId: "suitengumae",  storeName: "水天宮前店",   stockQuantity:  8, minStockThreshold: 5,  unit: "袋", source: "manual", lastUpdated: "2026-05-09" },
  { itemId: "i-su-p002", productId: "p002", productName: "ホエイプロテイン チョコ", category: "protein",    storeId: "suitengumae",  storeName: "水天宮前店",   stockQuantity:  5, minStockThreshold: 5,  unit: "袋", source: "manual", lastUpdated: "2026-05-09" },
  { itemId: "i-su-p003", productId: "p003", productName: "BCAA",                   category: "supplement", storeId: "suitengumae",  storeName: "水天宮前店",   stockQuantity:  3, minStockThreshold: 4,  unit: "本", source: "manual", lastUpdated: "2026-05-09" },
  { itemId: "i-su-p004", productId: "p004", productName: "マルチビタミン",           category: "supplement", storeId: "suitengumae",  storeName: "水天宮前店",   stockQuantity:  7, minStockThreshold: 4,  unit: "本", source: "manual", lastUpdated: "2026-05-09" },
  { itemId: "i-su-p005", productId: "p005", productName: "消毒液",                  category: "consumable", storeId: "suitengumae",  storeName: "水天宮前店",   stockQuantity: 10, minStockThreshold: 3,  unit: "本", source: "manual", lastUpdated: "2026-05-09" },

  // 渋谷店
  { itemId: "i-sb-p001", productId: "p001", productName: "ホエイプロテイン バニラ", category: "protein",    storeId: "shibuya",      storeName: "渋谷店",       stockQuantity: 15, minStockThreshold: 8,  unit: "袋", source: "manual", lastUpdated: "2026-05-11" },
  { itemId: "i-sb-p002", productId: "p002", productName: "ホエイプロテイン チョコ", category: "protein",    storeId: "shibuya",      storeName: "渋谷店",       stockQuantity:  6, minStockThreshold: 8,  unit: "袋", source: "manual", lastUpdated: "2026-05-11" },
  { itemId: "i-sb-p003", productId: "p003", productName: "BCAA",                   category: "supplement", storeId: "shibuya",      storeName: "渋谷店",       stockQuantity: 12, minStockThreshold: 6,  unit: "本", source: "manual", lastUpdated: "2026-05-11" },
  { itemId: "i-sb-p004", productId: "p004", productName: "マルチビタミン",           category: "supplement", storeId: "shibuya",      storeName: "渋谷店",       stockQuantity:  3, minStockThreshold: 5,  unit: "本", source: "manual", lastUpdated: "2026-05-11" },
  { itemId: "i-sb-p005", productId: "p005", productName: "消毒液",                  category: "consumable", storeId: "shibuya",      storeName: "渋谷店",       stockQuantity: 20, minStockThreshold: 5,  unit: "本", source: "manual", lastUpdated: "2026-05-11" },

  // 中野店
  { itemId: "i-nk-p001", productId: "p001", productName: "ホエイプロテイン バニラ", category: "protein",    storeId: "nakano",       storeName: "中野店",       stockQuantity:  5, minStockThreshold: 4,  unit: "袋", source: "manual", lastUpdated: "2026-05-08" },
  { itemId: "i-nk-p002", productId: "p002", productName: "ホエイプロテイン チョコ", category: "protein",    storeId: "nakano",       storeName: "中野店",       stockQuantity:  6, minStockThreshold: 4,  unit: "袋", source: "manual", lastUpdated: "2026-05-08" },
  { itemId: "i-nk-p003", productId: "p003", productName: "BCAA",                   category: "supplement", storeId: "nakano",       storeName: "中野店",       stockQuantity:  6, minStockThreshold: 3,  unit: "本", source: "manual", lastUpdated: "2026-05-08" },
  { itemId: "i-nk-p004", productId: "p004", productName: "マルチビタミン",           category: "supplement", storeId: "nakano",       storeName: "中野店",       stockQuantity:  5, minStockThreshold: 3,  unit: "本", source: "manual", lastUpdated: "2026-05-08" },
  { itemId: "i-nk-p005", productId: "p005", productName: "消毒液",                  category: "consumable", storeId: "nakano",       storeName: "中野店",       stockQuantity:  8, minStockThreshold: 2,  unit: "本", source: "manual", lastUpdated: "2026-05-08" },

  // 三軒茶屋本店
  { itemId: "i-sj-p001", productId: "p001", productName: "ホエイプロテイン バニラ", category: "protein",    storeId: "sangenjaya",   storeName: "三軒茶屋本店", stockQuantity:  4, minStockThreshold: 10, unit: "袋", source: "manual", lastUpdated: "2026-05-12" },
  { itemId: "i-sj-p002", productId: "p002", productName: "ホエイプロテイン チョコ", category: "protein",    storeId: "sangenjaya",   storeName: "三軒茶屋本店", stockQuantity:  8, minStockThreshold: 10, unit: "袋", source: "manual", lastUpdated: "2026-05-12" },
  { itemId: "i-sj-p003", productId: "p003", productName: "BCAA",                   category: "supplement", storeId: "sangenjaya",   storeName: "三軒茶屋本店", stockQuantity: 15, minStockThreshold: 8,  unit: "本", source: "manual", lastUpdated: "2026-05-12" },
  { itemId: "i-sj-p004", productId: "p004", productName: "マルチビタミン",           category: "supplement", storeId: "sangenjaya",   storeName: "三軒茶屋本店", stockQuantity:  2, minStockThreshold: 6,  unit: "本", source: "manual", lastUpdated: "2026-05-12" },
  { itemId: "i-sj-p005", productId: "p005", productName: "消毒液",                  category: "consumable", storeId: "sangenjaya",   storeName: "三軒茶屋本店", stockQuantity: 25, minStockThreshold: 5,  unit: "本", source: "manual", lastUpdated: "2026-05-12" },
];

const PURCHASE_ORDERS: PurchaseOrder[] = [
  { orderId: "o-001", storeId: "ningyocho",   storeName: "人形町店",     productId: "p002", productName: "ホエイプロテイン チョコ", requestedQuantity: 10, unit: "袋", status: "requested", requestedAt: "2026-05-13", requestedBy: "田中店長" },
  { orderId: "o-002", storeId: "ningyocho",   storeName: "人形町店",     productId: "p004", productName: "マルチビタミン",           requestedQuantity:  5, unit: "本", status: "approved",  requestedAt: "2026-05-12", requestedBy: "田中店長",  note: "本部承認済み。今週中に納品予定。" },
  { orderId: "o-003", storeId: "suitengumae", storeName: "水天宮前店",   productId: "p002", productName: "ホエイプロテイン チョコ", requestedQuantity:  8, unit: "袋", status: "shipped",   requestedAt: "2026-05-10", requestedBy: "佐々木店長", note: "発送済み。2026-05-15着予定。" },
  { orderId: "o-004", storeId: "suitengumae", storeName: "水天宮前店",   productId: "p003", productName: "BCAA",                   requestedQuantity:  8, unit: "本", status: "requested", requestedAt: "2026-05-13", requestedBy: "佐々木店長" },
  { orderId: "o-005", storeId: "shibuya",     storeName: "渋谷店",       productId: "p002", productName: "ホエイプロテイン チョコ", requestedQuantity: 12, unit: "袋", status: "requested", requestedAt: "2026-05-13", requestedBy: "山口店長" },
  { orderId: "o-006", storeId: "shibuya",     storeName: "渋谷店",       productId: "p004", productName: "マルチビタミン",           requestedQuantity:  6, unit: "本", status: "requested", requestedAt: "2026-05-13", requestedBy: "山口店長" },
  { orderId: "o-007", storeId: "sangenjaya",  storeName: "三軒茶屋本店", productId: "p001", productName: "ホエイプロテイン バニラ", requestedQuantity: 15, unit: "袋", status: "approved",  requestedAt: "2026-05-11", requestedBy: "川村店長",  note: "大口発注。本部承認済み。" },
  { orderId: "o-008", storeId: "sangenjaya",  storeName: "三軒茶屋本店", productId: "p002", productName: "ホエイプロテイン チョコ", requestedQuantity: 15, unit: "袋", status: "received",  requestedAt: "2026-05-07", requestedBy: "川村店長",  note: "受領完了。" },
  { orderId: "o-009", storeId: "sangenjaya",  storeName: "三軒茶屋本店", productId: "p004", productName: "マルチビタミン",           requestedQuantity:  8, unit: "本", status: "requested", requestedAt: "2026-05-13", requestedBy: "川村店長" },
];

export function getAllInventory(): InventoryItem[] {
  return INVENTORY_ITEMS;
}

export function getInventoryByStore(storeId: string): InventoryItem[] {
  return INVENTORY_ITEMS.filter((i) => i.storeId === storeId);
}

export function getLowStockByStore(storeId: string): InventoryItem[] {
  return getInventoryByStore(storeId).filter(isLowStock);
}

export function getAllOrders(): PurchaseOrder[] {
  return PURCHASE_ORDERS;
}

export function getOrdersByStore(storeId: string): PurchaseOrder[] {
  return PURCHASE_ORDERS.filter((o) => o.storeId === storeId);
}

export function getStoreInventorySummaries(): StoreInventorySummary[] {
  const storeIds = [...new Set(INVENTORY_ITEMS.map((i) => i.storeId))];
  return storeIds.map((storeId) => {
    const items = getInventoryByStore(storeId);
    const orders = getOrdersByStore(storeId);
    return {
      storeId,
      storeName: items[0]?.storeName ?? storeId,
      totalItems: items.length,
      lowStockCount: items.filter(isLowStock).length,
      pendingOrderCount: orders.filter(
        (o) => o.status === "requested" || o.status === "approved" || o.status === "shipped"
      ).length,
    };
  });
}

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  protein: "プロテイン",
  supplement: "サプリ",
  consumable: "消耗品",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  requested: "申請中",
  approved: "承認済み",
  shipped: "発送済み",
  received: "受領済み",
};
