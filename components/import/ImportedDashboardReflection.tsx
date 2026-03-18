"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Member } from "@/types";
import { loadImportedMembers, mergeBaseAndImported } from "@/lib/importStore";
import { calculateRiskScore } from "@/lib/riskScore";
import { getRevenueRiskForecast } from "@/lib/revenueForecast";
import { getStoreSummaries } from "@/lib/storeSummary";
import { getChurnPrediction } from "@/lib/churnPrediction";

export function ImportedDashboardReflection() {
  const [members, setMembers] = useState<Member[] | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/members", { cache: "no-store" });
        const baseMembers: Member[] = res.ok ? await res.json() : [];
        const imported = loadImportedMembers();
        setMembers(mergeBaseAndImported(baseMembers, imported));
      } catch {
        const imported = loadImportedMembers();
        setMembers(imported);
      }
    };
    load();
  }, []);

  const computed = useMemo(() => {
    if (!members) return null;

    const highRiskCount = members.filter(
      (m) => calculateRiskScore(m).level === "high"
    ).length;

    const expectedLoss30Days = members.reduce((sum, m) => {
      const forecast = getRevenueRiskForecast(m);
      return sum + forecast.expectedLoss30Days;
    }, 0);

    const storeSummaries = getStoreSummaries(members)
      .sort((a, b) => b.monthlyRevenueAtRisk - a.monthlyRevenueAtRisk)
      .slice(0, 5);

    const churnRanking = members
      .map((m) => ({
        member: m,
        pred: getChurnPrediction(m),
      }))
      .sort((a, b) => b.pred.probability30Days - a.pred.probability30Days)
      .slice(0, 5);

    return { highRiskCount, expectedLoss30Days, storeSummaries, churnRanking };
  }, [members]);

  if (!computed) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
        <p className="text-zinc-400 text-sm">取り込みデータを反映中...</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            CSV取り込みデータの反映（ローカル保存）
          </h2>
          <p className="text-xs text-zinc-500">
            /import で保存した会員が、Dashboard / Members / Stores に反映されます（ブラウザ更新後も保持）
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/import"
            className="px-3 py-2 text-sm bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
          >
            CSVインポートへ
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="text-zinc-400 text-xs mb-1">高リスク会員数</div>
          <div className="text-2xl font-bold text-red-400">
            {computed.highRiskCount}人
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="text-zinc-400 text-xs mb-1">来月損失予測（合計）</div>
          <div className="text-2xl font-bold text-red-400">
            ¥{Math.round(computed.expectedLoss30Days).toLocaleString()}
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="text-zinc-400 text-xs mb-1">店舗数</div>
          <div className="text-2xl font-bold text-white">
            {computed.storeSummaries.length} / Top5表示
          </div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="text-zinc-400 text-xs mb-1">退会予測ランキング</div>
          <div className="text-2xl font-bold text-white">Top5</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm font-semibold text-white mb-3">店舗別サマリー（リスク売上上位）</div>
          {computed.storeSummaries.length === 0 ? (
            <p className="text-zinc-500 text-sm">店舗データがありません</p>
          ) : (
            <div className="space-y-2">
              {computed.storeSummaries.map((s) => (
                <div
                  key={s.storeName}
                  className="flex items-center justify-between gap-4 border border-zinc-800 bg-zinc-900/30 rounded p-3"
                >
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">{s.storeName}</div>
                    <div className="text-xs text-zinc-500">
                      会員 {s.totalMembers} / 高リスク {s.highRiskMembers}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 font-bold text-sm">
                      ¥{Math.round(s.monthlyRevenueAtRisk).toLocaleString()}
                    </div>
                    <div className="text-xs text-zinc-500">月間リスク売上</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <div className="text-sm font-semibold text-white mb-3">退会予測ランキング（30日）</div>
          {computed.churnRanking.length === 0 ? (
            <p className="text-zinc-500 text-sm">会員データがありません</p>
          ) : (
            <div className="space-y-2">
              {computed.churnRanking.map((x, idx) => (
                <Link
                  key={x.member.id}
                  href={`/members/${x.member.id}`}
                  className="block border border-zinc-800 bg-zinc-900/30 rounded p-3 hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs text-zinc-500 font-semibold">#{idx + 1}</div>
                      <div className="text-white font-semibold truncate">{x.member.name}</div>
                      <div className="text-xs text-zinc-500 truncate">
                        {x.member.plan} / {x.member.storeName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-400 font-bold">
                        {x.pred.probability30Days}%
                      </div>
                      <div className="text-xs text-zinc-500">30日退会確率</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


