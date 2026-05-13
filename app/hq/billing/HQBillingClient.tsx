"use client";

import { useState } from "react";
import type { StoreMonthlyRevenue, MemberPaymentRecord } from "@/lib/financialMockData";
import { getMemberPaymentsByStore, BILLING_DISPLAY_MONTH } from "@/lib/financialMockData";

type Props = {
  storeRevenues: StoreMonthlyRevenue[];
  unpaidMembers: MemberPaymentRecord[];
};

function StatusBadge({ status }: { status: MemberPaymentRecord["status"] }) {
  if (status === "overdue") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
        延滞
      </span>
    );
  }
  if (status === "unpaid") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
        未払い
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      入金済
    </span>
  );
}

export function HQBillingClient({ storeRevenues, unpaidMembers }: Props) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const totalRevenue = storeRevenues.reduce((s, r) => s + r.totalRevenue, 0);
  const totalCollected = storeRevenues.reduce((s, r) => s + r.collectedAmount, 0);
  const totalUnpaid = storeRevenues.reduce((s, r) => s + r.unpaidAmount, 0);
  const totalUnpaidCount = storeRevenues.reduce((s, r) => s + r.unpaidCount, 0);

  const selectedStore = selectedStoreId
    ? storeRevenues.find((r) => r.storeId === selectedStoreId) ?? null
    : null;
  const detailMembers = selectedStoreId ? getMemberPaymentsByStore(selectedStoreId) : [];

  const handleStoreClick = (storeId: string) => {
    setSelectedStoreId((prev) => (prev === storeId ? null : storeId));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">売上管理</h1>
          <p className="mt-1 text-sm text-slate-500">{BILLING_DISPLAY_MONTH}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="text-slate-400">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
            <path d="M2 10h20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          hacomono 連携
        </span>
      </div>

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">全店舗売上</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ¥{totalRevenue.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">{storeRevenues.length}店舗合計</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">入金済み合計</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            ¥{totalCollected.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {((totalCollected / totalRevenue) * 100).toFixed(1)}% 回収済み
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">未払い合計</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            ¥{totalUnpaid.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            売上の{((totalUnpaid / totalRevenue) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">未払い件数</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{totalUnpaidCount}件</p>
          <p className="mt-1 text-xs text-slate-400">全{storeRevenues.reduce((s, r) => s + r.memberCount, 0)}会員中</p>
        </div>
      </div>

      {/* Store table */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">店舗別収益</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">店舗名</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">会員数</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">月間売上</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">入金済み</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">未払い</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">未払い件数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {storeRevenues.map((store) => {
                  const isSelected = selectedStoreId === store.storeId;
                  return (
                    <tr
                      key={store.storeId}
                      onClick={() => handleStoreClick(store.storeId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-slate-100"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden
                            className={`shrink-0 transition-transform ${isSelected ? "rotate-90 text-slate-700" : "text-slate-400"}`}
                          >
                            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="font-medium text-slate-900">{store.storeName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-slate-600">{store.memberCount}人</td>
                      <td className="px-5 py-4 text-right text-sm font-medium text-slate-900">
                        ¥{store.totalRevenue.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-emerald-700">
                        ¥{store.collectedAmount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-red-600">
                        {store.unpaidAmount > 0 ? `¥${store.unpaidAmount.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {store.unpaidCount > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                            {store.unpaidCount}件
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
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
        {selectedStore && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">
              {selectedStore.storeName} — 未払い・延滞会員
            </h3>
            {detailMembers.length === 0 ? (
              <p className="text-sm text-slate-500">未払いの会員はいません。</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">会員名</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">プラン</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">月額</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">状態</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">未払い月数</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">メモ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailMembers.map((m) => (
                      <tr key={m.memberId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{m.memberName}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{m.plan}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-700">
                          ¥{m.monthlyFee.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">{m.unpaidMonths}ヶ月</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{m.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* All stores unpaid member table */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          全店舗 未払い・延滞会員一覧
          <span className="ml-2 text-xs font-normal text-slate-400">未払い月数の多い順</span>
        </h2>
        {unpaidMembers.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            全会員の入金が確認されています。
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">会員名</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">店舗</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">プラン</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">月額</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600">状態</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">未払い月数</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">メモ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidMembers.map((m) => (
                    <tr key={m.memberId} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{m.memberName}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{m.storeName}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{m.plan}</td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-700">
                        ¥{m.monthlyFee.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-600">{m.unpaidMonths}ヶ月</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{m.note ?? "—"}</td>
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
