"use client";

import { useState } from "react";
import type {
  StoreInventorySummary,
  InventoryItem,
  PurchaseOrder,
} from "@/lib/inventoryMockData";
import {
  isLowStock,
  getInventoryByStore,
  CATEGORY_LABEL,
  ORDER_STATUS_LABEL,
} from "@/lib/inventoryMockData";

type Props = {
  summaries: StoreInventorySummary[];
  allInventory: InventoryItem[];
  allOrders: PurchaseOrder[];
};

function StockBadge({ low }: { low: boolean }) {
  if (low) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
        不足
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      適正
    </span>
  );
}

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

export function HQInventoryClient({ summaries, allInventory, allOrders }: Props) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [localOrders, setLocalOrders] = useState<PurchaseOrder[]>(allOrders);

  const alertStoreCount = summaries.filter((s) => s.lowStockCount > 0).length;
  const pendingOrderCount = localOrders.filter(
    (o) => o.status === "requested" || o.status === "approved"
  ).length;
  const totalLowStockItems = summaries.reduce((s, r) => s + r.lowStockCount, 0);
  const totalOrderCount = localOrders.length;

  const selectedSummary = selectedStoreId
    ? summaries.find((s) => s.storeId === selectedStoreId) ?? null
    : null;
  const detailItems = selectedStoreId ? getInventoryByStore(selectedStoreId) : [];
  const detailOrders = selectedStoreId
    ? localOrders.filter((o) => o.storeId === selectedStoreId)
    : [];

  const pendingOrders = localOrders.filter(
    (o) => o.status === "requested" || o.status === "approved" || o.status === "shipped"
  );

  const handleApprove = (orderId: string) => {
    setLocalOrders((prev) =>
      prev.map((o): PurchaseOrder =>
        o.orderId === orderId ? { ...o, status: "approved" } : o
      )
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">在庫管理</h1>
        <p className="mt-1 text-sm text-slate-500">全店舗の在庫・発注状況</p>
      </div>

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">在庫不足の店舗</p>
          <p className={`mt-2 text-2xl font-bold ${alertStoreCount > 0 ? "text-red-600" : "text-slate-400"}`}>
            {alertStoreCount}店舗
          </p>
          <p className="mt-1 text-xs text-slate-400">全{summaries.length}店舗中</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">不足品目（全店舗計）</p>
          <p className={`mt-2 text-2xl font-bold ${totalLowStockItems > 0 ? "text-amber-600" : "text-slate-400"}`}>
            {totalLowStockItems}品目
          </p>
          <p className="mt-1 text-xs text-slate-400">要発注対応</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">承認待ち発注</p>
          <p className={`mt-2 text-2xl font-bold ${pendingOrderCount > 0 ? "text-blue-600" : "text-slate-400"}`}>
            {pendingOrderCount}件
          </p>
          <p className="mt-1 text-xs text-slate-400">申請中・承認済み</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">発注申請総数</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalOrderCount}件</p>
          <p className="mt-1 text-xs text-slate-400">全ステータス合計</p>
        </div>
      </div>

      {/* Store summary table */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">店舗別在庫状況</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">店舗名</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">管理品目数</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">在庫不足</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">発注対応中</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600">状態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((s) => {
                  const isSelected = selectedStoreId === s.storeId;
                  return (
                    <tr
                      key={s.storeId}
                      onClick={() => setSelectedStoreId((prev) => prev === s.storeId ? null : s.storeId)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-slate-100" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <svg
                            width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden
                            className={`shrink-0 transition-transform ${isSelected ? "rotate-90 text-slate-700" : "text-slate-400"}`}
                          >
                            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="font-medium text-slate-900">{s.storeName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-slate-600">{s.totalItems}品目</td>
                      <td className="px-5 py-4 text-right text-sm">
                        {s.lowStockCount > 0 ? (
                          <span className="font-semibold text-red-600">{s.lowStockCount}品目</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-slate-600">
                        {s.pendingOrderCount > 0 ? `${s.pendingOrderCount}件` : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {s.lowStockCount > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                            要対応
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            正常
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Store detail panel */}
        {selectedSummary && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">
              {selectedSummary.storeName} — 在庫一覧
            </h3>
            <div className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">商品名</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">カテゴリ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">在庫数</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">発注基準</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">状態</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">最終更新</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailItems.map((item) => {
                    const low = isLowStock(item);
                    return (
                      <tr key={item.itemId} className={low ? "bg-red-50/40" : "hover:bg-slate-50"}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.productName}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{CATEGORY_LABEL[item.category]}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                          {item.stockQuantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-500">
                          {item.minStockThreshold} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StockBadge low={low} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">{item.lastUpdated}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {detailOrders.length > 0 && (
              <>
                <h4 className="mb-3 text-xs font-semibold text-slate-600">発注申請履歴</h4>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">商品名</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">発注数</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">ステータス</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">申請日</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">備考</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailOrders.map((o) => (
                        <tr key={o.orderId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-900">{o.productName}</td>
                          <td className="px-4 py-3 text-right text-sm text-slate-700">{o.requestedQuantity} {o.unit}</td>
                          <td className="px-4 py-3 text-center"><OrderStatusBadge status={o.status} /></td>
                          <td className="px-4 py-3 text-sm text-slate-500">{o.requestedAt}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{o.note ?? "—"}</td>
                          <td className="px-4 py-3 text-right">
                            {o.status === "requested" ? (
                              <button
                                onClick={() => handleApprove(o.orderId)}
                                className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                承認する
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Pending orders across all stores */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          全店舗 発注対応中一覧
          <span className="ml-2 text-xs font-normal text-slate-400">申請中・承認済み・発送済み</span>
        </h2>
        {pendingOrders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            対応中の発注はありません。
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">店舗名</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">商品名</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">発注数</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600">ステータス</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">申請日</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">申請者</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">備考</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingOrders.map((o) => (
                    <tr key={o.orderId} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{o.storeName}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">{o.productName}</td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-700">{o.requestedQuantity} {o.unit}</td>
                      <td className="px-5 py-3.5 text-center"><OrderStatusBadge status={o.status} /></td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{o.requestedAt}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{o.requestedBy}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{o.note ?? "—"}</td>
                      <td className="px-5 py-3.5 text-right">
                        {o.status === "requested" ? (
                          <button
                            onClick={() => handleApprove(o.orderId)}
                            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            承認する
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
