"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import { dashboardHref, storeDetailHref } from "@/lib/routeContext";
import type { Member, StorePerformanceSummary } from "@/types";
import { getStoreSummaries } from "@/lib/storeSummary";
import { loadImportedMembers, mergeBaseAndImported } from "@/lib/importStore";

type RankingTab = "retention" | "revenue" | "loss" | "highRisk" | "success";

type Props = {
  initialMembers: Member[];
};

export default function StoresClient({ initialMembers }: Props) {
  const seg = useAppRouteSegment();
  const [stores, setStores] = useState<StorePerformanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RankingTab>("retention");

  useEffect(() => {
    const members = mergeBaseAndImported(initialMembers, loadImportedMembers());
    setStores(getStoreSummaries(members));
    setIsLoading(false);
  }, [initialMembers]);

  const rankers: Record<
    RankingTab,
    { label: string; description: string; sort: (a: StorePerformanceSummary, b: StorePerformanceSummary) => number }
  > = {
    retention: { label: "継続率ランキング", description: "継続率が高い順に並べています", sort: (a, b) => b.estimatedRetentionRate - a.estimatedRetentionRate },
    revenue: { label: "収益ランキング", description: "月間売上が高い順に並べています", sort: (a, b) => b.monthlyRevenue - a.monthlyRevenue },
    loss: { label: "来月損失予測ランキング", description: "来月失う可能性のある売上が大きい順です", sort: (a, b) => b.expectedLoss30Days - a.expectedLoss30Days },
    highRisk: { label: "高リスク会員数ランキング", description: "高リスク会員数が多い順です", sort: (a, b) => b.highRiskMembers - a.highRiskMembers },
    success: { label: "成功店舗ランキング", description: "成果・継続・収益・損失を統合した成功度の高い順です", sort: (a, b) => b.successScore - a.successScore },
  };

  const rankedStores = [...stores].sort(rankers[activeTab].sort);

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          href={dashboardHref(seg)}
          className="text-blue-700 hover:text-blue-800 hover:underline text-sm"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">店舗一覧</h1>

      {isLoading ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-8 text-center">
          <p className="text-slate-600">店舗データを読み込み中...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-8 text-center">
          <p className="text-slate-600">店舗データがありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(rankers) as RankingTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors duration-150 ${
                  activeTab === tab
                    ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                    : "text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {rankers[tab].label}
              </button>
            ))}
          </div>
          <p className="text-slate-600 text-xs">{rankers[activeTab].description}</p>

          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">店舗名</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">会員数</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">推定継続率</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">月間売上</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">来月損失予測</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">高リスク会員数</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">成功度スコア</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rankedStores.map((store, index) => (
                    <tr key={store.storeName} className="hover:bg-slate-100/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-slate-500 text-xs mr-2">#{index + 1}</span>
                        <Link
                          href={storeDetailHref(seg, store.storeName)}
                          className="text-blue-700 hover:text-blue-800 hover:underline font-medium"
                        >
                          {store.storeName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{store.totalMembers}人</td>
                      <td className="px-6 py-4 text-slate-700">{store.estimatedRetentionRate.toFixed(1)}%</td>
                      <td className="px-6 py-4 text-slate-900">¥{store.monthlyRevenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-red-700 font-semibold">¥{store.expectedLoss30Days.toLocaleString()}</td>
                      <td className="px-6 py-4 text-red-700">{store.highRiskMembers}人</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${store.successScore >= 80 ? "text-green-700" : store.successScore >= 60 ? "text-emerald-800" : store.successScore >= 40 ? "text-yellow-300" : "text-red-700"}`}>
                          {store.successScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
