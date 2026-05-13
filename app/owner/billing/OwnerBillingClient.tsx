"use client";

import { Fragment, useState } from "react";
import type { StoreMonthlyRevenue, MemberPaymentRecord } from "@/lib/financialMockData";

type Props = {
  storeRevenue: StoreMonthlyRevenue | undefined;
  memberPayments: MemberPaymentRecord[];
  displayMonth: string;
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

export function OwnerBillingClient({ storeRevenue, memberPayments, displayMonth }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const storeName = storeRevenue?.storeName ?? "店舗";
  const totalRevenue = storeRevenue?.totalRevenue ?? 0;
  const collectedAmount = storeRevenue?.collectedAmount ?? 0;
  const unpaidAmount = storeRevenue?.unpaidAmount ?? 0;
  const unpaidCount = storeRevenue?.unpaidCount ?? 0;
  const memberCount = storeRevenue?.memberCount ?? 0;

  const unpaidMembers = memberPayments.filter(
    (m) => m.status === "unpaid" || m.status === "overdue"
  );

  const handleRowClick = (memberId: string) => {
    setExpandedId((prev) => (prev === memberId ? null : memberId));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">売上管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            {storeName} · {displayMonth}
          </p>
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
          <p className="text-xs font-medium text-slate-500">月間売上</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ¥{totalRevenue.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">{memberCount}会員</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">入金済み</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            ¥{collectedAmount.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {totalRevenue > 0
              ? `${((collectedAmount / totalRevenue) * 100).toFixed(1)}% 回収済み`
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">未払い合計</p>
          <p className={`mt-2 text-2xl font-bold ${unpaidAmount > 0 ? "text-red-600" : "text-slate-400"}`}>
            {unpaidAmount > 0 ? `¥${unpaidAmount.toLocaleString()}` : "¥0"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {totalRevenue > 0
              ? `売上の${((unpaidAmount / totalRevenue) * 100).toFixed(1)}%`
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">未払い件数</p>
          <p className={`mt-2 text-2xl font-bold ${unpaidCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
            {unpaidCount}件
          </p>
          <p className="mt-1 text-xs text-slate-400">全{memberCount}会員中</p>
        </div>
      </div>

      {/* Unpaid member table */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          未払い・延滞会員
          {unpaidMembers.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              行をクリックで詳細を確認
            </span>
          )}
        </h2>

        {unpaidMembers.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-slate-700">全会員の入金が確認されています</p>
            <p className="mt-1 text-xs text-slate-400">未払いの会員はいません。</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">会員名</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">プラン</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">月額</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600">状態</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600">未払い月数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidMembers.map((m) => (
                    <Fragment key={m.memberId}>
                      <tr
                        onClick={() => handleRowClick(m.memberId)}
                        className={`cursor-pointer transition-colors ${
                          expandedId === m.memberId ? "bg-slate-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden
                              className={`shrink-0 transition-transform ${
                                expandedId === m.memberId ? "rotate-90 text-slate-700" : "text-slate-400"
                              }`}
                            >
                              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-sm font-medium text-slate-900">{m.memberName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{m.plan}</td>
                        <td className="px-5 py-3.5 text-right text-sm text-slate-700">
                          ¥{m.monthlyFee.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm text-slate-600">
                          {m.unpaidMonths}ヶ月
                        </td>
                      </tr>
                      {expandedId === m.memberId && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50 px-5 pb-4 pt-0">
                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                                <div>
                                  <dt className="text-xs font-medium text-slate-500">最終入金日</dt>
                                  <dd className="mt-0.5 text-slate-900">{m.lastPaymentDate}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-medium text-slate-500">未払い月数</dt>
                                  <dd className="mt-0.5 font-semibold text-red-600">{m.unpaidMonths}ヶ月</dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-medium text-slate-500">未払い累計</dt>
                                  <dd className="mt-0.5 font-semibold text-red-600">
                                    ¥{(m.monthlyFee * m.unpaidMonths).toLocaleString()}
                                  </dd>
                                </div>
                                {m.note && (
                                  <div className="col-span-2 sm:col-span-3">
                                    <dt className="text-xs font-medium text-slate-500">メモ</dt>
                                    <dd className="mt-0.5 text-slate-700">{m.note}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
