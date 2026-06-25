"use client";

import { Fragment, useState, type FormEvent } from "react";
import type { InventoryItem, PurchaseOrder } from "@/lib/inventoryMockData";
import { isLowStock, CATEGORY_LABEL, ORDER_STATUS_LABEL } from "@/lib/inventoryMockData";

type AddReqStatus = "申請中" | "本部承認待ち" | "承認済み" | "差し戻し";
type AddReq = { id: string; storeId: string; storeName: string; productName: string; quantity: string; reason: string; submittedAt: string; status: AddReqStatus };

const ADD_REQ_STATUS_STYLE: Record<AddReqStatus, string> = {
  "申請中":     "bg-blue-50 text-blue-700 ring-blue-600/20",
  "本部承認待ち": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "承認済み":   "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "差し戻し":   "bg-red-50 text-red-700 ring-red-600/20",
};

const MOCK_OWNER_ADD_REQS: AddReq[] = [
  { id: "oar-1", storeId: "store-1", storeName: "人形町店", productName: "グルタミン（プレーン）", quantity: "8袋", reason: "補充依頼", submittedAt: "6/22", status: "本部承認待ち" },
  { id: "oar-2", storeId: "store-2", storeName: "水天宮前店", productName: "クレアチン（パウダー）", quantity: "3袋", reason: "試験導入", submittedAt: "6/19", status: "差し戻し" },
];

type StoreInventoryData = {
  storeId: string;
  storeName: string;
  inventory: InventoryItem[];
  orders: PurchaseOrder[];
};

type Props = {
  stores: StoreInventoryData[];
};

