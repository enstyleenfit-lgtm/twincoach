"use client";

import { Fragment, useState } from "react";
import type { HelpRequest, HelpApplication, HelpType, ShiftSlot } from "@/lib/helpBoardMockData";
import { getApplicationsForRequest } from "@/lib/helpBoardMockData";

type StoreHelpData = {
  storeId: string;
  storeName: string;
  requests: HelpRequest[];
  applications: HelpApplication[];
};

type Props = {
  stores: StoreHelpData[];
  otherOpenRequests: HelpRequest[];
};

function RequestStatusBadge({ status }: { status: HelpRequest["status"] }) {
  const styles = {
    募集中:    "bg-amber-50 text-amber-700 ring-amber-600/20",
    確定済み:  "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
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
    "欠員補充":     "bg-red-50 text-red-700 ring-red-600/20",
    "代行出勤":     "bg-blue-50 text-blue-700 ring-blue-600/20",
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

function RequestRow({
  req,
  isExpanded,
  onToggle,
  showApps,
  ownerStoreIds,
  isApplied,
  onApply,
}: {
  req: HelpRequest;
  isExpanded: boolean;
  onToggle: () => void;
  showApps: boolean;
  ownerStoreIds?: string[];
  isApplied?: boolean;
  onApply?: () => void;
}) {
  const apps = getApplicationsForRequest(req.requestId);
  const ownApp = ownerStoreIds?.length
    ? apps.find((a) => ownerStoreIds.includes(a.applicantStoreId))
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
          ) : isApplied ? (
            <AppStatusBadge status={ownApp?.status ?? "応募中"} />
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
              {!showApps && (
                isApplied ? (
                  <div className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                    <p className="text-sm font-medium text-blue-700">
                      {ownApp ? "管轄店舗の応募" : "応募済み"}
                    </p>
                    <AppStatusBadge status={ownApp?.status ?? "応募中"} />
                  </div>
                ) : ownApp ? (
                  <div className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                    <p className="text-sm font-medium text-blue-700">管轄店舗の応募</p>
                    <AppStatusBadge status={ownApp.status} />
                  </div>
                ) : (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); onApply?.(); }}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                    >
                      応募する
                    </button>
                  </div>
                )
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function OwnerHelpBoardClient({ stores, otherOpenRequests }: Props) {
  const allInitialApplications = stores.flatMap((s) => s.applications);
  const ownerStoreIds = stores.map((s) => s.storeId);
  const ownerRequestIds = new Set(stores.flatMap((s) => s.requests.map((r) => r.requestId)));

  const [localStoreRequests, setLocalStoreRequests] = useState<Record<string, HelpRequest[]>>(
    () => Object.fromEntries(stores.map((s) => [s.storeId, s.requests]))
  );
  const [appliedIds, setAppliedIds] = useState<Set<string>>(
    () => new Set(allInitialApplications.map((a) => a.requestId))
  );
  const [showForm, setShowForm] = useState(false);
  const [formStoreId, setFormStoreId] = useState<string>(stores[0]?.storeId ?? "");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const allLocalRequests = Object.values(localStoreRequests).flat();
  const totalOwnRequests = allLocalRequests.length;
  const ownOpenCount = allLocalRequests.filter((r) => r.status === "募集中").length;
  const newlyAppliedCount = [...appliedIds].filter(
    (id) => !allInitialApplications.some((a) => a.requestId === id)
  ).length;
  const ownPendingApps =
    allInitialApplications.filter(
      (a) => a.status === "応募中" && !ownerRequestIds.has(a.requestId)
    ).length + newlyAppliedCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedStore = stores.find((s) => s.storeId === formStoreId);
    const newReq: HelpRequest = {
      requestId: `req-new-${Date.now()}`,
      storeId: formStoreId,
      storeName: selectedStore?.storeName ?? formStoreId,
      date: form.date,
      shiftSlot: form.shiftSlot,
      helpType: form.helpType,
      requiredCount: parseInt(form.requiredCount, 10) || 1,
      description: form.description,
      status: "募集中",
      postedAt: new Date().toISOString().slice(0, 10),
      postedBy: "オーナー",
      source: "manual",
    };
    setLocalStoreRequests((prev) => ({
      ...prev,
      [formStoreId]: [newReq, ...(prev[formStoreId] ?? [])],
    }));
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleApply = (requestId: string) => {
    setAppliedIds((prev) => new Set([...prev, requestId]));
  };

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">応援掲示板</h1>
        <p className="mt-1 text-sm text-slate-500">管轄店舗の募集状況と、他店舗への応援状況</p>
      </div>

      {/* KPI */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">管轄店舗数</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stores.length}店舗</p>
          <p className="mt-1 text-xs text-slate-400">管理対象</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">自店舗募集数</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalOwnRequests}件</p>
          <p className="mt-1 text-xs text-slate-400">累計投稿</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">募集中件数</p>
          <p className={`mt-2 text-2xl font-bold ${ownOpenCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
            {ownOpenCount}件
          </p>
          <p className="mt-1 text-xs text-slate-400">対応待ち</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">応募中件数</p>
          <p className={`mt-2 text-2xl font-bold ${ownPendingApps > 0 ? "text-blue-600" : "text-slate-400"}`}>
            {ownPendingApps}件
          </p>
          <p className="mt-1 text-xs text-slate-400">応答待ち</p>
        </div>
      </div>

      {/* 自店舗の募集 */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">自店舗の募集</h2>
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
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">投稿店舗</label>
                  <select
                    value={formStoreId}
                    onChange={(e) => setFormStoreId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
                  >
                    {stores.map((s) => (
                      <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
                    ))}
                  </select>
                </div>
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

        {/* 店舗ごとのセクション */}
        <div className="space-y-4">
          {stores.map((store) => {
            const storeRequests = localStoreRequests[store.storeId] ?? [];
            return (
              <div key={store.storeId}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {store.storeName}
                </p>
                {storeRequests.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                    現在、募集はありません。
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full">
                      {tableHead}
                      <tbody className="divide-y divide-slate-100">
                        {storeRequests.map((req) => (
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
            );
          })}
        </div>
      </div>

      {/* 他店舗の応募可能案件 */}
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
                    ownerStoreIds={ownerStoreIds}
                    isApplied={appliedIds.has(req.requestId)}
                    onApply={() => handleApply(req.requestId)}
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
