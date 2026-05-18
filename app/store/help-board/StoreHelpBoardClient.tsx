"use client";

import { Fragment, useState } from "react";
import type { HelpRequest, HelpApplication, HelpType, ShiftSlot } from "@/lib/helpBoardMockData";
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

type FormState = {
  date: string;
  shiftSlot: ShiftSlot;
  helpType: HelpType;
  requiredCount: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  date: "",
  shiftSlot: "午前",
  helpType: "欠員補充",
  requiredCount: "1",
  description: "",
};

export function StoreHelpBoardClient({
  storeId,
  ownRequests,
  otherOpenRequests,
  ownApplications,
}: Props) {
  const [localOwnRequests, setLocalOwnRequests] = useState<HelpRequest[]>(ownRequests);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(
    () => new Set(ownApplications.map((a) => a.requestId))
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const storeName = ownRequests[0]?.storeName ?? "自店舗";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: HelpRequest = {
      requestId: `req-new-${Date.now()}`,
      storeId,
      storeName,
      date: form.date,
      shiftSlot: form.shiftSlot,
      helpType: form.helpType,
      requiredCount: parseInt(form.requiredCount, 10) || 1,
      description: form.description,
      status: "募集中",
      postedAt: new Date().toISOString().slice(0, 10),
      postedBy: "店舗スタッフ",
      source: "manual",
    };
    setLocalOwnRequests((prev) => [newReq, ...prev]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleApply = (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAppliedIds((prev) => new Set([...prev, requestId]));
  };

  const newlyAppliedCount = [...appliedIds].filter(
    (id) => !ownApplications.some((a) => a.requestId === id)
  ).length;
  const ownOpenCount = localOwnRequests.filter((r) => r.status === "募集中").length;
  const ownPendingApps =
    ownApplications.filter((a) => a.status === "応募中").length + newlyAppliedCount;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">応援掲示板</h1>
        <p className="mt-1 text-sm text-slate-500">自店舗の募集と、他店舗への応援</p>
      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">自店舗の募集中</p>
          <p className={`mt-2 text-2xl font-bold ${ownOpenCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
            {ownOpenCount}件
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">応募可能案件</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{otherOpenRequests.length}件</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">他店舗への応募中</p>
          <p className={`mt-2 text-2xl font-bold ${ownPendingApps > 0 ? "text-blue-600" : "text-slate-400"}`}>
            {ownPendingApps}件
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">自店舗の総募集</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{localOwnRequests.length}件</p>
        </div>
      </div>

      {/* Own requests */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            自店舗の募集
            <span className="ml-2 text-xs font-normal text-slate-400">タップで応募状況を確認</span>
          </h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {showForm ? "閉じる" : "+ 募集を投稿"}
          </button>
        </div>

        {showForm && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">日付</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">時間帯</label>
                  <select
                    value={form.shiftSlot}
                    onChange={(e) => setForm((f) => ({ ...f, shiftSlot: e.target.value as ShiftSlot }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  >
                    <option>午前</option>
                    <option>午後</option>
                    <option>終日</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">種別</label>
                  <select
                    value={form.helpType}
                    onChange={(e) => setForm((f) => ({ ...f, helpType: e.target.value as HelpType }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  >
                    <option>欠員補充</option>
                    <option>代行出勤</option>
                    <option>短時間サポート</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">必要人数</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={form.requiredCount}
                    onChange={(e) => setForm((f) => ({ ...f, requiredCount: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">概要メモ</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="募集の詳細を入力してください"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  投稿する
                </button>
              </div>
            </form>
          </div>
        )}

        {localOwnRequests.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            現在、募集はありません。
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600">種別</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600">希望日</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600">応募</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600">状態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {localOwnRequests.map((req) => {
                  const apps = getApplicationsForRequest(req.requestId);
                  const isExpanded = expandedId === req.requestId;
                  return (
                    <Fragment key={req.requestId}>
                      <tr
                        onClick={() => toggle(req.requestId)}
                        className={`cursor-pointer transition-colors ${isExpanded ? "bg-slate-50" : "hover:bg-slate-50"}`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <svg
                              width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden
                              className={`shrink-0 transition-transform ${isExpanded ? "rotate-90 text-slate-700" : "text-slate-400"}`}
                            >
                              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <HelpTypeBadge type={req.helpType} />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-700">{req.date}（{req.shiftSlot}）</td>
                        <td className="px-4 py-3.5 text-center">
                          {apps.length > 0 ? (
                            <span className="text-sm font-semibold text-blue-600">{apps.length}件</span>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <RequestStatusBadge status={req.status} />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="bg-slate-50 px-4 pb-4 pt-0">
                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                              <p className="mb-3 text-sm text-slate-700 leading-relaxed">{req.description}</p>
                              <p className="mb-3 text-xs text-slate-400">{req.requiredCount}名募集</p>
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
        )}
      </div>

      {/* Other stores' open requests */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          他店舗の応募可能案件
          <span className="ml-2 text-xs font-normal text-slate-400">タップで詳細・応募</span>
        </h2>
        {otherOpenRequests.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            現在、他店舗からの募集はありません。
          </div>
        ) : (
          <div className="space-y-2">
            {otherOpenRequests.map((req) => {
              const isExpanded = expandedId === req.requestId;
              const isApplied = appliedIds.has(req.requestId);
              const existingApp = ownApplications.find((a) => a.requestId === req.requestId);
              return (
                <Fragment key={req.requestId}>
                  <div
                    onClick={() => toggle(req.requestId)}
                    className={`cursor-pointer rounded-xl border bg-white px-5 py-4 shadow-sm transition-colors ${isExpanded ? "border-slate-300 bg-slate-50" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{req.storeName}</span>
                          <HelpTypeBadge type={req.helpType} />
                          {isApplied && <AppStatusBadge status={existingApp?.status ?? "応募中"} />}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {req.date} · {req.shiftSlot} · {req.requiredCount}名募集
                        </p>
                      </div>
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden
                        className={`mt-0.5 shrink-0 transition-transform ${isExpanded ? "rotate-90 text-slate-700" : "text-slate-400"}`}
                      >
                        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                        <p className="text-sm text-slate-700 leading-relaxed">{req.description}</p>
                        {isApplied ? (
                          <div className="mt-3 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                            <p className="text-sm font-medium text-blue-700">
                              {existingApp ? "自店舗の応募" : "応募済み"}
                            </p>
                            <AppStatusBadge status={existingApp?.status ?? "応募中"} />
                          </div>
                        ) : (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={(e) => handleApply(req.requestId, e)}
                              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                            >
                              応募する
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