function StockBar({ quantity, threshold }: { quantity: number; threshold: number }) {
  const pct = Math.min(100, Math.round((quantity / Math.max(threshold * 2, quantity)) * 100));
  const low = quantity <= threshold;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${low ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-semibold tabular-nums ${low ? "text-red-600" : "text-slate-900"}`}>
        {quantity}
      </span>
    </div>
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

export function OwnerInventoryClient({ stores }: Props) {
  const allInitialOrders = stores.flatMap((s) => s.orders);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [localOrders, setLocalOrders] = useState<PurchaseOrder[]>(allInitialOrders);

  const [showReqForm, setShowReqForm] = useState(false);
  const [reqForm, setReqForm] = useState({ storeId: "", productName: "", quantity: "1", reason: "", desiredDate: "", note: "" });
  const [reqSuccess, setReqSuccess] = useState(false);
  const [addReqs, setAddReqs] = useState<AddReq[]>(MOCK_OWNER_ADD_REQS);

  const handleReqSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const store = stores.find((s) => s.storeId === reqForm.storeId) ?? stores[0];
    setAddReqs((prev) => [
      { id: `oar-${Date.now()}`, storeId: store.storeId, storeName: store.storeName, productName: reqForm.productName, quantity: `${reqForm.quantity}個`, reason: reqForm.reason || "—", submittedAt: new Date().toISOString().slice(5, 10).replace("-", "/"), status: "本部承認待ち" },
      ...prev,
    ]);
    setReqForm({ storeId: "", productName: "", quantity: "1", reason: "", desiredDate: "", note: "" });
    setShowReqForm(false);
    setReqSuccess(true);
    setTimeout(() => setReqSuccess(false), 4000);
  };

  const handleApprove = (orderId: string) => {
    setLocalOrders((prev) =>
      prev.map((o): PurchaseOrder =>
        o.orderId === orderId ? { ...o, status: "approved" } : o
      )
    );
  };

  const getOrdersForProduct = (productId: string, storeId: string) =>
    localOrders.filter((o) => o.productId === productId && o.storeId === storeId);

  const getStoreOrders = (storeId: string) =>
    localOrders.filter((o) => o.storeId === storeId);

  // 合算KPI
  const totalItems = stores.reduce((s, d) => s + d.inventory.length, 0);
  const totalLowStock = stores.reduce(
    (s, d) => s + d.inventory.filter(isLowStock).length, 0
  );
  const totalPending = localOrders.filter(
    (o) => o.status === "requested" || o.status === "approved" || o.status === "shipped"
  ).length;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">在庫管理</h1>
          <p className="mt-1 text-sm text-slate-500">管轄店舗：{stores.length}店舗合算</p>
        </div>
        <button
          onClick={() => setShowReqForm((v) => !v)}
          className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
        >
          {showReqForm ? "閉じる" : "+ 追加申請"}
        </button>
      </div>

      {reqSuccess && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-emerald-500">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-semibold text-emerald-700">申請を送信しました。本部の承認をお待ちください。</p>
        </div>
      )}

      {showReqForm && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-slate-900">追加申請（本部へ送信）</h3>
          <form onSubmit={handleReqSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">申請店舗 *</label>
                <select
                  required value={reqForm.storeId}
                  onChange={(e) => setReqForm((f) => ({ ...f, storeId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                >
                  <option value="">選択してください</option>
                  {stores.map((s) => (
                    <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">商品名 *</label>
                <input
                  type="text" required value={reqForm.productName}
                  onChange={(e) => setReqForm((f) => ({ ...f, productName: e.target.value }))}
                  placeholder="例：ホエイプロテイン（バニラ）"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">申請数 *</label>
                <input
                  type="number" min="1" required value={reqForm.quantity}
                  onChange={(e) => setReqForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">希望納品日</label>
                <input
                  type="date" value={reqForm.desiredDate}
                  onChange={(e) => setReqForm((f) => ({ ...f, desiredDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">申請理由</label>
                <input
                  type="text" value={reqForm.reason}
                  onChange={(e) => setReqForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="例：在庫不足、試験導入など"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">備考</label>
              <textarea
                rows={2} value={reqForm.note}
                onChange={(e) => setReqForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="補足事項があれば記入してください"
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowReqForm(false); setReqForm({ storeId: "", productName: "", quantity: "1", reason: "", desiredDate: "", note: "" }); }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                本部へ申請する
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 合算KPI */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">管轄店舗数</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stores.length}店舗</p>
          <p className="mt-1 text-xs text-slate-400">人形町・水天宮前</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">管理品目数</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalItems}品目</p>
          <p className="mt-1 text-xs text-slate-400">在庫追跡中</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">在庫不足アラート</p>
          <p className={`mt-2 text-2xl font-bold ${totalLowStock > 0 ? "text-red-600" : "text-slate-400"}`}>
            {totalLowStock}品目
          </p>
          <p className="mt-1 text-xs text-slate-400">発注基準以下</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">発注対応中</p>
          <p className={`mt-2 text-2xl font-bold ${totalPending > 0 ? "text-blue-600" : "text-slate-400"}`}>
            {totalPending}件
          </p>
          <p className="mt-1 text-xs text-slate-400">申請中・承認済み・発送済み</p>
        </div>
      </div>

      {/* 店舗別セクション */}
      <div className="space-y-10">
        {stores.map((store) => {
          const storeOrders = getStoreOrders(store.storeId);
          const lowStockItems = store.inventory.filter(isLowStock);
          const pendingOrders = storeOrders.filter(
            (o) => o.status === "requested" || o.status === "approved" || o.status === "shipped"
          );

          return (
            <div key={store.storeId}>
              {/* 店舗ヘッダー */}
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-base font-bold text-slate-900">{store.storeName}</h2>
                <span className="text-xs text-slate-500">{store.inventory.length}品目</span>
                {lowStockItems.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                    不足 {lowStockItems.length}品目
                  </span>
                )}
              </div>

              {/* 在庫不足バナー */}
              {lowStockItems.length > 0 && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0 text-red-500">
                    <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-700">在庫不足の商品があります</p>
                    <p className="mt-0.5 text-xs text-red-600">
                      {lowStockItems.map((i) => i.productName).join("・")} の発注をご確認ください。
                    </p>
                  </div>
                </div>
              )}

              {/* 在庫一覧 */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-slate-600">
                  在庫一覧
                  <span className="ml-2 font-normal text-slate-400">行をクリックで発注履歴・承認操作</span>
                </p>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">商品名</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">カテゴリ</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">在庫数</th>
                        <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">発注基準</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">最終更新</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {store.inventory.map((item) => {
                        const low = isLowStock(item);
                        const isExpanded = expandedItemId === item.itemId;
                        const productOrders = getOrdersForProduct(item.productId, store.storeId);

                        return (
                          <Fragment key={item.itemId}>
                            <tr
                              onClick={() => setExpandedItemId((prev) => prev === item.itemId ? null : item.itemId)}
                              className={`cursor-pointer transition-colors ${low ? "bg-red-50/50" : ""} ${isExpanded ? "bg-slate-50" : "hover:bg-slate-50"}`}
                            >
                              <td className="px-5 py-3.5">
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
                                  {low && (
                                    <span className="inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                                      不足
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-sm text-slate-500">{CATEGORY_LABEL[item.category]}</td>
                              <td className="px-5 py-3.5">
                                <StockBar quantity={item.stockQuantity} threshold={item.minStockThreshold} />
                              </td>
                              <td className="px-5 py-3.5 text-right text-sm text-slate-500">
                                {item.minStockThreshold} {item.unit}
                              </td>
                              <td className="px-5 py-3.5 text-sm text-slate-400">{item.lastUpdated}</td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} className="bg-slate-50 px-5 pb-4 pt-0">
                                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                                    <p className="mb-3 text-xs font-semibold text-slate-600">発注申請履歴</p>
                                    {productOrders.length === 0 ? (
                                      <p className="text-xs text-slate-400">発注履歴はありません。</p>
                                    ) : (
                                      <table className="w-full">
                                        <thead>
                                          <tr className="border-b border-slate-100">
                                            <th className="pb-2 text-left text-xs font-medium text-slate-500">発注数</th>
                                            <th className="pb-2 text-center text-xs font-medium text-slate-500">ステータス</th>
                                            <th className="pb-2 text-left text-xs font-medium text-slate-500">申請日</th>
                                            <th className="pb-2 text-left text-xs font-medium text-slate-500">備考</th>
                                            <th className="pb-2 text-right text-xs font-medium text-slate-500">操作</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {productOrders.map((o) => (
                                            <tr key={o.orderId} className="border-b border-slate-50 last:border-0">
                                              <td className="py-2 text-sm font-semibold text-slate-900">{o.requestedQuantity} {o.unit}</td>
                                              <td className="py-2 text-center"><OrderStatusBadge status={o.status} /></td>
                                              <td className="py-2 text-sm text-slate-500">{o.requestedAt}</td>
                                              <td className="py-2 text-sm text-slate-500">{o.note ?? "—"}</td>
                                              <td className="py-2 text-right">
                                                {o.status === "requested" ? (
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); handleApprove(o.orderId); }}
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

              {/* 発注対応中 */}
              {pendingOrders.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-600">発注対応中</p>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">商品名</th>
                          <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">発注数</th>
                          <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600">ステータス</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">申請日</th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">備考</th>
                          <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pendingOrders.map((o) => (
                          <tr key={o.orderId} className="hover:bg-slate-50">
                            <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{o.productName}</td>
                            <td className="px-5 py-3.5 text-right text-sm text-slate-700">{o.requestedQuantity} {o.unit}</td>
                            <td className="px-5 py-3.5 text-center"><OrderStatusBadge status={o.status} /></td>
                            <td className="px-5 py-3.5 text-sm text-slate-500">{o.requestedAt}</td>
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
          );
        })}
      </div>

      {/* 追加申請一覧 */}
      {addReqs.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">追加申請一覧（本部へ送信済み）</h2>
          <div className="space-y-2">
            {addReqs.map((req) => (
              <div key={req.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div>
                  <p className="text-sm font-medium text-slate-900">{req.productName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{req.storeName} · {req.quantity} · 申請日 {req.submittedAt}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{req.reason}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${ADD_REQ_STATUS_STYLE[req.status]}`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
