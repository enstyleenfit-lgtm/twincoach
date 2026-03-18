"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Member } from "@/types";
import { getStoreSummaries } from "@/lib/storeSummary";
import { getRevenueRiskForecast } from "@/lib/revenueForecast";
import { calculateRiskScore } from "@/lib/riskScore";

interface StoreListData {
  storeName: string;
  totalMembers: number;
  monthlyRevenue: number;
  highRiskMembers: number;
  estimatedRetentionRate: number;
  expectedLoss30Days: number;
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreListData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStores = async () => {
      try {
        const response = await fetch("/api/members");
        if (!response.ok) {
          console.error("Failed to fetch members");
          return;
        }
        const members: Member[] = await response.json();

        // 店舗別に集計
        const storeMap = new Map<string, StoreListData>();

        members.forEach((member) => {
          const storeName = member.storeName || "店舗未設定";
          const riskResult = calculateRiskScore(member);
          const forecast = getRevenueRiskForecast(member);

          if (!storeMap.has(storeName)) {
            storeMap.set(storeName, {
              storeName,
              totalMembers: 0,
              monthlyRevenue: 0,
              highRiskMembers: 0,
              estimatedRetentionRate: 0,
              expectedLoss30Days: 0,
            });
          }

          const store = storeMap.get(storeName)!;
          store.totalMembers += 1;
          store.monthlyRevenue += forecast.monthlyRevenue;
          store.expectedLoss30Days += forecast.expectedLoss30Days;

          if (riskResult.level === "high") {
            store.highRiskMembers += 1;
          }
        });

        // 継続率を計算
        storeMap.forEach((store) => {
          const storeMembers = members.filter(
            (m) => (m.storeName || "店舗未設定") === store.storeName
          );
          const lowRiskCount = storeMembers.filter(
            (m) => calculateRiskScore(m).level === "low"
          ).length;
          const mediumRiskCount = storeMembers.filter(
            (m) => calculateRiskScore(m).level === "medium"
          ).length;
          const safeMembers = lowRiskCount + mediumRiskCount;
          store.estimatedRetentionRate =
            store.totalMembers > 0
              ? (safeMembers / store.totalMembers) * 100
              : 0;
        });

        // 来月損失予測が高い順にソート
        const storesList = Array.from(storeMap.values()).sort(
          (a, b) => b.expectedLoss30Days - a.expectedLoss30Days
        );

        setStores(storesList);
      } catch (error) {
        console.error("Error loading stores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStores();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link
          href="/"
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800 border-b border-zinc-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    店舗名
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    会員数
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    月間売上
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    高リスク会員
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    継続率
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    来月損失予測
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {stores.map((store) => (
                  <tr
                    key={store.storeName}
                    className="hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/stores/${encodeURIComponent(store.storeName)}`}
                        className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                      >
                        {store.storeName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {store.totalMembers}人
                    </td>
                    <td className="px-6 py-4 text-white">
                      ¥{store.monthlyRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-red-400 font-semibold">
                        {store.highRiskMembers}人
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          store.estimatedRetentionRate >= 80
                            ? "text-green-400"
                            : store.estimatedRetentionRate >= 60
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {store.estimatedRetentionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-red-400 font-bold">
                        ¥{store.expectedLoss30Days.toLocaleString()}
                      </span>
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
}





