"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import { dashboardHref, memberDetailHref } from "@/lib/routeContext";
import { calculateRiskScore, getRiskReasons } from "@/lib/riskScore";
import { getMemberSegment, getSegmentInfo, getSegmentColor } from "@/lib/memberSegmentation";
import { Member } from "@/types";
import { loadImportedMembers, mergeBaseAndImported } from "@/lib/importStore";

function getRiskScoreColor(score: number): string {
  if (score >= 80) {
    return "text-red-400";
  } else if (score >= 50) {
    return "text-yellow-400";
  } else {
    return "text-green-400";
  }
}

type Props = {
  initialMembers: Member[];
};

export default function MembersClient({ initialMembers }: Props) {
  console.log("[render-check] app/members/MembersClient.tsx rendered");
  const seg = useAppRouteSegment();
  const [members, setMembers] = useState<Member[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const merged = mergeBaseAndImported(initialMembers, loadImportedMembers());
    setMembers(merged);
  }, [initialMembers]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

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
      <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-8">会員一覧</h1>

      {members.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400">会員データを読み込み中...</p>
        </div>
      ) : (
        <>
          {isMobile ? (
            <div className="space-y-1.5">
            {members.map((member) => {
              const hasLastVisit = Boolean(member.lastVisitDate);
              const primaryVisitLabel = hasLastVisit ? "最終来店" : "来店間隔";
              const primaryVisitInfo = hasLastVisit ? member.lastVisitDate : member.visitInterval;
              return (
                <Link
                  key={member.id}
                  href={memberDetailHref(seg, member.id)}
                  className="block rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-2 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-blue-300 leading-5 [word-break:normal] break-normal whitespace-normal">
                      {member.name}
                    </p>
                  </div>

                  <div className="mt-1 space-y-0 text-[11px] leading-4">
                    <p className="text-zinc-200 truncate">
                      <span className="text-zinc-500">プラン：</span>
                      <span className="truncate">{member.plan}</span>
                    </p>
                    <p className="text-zinc-300">
                      <span className="text-zinc-500">{primaryVisitLabel}：</span>
                      {primaryVisitInfo || "-"}
                    </p>
                  </div>
                </Link>
              );
            })}
            </div>
          ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800 border-b border-zinc-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    名前
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Last Visit
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Visit Interval
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    リスクスコア
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Intervention Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    会員タイプ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    リスク理由
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {members.map((member) => {
                  const riskResult = calculateRiskScore(member);
                  const riskReasons = getRiskReasons(member);
                  const segment = getMemberSegment(member);
                  const segmentInfo = getSegmentInfo(segment);
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={memberDetailHref(seg, member.id)}
                          className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                        >
                          {member.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">{member.plan}</td>
                      <td className="px-6 py-4 text-zinc-300">
                        {member.lastVisitDate}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {member.visitInterval}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-semibold ${getRiskScoreColor(
                            riskResult.score
                          )}`}
                        >
                          {riskResult.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {member.interventionStatus}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSegmentColor(
                            segment
                          )}`}
                          title={segmentInfo.description}
                        >
                          {segmentInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">
                        {riskReasons[0] || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
          )}
        </>
      )}
    </div>
  );
}
