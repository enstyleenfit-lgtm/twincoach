"use client";

import { Fragment, useState } from "react";
import type { InventoryItem, PurchaseOrder } from "@/lib/inventoryMockData";
import { isLowStock, CATEGORY_LABEL, ORDER_STATUS_LABEL } from "@/lib/inventoryMockData";

type Props = {
  storeId: string;
  storeName: string;
  inventory: InventoryItem[];
  orders: PurchaseOrder[];
};

function OrderStatusBadge({ status }: { status: PurchaseOrder["status"] }) {
  const styles: Record<PurchaseOrder["status"], string> = {
    requested: "bg-amber-50 text-amber-700 ring-amber-600/20",
    approved:  "bg-blue-50  text-blue-700  ring-blue-600/20",
    shipped:   "bg-violet-50 text-violet-700 ring-violet-600/20",
    received:  "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function StoreInventoryClient({ storeId, storeName, inventory, orders }: Props) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const lowStockItems = inventory.filter(isLowStock);
  const pendingOrders = orders.filter(
    (o) => o.status === "requested" || o.status === "approved" || o.status === "shipped"
  );

  const getOrdersForProduct = (productId: string) =>
    orders.filter((o) => o.productId === productId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">在庫管理</h1>
        <p className="mt-1 text-sm text-slate-500">{storeName}</p>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">管理品目数</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{inventory.length}品目</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">不足アラート</p>
          <p className={`mt-2 text-2xl font-bold ${lowStockItems.length > 0 ? "text-red-600" : "text-slate-400"}`}>
            {lowStockItems.length}品目
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">発注対応中</p>
          <p className={`mt-2 text-2xl font-bold ${pendingOrders.length > 0 ? "text-blue-600" : "text-slate-400"}`}>
            {pendingOrders.length}件
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">発注総数</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{orders.length}件</p>
        </div>
      </div>

      {/* Alert banner */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0 text-red-500">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-700">在庫不足：発注確認が必要です</p>
            <ul className="mt-1 space-y-0.5">
              {lowStockItems.map((item) => (
                <li key={item.itemId} className="text-xs text-red-600">
                  {item.productName}（残 {item.stockQuantity}{item.unit} / 基準 {item.minStockThreshold}{item.unit}）
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Inventory table */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          在庫一覧
          <span className="ml-2 text-xs font-normal text-slate-400">タップで発注状況を確認</span>
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600">商品名</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600">カテゴリ</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600">在庫</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600">基準</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((item) => {
                const low = isLowStock(item);
                const isExpanded = expandedItemId === item.itemId;
                const productOrders = getOrdersForProduct(item.productId);

                return (
                  <Fragment key={item.itemId}>
                    <tr
                      onClick={() => setExpandedItemId((prev) => prev === item.itemId ? null : item.itemId)}
                      className={`cursor-pointer transition-colors ${low ? "bg-red-50/50" : ""} ${isExpanded ? "bg-slate-50" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <svg
                            width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden
                            className={`shrink-0 transition-transform ${isExpanded ? "rotate-90 text-slate-700" : "text-slate-400"}`}
                          >
                            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className={`text-sm font-medium ${low ? "text-red-700" : "text-slate-900"}`}>
                            {item.productName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-500">{CATEGORY_LABEL[item.category]}</td>
                      <td className={`px-4 py-3.5 text-right text-sm font-semibold tabular-nums ${low ? "text-red-600" : "text-slate-900"}`}>
                        {item.stockQuantity}{item.unit}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-slate-400">
                        {item.minStockThreshold}{item.unit}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={4} className="bg-slate-50 px-4 pb-4 pt-0">
                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="mb-3 text-xs font-semibold text-slate-600">発注申請履歴</p>
                            {productOrders.length === 0 ? (
                              <p className="text-xs text-slate-400">発注履歴はありません。</p>
                            ) : (
                              <div className="space-y-2">
                                {productOrders.map((o) => (
                                  <div key={o.orderId} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 px-3 py-2.5">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">{o.requestedQuantity} {o.unit}</p>
                                      <p className="text-xs text-slate-400">{o.requestedAt} · {o.requestedBy}</p>
                                      {o.note && <p className="mt-0.5 text-xs text-slate-500">{o.note}</p>}
                                    </div>
                                    <OrderStatusBadge status={o.status} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending orders */}
      {pendingOrders.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">発注対応中</h2>
          <div className="space-y-2">
            {pendingOrders.map((o) => (
              <div key={o.orderId} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div>
                  <p className="text-sm font-medium text-slate-900">{o.productName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {o.requestedQuantity} {o.unit} · {o.requestedAt} · {o.requestedBy}
                  </p>
                  {o.note && <p className="mt-1 text-xs text-slate-400">{o.note}</p>}
                </div>
                <OrderStatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
