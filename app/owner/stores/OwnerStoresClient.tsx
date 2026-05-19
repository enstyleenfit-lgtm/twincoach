"use client";

import Link from "next/link";

type StoreData = {
  storeId: string;
  storeName: string;
  totalMembers: number;
  highRiskMembers: number;
  interventionCount: number;
  monthlyRevenue: number;
  estimatedRetentionRate: number;
};

type Props = {
  stores: StoreData[];
};

const STORE_NAV = [
  { href: "/owner/members", label: "会員一覧" },
  { href: "/owner/tasks", label: "介入タスク" },
  { href: "/owner/billing", label: "売上管理" },
  { href: "/owner/inventory", label: "在庫管理" },
  { href: "/owner/help-board", label: "応援掲示板" },
];

export default function OwnerStoresClient({ stores }: Props) {
  const totalMembers = stores.reduce((s, d) => s + d.totalMembers, 0);
  const totalHighRisk = stores.reduce((s, d) => s + d.highRiskMembers, 0);
  const totalIntervention = stores.reduce((s, d) => s + d.interventionCount, 0);
  const totalRevenue = stores.reduce((s, d) => s + d.monthlyRevenue, 0);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <div className="mb-6">
        <Link
          href="/owner"
          className="text-blue-700 hover:text-blue-800 hover:underline text-sm"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">店舗管理</h1>
        <p className="text-slate-500 text-sm mt-1">管轄店舗：{stores.length}店舗</p>
      </div>

      {/* 合算KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-5">
          <div className="text-slate-500 text-xs mb-1">合計会員数</div>
          <div className="text-2xl font-bold text-slate-900">
            {totalMembers}<span className="text-sm font-normal text-slate-500 ml-1">名</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-5">
          <div className="text-slate-500 text-xs mb-1">高リスク会員</div>
          <div className="text-2xl font-bold text-red-600">
            {totalHighRisk}<span className="text-sm font-normal text-slate-500 ml-1">名</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-5">
          <div className="text-slate-500 text-xs mb-1">介入タスク数</div>
          <div className="text-2xl font-bold text-slate-900">
            {totalIntervention}<span className="text-sm font-normal text-slate-500 ml-1">件</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-5">
          <div className="text-slate-500 text-xs mb-1">月間売上合計</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            ¥{totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 店舗別カード */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-700">店舗別状況</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stores.map((store) => (
          <div
            key={store.storeId}
            className="bg-white border border-slate-200 shadow-sm rounded-lg p-6"
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">{store.storeName}</h3>
            </div>

            {/* 店舗KPI */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-50 border border-slate-100 rounded-md p-3">
                <div className="text-slate-500 text-xs mb-0.5">会員数</div>
                <div className="text-lg font-bold text-slate-900">
                  {store.totalMembers}<span className="text-xs font-normal text-slate-500 ml-1">名</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-md p-3">
                <div className="text-slate-500 text-xs mb-0.5">高リスク</div>
                <div className="text-lg font-bold text-red-600">
                  {store.highRiskMembers}<span className="text-xs font-normal text-slate-500 ml-1">名</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-md p-3">
                <div className="text-slate-500 text-xs mb-0.5">介入タスク</div>
                <div className="text-lg font-bold text-slate-900">
                  {store.interventionCount}<span className="text-xs font-normal text-slate-500 ml-1">件</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-md p-3">
                <div className="text-slate-500 text-xs mb-0.5">月間売上</div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">
                  ¥{store.monthlyRevenue.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 導線リンク */}
            <div className="flex flex-wrap gap-2">
              {STORE_NAV.map((nav) => (
                <Link
                  key={nav.href}
                  href={nav.href}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  {nav.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
