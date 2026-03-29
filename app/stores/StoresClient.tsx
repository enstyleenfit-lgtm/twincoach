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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link
          href={dashboardHref(seg)}
          className="text-blue-400 hover:text-blue-300 hover:underline text-sm"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>
      <h1 className="text-4xl font-bold mb-8">店舗一覧</h1>

      {isLoading ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400">店舗データを読み込み中...</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400">店舗データがありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(rankers) as RankingTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded border text-xs transition-colors ${
                  activeTab === tab
                    ? "text-green-300 bg-green-500/10 border-green-500/30"
                    : "text-zinc-400 bg-zinc-900 border-zinc-700 hover:border-zinc-600"
                }`}
              >
                {rankers[tab].label}
              </button>
            ))}
          </div>
          <p className="text-zinc-400 text-xs">{rankers[activeTab].description}</p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800 border-b border-zinc-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">店舗名</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">会員数</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">推定継続率</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">月間売上</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">来月損失予測</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">高リスク会員数</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">成功度スコア</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {rankedStores.map((store, index) => (
                    <tr key={store.storeName} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-zinc-500 text-xs mr-2">#{index + 1}</span>
                        <Link
                          href={storeDetailHref(seg, store.storeName)}
                          className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                        >
                          {store.storeName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">{store.totalMembers}人</td>
                      <td className="px-6 py-4 text-zinc-300">{store.estimatedRetentionRate.toFixed(1)}%</td>
                      <td className="px-6 py-4 text-zinc-100">¥{store.monthlyRevenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-red-300 font-semibold">¥{store.expectedLoss30Days.toLocaleString()}</td>
                      <td className="px-6 py-4 text-red-300">{store.highRiskMembers}人</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${store.successScore >= 80 ? "text-green-400" : store.successScore >= 60 ? "text-emerald-300" : store.successScore >= 40 ? "text-yellow-300" : "text-red-300"}`}>
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
