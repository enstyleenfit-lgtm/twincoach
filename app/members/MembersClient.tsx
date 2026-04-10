"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import { dashboardHref, memberDetailHref } from "@/lib/routeContext";
import { calculateRiskScore, getRiskReasons } from "@/lib/riskScore";
import { getMemberSegment, getSegmentInfo, getSegmentColor } from "@/lib/memberSegmentation";
import { Member } from "@/types";
import { loadImportedMembers, mergeBaseAndImported } from "@/lib/importStore";
import {
  formatInterventionStatusForDisplay,
  formatPlanForDisplay,
  formatVisitIntervalForDisplay,
} from "@/lib/memberDisplayLabels";
import { sortMembersByDisplayName } from "@/lib/sortMembersByName";

function getRiskScoreColor(score: number): string {
  if (score >= 80) {
    return "text-red-600";
  } else if (score >= 50) {
    return "text-yellow-700";
  } else {
    return "text-green-700";
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
    setMembers(sortMembersByDisplayName(merged));
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
          className="text-blue-700 hover:text-blue-800 hover:underline text-sm"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>
      <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-8">会員一覧</h1>

      {members.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-8 text-center">
          <p className="text-slate-600">会員データを読み込み中...</p>
        </div>
      ) : (
        <>
          {isMobile ? (
            <div className="space-y-1.5">
            {members.map((member) => {
              const hasLastVisit = Boolean(member.lastVisitDate);
              const primaryVisitLabel = hasLastVisit ? "最終来店" : "来店間隔";
              const primaryVisitInfo = hasLastVisit
                ? member.lastVisitDate
                : formatVisitIntervalForDisplay(member.visitInterval);
              return (
                <Link
                  key={member.id}
                  href={memberDetailHref(seg, member.id)}
                  className="block rounded-md border border-slate-200 bg-white px-2.5 py-2 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-blue-300 leading-5 [word-break:normal] break-normal whitespace-normal">
                      {member.name}
                    </p>
                  </div>

                  <div className="mt-1 space-y-0 text-[11px] leading-4">
                    <p className="text-slate-800 truncate">
                      <span className="text-slate-500">プラン：</span>
                      <span className="truncate">
                        {formatPlanForDisplay(member.plan)}
                      </span>
                    </p>
                    <p className="text-slate-700">
                      <span className="text-slate-500">{primaryVisitLabel}：</span>
                      {primaryVisitInfo || "-"}
                    </p>
                  </div>
                </Link>
              );
            })}
            </div>
          ) : (
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    名前
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    プラン
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    最終来店日
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    来店間隔
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    リスクスコア
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    介入状況
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    会員タイプ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    リスク理由
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {members.map((member) => {
                  const riskResult = calculateRiskScore(member);
                  const riskReasons = getRiskReasons(member);
                  const segment = getMemberSegment(member);
                  const segmentInfo = getSegmentInfo(segment);
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-100/80 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={memberDetailHref(seg, member.id)}
                          className="text-blue-700 hover:text-blue-800 hover:underline font-medium"
                        >
                          {member.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {formatPlanForDisplay(member.plan)}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {member.lastVisitDate || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {formatVisitIntervalForDisplay(member.visitInterval)}
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
                      <td className="px-6 py-4 text-slate-700">
                        {formatInterventionStatusForDisplay(
                          member.interventionStatus
                        )}
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
                      <td className="px-6 py-4 text-slate-600 text-sm">
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
