"use client";

import { Fragment, useState } from "react";
import type { HelpRequest, HelpApplication } from "@/lib/helpBoardMockData";
import { getApplicationsForRequest } from "@/lib/helpBoardMockData";

type Props = {
  storeId: string;
  ownRequests: HelpRequest[];
  otherOpenRequests: HelpRequest[];
  ownApplications: HelpApplication[];
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

function RequestRow({
  req,
  isExpanded,
  onToggle,
  showApps,
  highlightApplicantStoreId,
}: {
  req: HelpRequest;
  isExpanded: boolean;
  onToggle: () => void;
  showApps: boolean;
  highlightApplicantStoreId?: string;
}) {
  const apps = getApplicationsForRequest(req.requestId);
  const ownApp = highlightApplicantStoreId
    ? apps.find((a) => a.applicantStoreId === highlightApplicantStoreId)
    : undefined;

  return (
    <Fragment>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors ${isExpanded ? "bg-slate-50" : "hover:bg-slate-50"}`}
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden
              className={`shrink-0 transition-transform ${isExpanded ? "rotate-90 text-slate-700" : "text-slate-400"}`}
            >
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-medium text-slate-900">{req.storeName}</span>
          </div>
        </td>
        <td className="px-5 py-4"><HelpTypeBadge type={req.helpType} /></td>
        <td className="px-5 py-4 text-sm text-slate-700">{req.date} ({req.shiftSlot})</td>
        <td className="px-5 py-4 text-center">
          {showApps && apps.length > 0 ? (
            <span className="text-sm font-semibold text-blue-600">{apps.length}件</span>
          ) : ownApp ? (
            <AppStatusBadge status={ownApp.status} />
          ) : (
            <span className="text-sm text-slate-400">—</span>
          )}
        </td>
        <td className="px-5 py-4 text-center">
          <RequestStatusBadge status={req.status} />
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="bg-slate-50 px-5 pb-4 pt-0">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm text-slate-700 leading-relaxed">{req.description}</p>
              <p className="mb-3 text-xs text-slate-400">
                {req.requiredCount}名募集 · 投稿：{req.postedAt} · {req.postedBy}
              </p>
              {showApps && (
                <>
                  <p className="mb-2 text-xs font-semibold text-slate-600">応募店舗</p>
                  {apps.length === 0 ? (
                    <p className="text-xs text-slate-400">まだ応募はありません。</p>
                  ) : (
                    <div className="space-y-1.5">
                      {apps.map((app) => (
                        <div key={app.applicationId} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{app.applicantStoreName}</p>
                            {app.note && <p className="text-xs text-slate-500">{app.note}</p>}
                          </div>
                          <AppStatusBadge status={app.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {ownApp && (
                <div className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                  <p className="text-sm font-medium text-blue-700">自店舗の応募</p>
                  <AppStatusBadge status={ownApp.status} />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function OwnerHelpBoardClient({
  storeId,
  ownRequests,
  otherOpenRequests,
  ownApplications,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const ownOpenCount = ownRequests.filter((r) => r.status === "募集中").length;
  const ownConfirmedCount = ownRequests.filter((r) => r.status === "確定済み").length;
  const ownPendingApps = ownApplications.filter((a) => a.status === "応募中").length;

  const tableHead = (
    <thead className="border-b border-slate-200 bg-slate-50">
      <tr>
        <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">店舗</th>
        <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">種別</th>
        <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600">希望日・時間帯</th>
        <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600">応募</th>
        <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600">状態</th>
      </tr>
    </thead>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">応援掲示板</h1>
        <p className="mt-1 text-sm text-slate-500">自店舗の募集と、他店舗への応援状況</p>
      </div>

      {/* KPI */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">自店舗の募集中</p>
          <p className={`mt-2 text-2xl font-bold ${ownOpenCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
            {ownOpenCount}件
          </p>
          <p className="mt-1 text-xs text-slate-400">対応待ち</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">自店舗の確定済み</p>
          <p className={`mt-2 text-2xl font-bold ${ownConfirmedCount > 0 ? "text-emerald-600" : "text-slate-400"}`}>
            {ownConfirmedCount}件
          </p>
          <p className="mt-1 text-xs text-slate-400">対応確定</p>
        </div>
        <div className="col-span-2 lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">他店舗への応募中</p>
          <p className={`mt-2 text-2xl font-bold ${ownPendingApps > 0 ? "text-blue-600" : "text-slate-400"}`}>
            {ownPendingApps}件
          </p>
          <p className="mt-1 text-xs text-slate-400">応答待ち</p>
        </div>
      </div>

      {/* Own requests */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">自店舗の募集</h2>
        {ownRequests.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            現在、募集はありません。
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              {tableHead}
              <tbody className="divide-y divide-slate-100">
                {ownRequests.map((req) => (
                  <RequestRow
                    key={req.requestId}
                    req={req}
                    isExpanded={expandedId === req.requestId}
                    onToggle={() => toggle(req.requestId)}
                    showApps
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Other stores' open requests */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          他店舗の応募可能案件
          <span className="ml-2 text-xs font-normal text-slate-400">募集中のみ表示</span>
        </h2>
        {otherOpenRequests.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            現在、他店舗からの募集はありません。
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              {tableHead}
              <tbody className="divide-y divide-slate-100">
                {otherOpenRequests.map((req) => (
                  <RequestRow
                    key={req.requestId}
                    req={req}
                    isExpanded={expandedId === req.requestId}
                    onToggle={() => toggle(req.requestId)}
                    showApps={false}
                    highlightApplicantStoreId={storeId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
