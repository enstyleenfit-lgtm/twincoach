"use client";

import { useState } from "react";
import type { HelpRequest } from "@/lib/helpBoardMockData";
import { getApplicationsForRequest } from "@/lib/helpBoardMockData";

type Props = {
  allRequests: HelpRequest[];
};

function RequestStatusBadge({ status }: { status: HelpRequest["status"] }) {
  const styles = {
    募集中:   "bg-amber-50 text-amber-700 ring-amber-600/20",
    確定済み: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    キャンセル: "bg-slate-100 text-slate-500 ring-slate-400/20",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
      {status}
    </span>
  );
}

function HelpTypeBadge({ type }: { type: HelpRequest["helpType"] }) {
  const styles = {
    "欠員補充": "bg-red-50 text-red-700 ring-red-600/20",
    "代行出勤": "bg-blue-50 text-blue-700 ring-blue-600/20",
    "短時間サポート": "bg-violet-50 text-violet-700 ring-violet-600/20",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[type]}`}>
      {type}
    </span>
  );
}

function AppStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    応募中: "bg-blue-50 text-blue-700 ring-blue-600/20",
    確定:   "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    見送り: "bg-slate-100 text-slate-500 ring-slate-400/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

export function HQHelpBoardClient({ allRequests }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStore, setFilterStore] = useState<string | null>(null);
  const [confirmedByHQ, setConfirmedByHQ] = useState<Set<string>>(new Set());

  const storeNames = [...new Set(allRequests.map((r) => r.storeName))].sort();
  const filteredRequests = filterStore
    ? allRequests.filter((r) => r.storeName === filterStore)
    : allRequests;

  const openCount = allRequests.filter((r) => r.status === "募集中").length;
  const confirmedCount = allRequests.filter((r) => r.status === "確定済み").length;
  const withAppsCount = allRequests.filter(
    (r) => getApplicationsForRequest(r.requestId).length > 0
  ).length;
  const totalApps = allRequests.reduce(
    (s, r) => s + getApplicationsForRequest(r.requestId).length,
    0
  );

  const selectedRequest = selectedId
    ? allRequests.find((r) => r.requestId === selectedId) ?? null
    : null;
  const detailApps = selectedId ? getApplicationsForRequest(selectedId) : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">応援掲示板</h1>
        <p className="mt-1 text-sm text-slate-500">全店舗の募集・応募状況</p>
      </div>

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">募集中</p>
          <p className={`mt-2 text-2xl font-bold ${openCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
            {openCount}件
          </p>
          <p className="mt-1 text-xs text-slate-400">対応待ち</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">確定済み</p>
          <p className={`mt-2 text-2xl font-bold ${confirmedCount > 0 ? "text-emerald-600" : "text-slate-400"}`}>
            {confirmedCount}件
          </p>
          <p className="mt-1 text-xs text-slate-400">対応確定</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">応募ありの募集</p>
          <p className={`mt-2 text-2xl font-bold ${withAppsCount > 0 ? "text-blue-600" : "text-slate-400"}`}>
            {withAppsCount}件
          </p>
          <p className="mt-1 text-xs text-slate-400">応募者あり</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">総応募数</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalApps}件</p>
          <p className="mt-1 text-xs text-slate-400">全ステータス合計</p>
        </div>
      </div>

      {/* 店舗別フィルター */}
      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-slate-500 mr-1">店舗別：</span>
        <button
          onClick={() => setFilterStore(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterStore === null ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
        >
          全店舗
        </button>
        {storeNames.map((name) => (
          <button
            key={name}
            onClick={() => setFilterStore(filterStore === name ? null : name)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterStore === name ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Request table */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          {filterStore ? `${filterStore} の募集一覧` : "全店舗 募集一覧"}
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">募集店舗</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">種別</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">希望日</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">時間帯</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600">応募数</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600">状態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const apps = getApplicationsForRequest(req.requestId);
                  const isSelected = selectedId === req.requestId;
                  return (
                    <tr
                      key={req.requestId}
                      onClick={() => setSelectedId((prev) => prev === req.requestId ? null : req.requestId)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-slate-100" : req.status === "キャンセル" ? "opacity-50 hover:bg-slate-50" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <svg
                            width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden
                            className={`shrink-0 transition-transform ${isSelected ? "rotate-90 text-slate-700" : "text-slate-400"}`}
                          >
                            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="font-medium text-slate-900">{req.storeName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4"><HelpTypeBadge type={req.helpType} /></td>
                      <td className="px-5 py-4 text-sm text-slate-700">{req.date}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{req.shiftSlot}</td>
                      <td className="px-5 py-4 text-center">
                        {apps.length > 0 ? (
                          <span className="text-sm font-semibold text-blue-600">{apps.length}件</span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <RequestStatusBadge status={req.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selectedRequest && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">
                  {selectedRequest.storeName} — {selectedRequest.helpType}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedRequest.date} · {selectedRequest.shiftSlot} · {selectedRequest.requiredCount}名募集
                </p>
              </div>
              <RequestStatusBadge status={selectedRequest.status} />
            </div>
            <p className="mb-4 text-sm text-slate-700 leading-relaxed">{selectedRequest.description}</p>

            <div className="mb-5 flex flex-wrap gap-2">
              {confirmedByHQ.has(selectedRequest.requestId) ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  ✓ 本部確認済み
                </span>
              ) : (
                <button
                  onClick={() => setConfirmedByHQ((prev) => new Set([...prev, selectedRequest.requestId]))}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  本部確認済みにする
                </button>
              )}
            </div>

            <h4 className="mb-3 text-xs font-semibold text-slate-600">応募店舗一覧</h4>
            {detailApps.length === 0 ? (
              <p className="text-sm text-slate-400">まだ応募はありません。</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">応募店舗</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">状態</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">応募日</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">メモ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailApps.map((app) => (
                      <tr key={app.applicationId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{app.applicantStoreName}</td>
                        <td className="px-4 py-3 text-center"><AppStatusBadge status={app.status} /></td>
                        <td className="px-4 py-3 text-sm text-slate-500">{app.appliedAt}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{app.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
