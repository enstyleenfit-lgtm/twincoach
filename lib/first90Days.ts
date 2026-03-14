import { Member } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";
import { getInterventionSuggestion } from "@/lib/interventionSuggestion";
import { getMemberSegment } from "@/lib/memberSegmentation";

export interface First90DaysMember {
  member: Member;
  daysSinceJoin: number;
  riskResult: ReturnType<typeof calculateRiskScore>;
  suggestion: ReturnType<typeof getInterventionSuggestion>;
  segment: ReturnType<typeof getMemberSegment>;
}

export interface First90DaysRiskSummary {
  membersInFirst30Days: First90DaysMember[];
  membersIn31to60Days: First90DaysMember[];
  membersIn61to90Days: First90DaysMember[];
  highRiskFirst90DaysMembers: First90DaysMember[];
  first90DaysRetentionAlertCount: number;
}

/**
 * 日付文字列から現在日までの日数を計算
 */
function getDaysSince(dateString: string): number {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - date.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 入会後90日以内の会員を取得
 */
export function getFirst90DaysMembers(members: Member[]): First90DaysMember[] {
  return members
    .map((member) => {
      const daysSinceJoin = getDaysSince(member.joinDate);
      return {
        member,
        daysSinceJoin,
        riskResult: calculateRiskScore(member),
        suggestion: getInterventionSuggestion(member),
        segment: getMemberSegment(member),
      };
    })
    .filter((item) => item.daysSinceJoin <= 90)
    .sort((a, b) => b.riskResult.score - a.riskResult.score);
}

/**
 * 入会後90日以内のリスクサマリーを取得
 */
export function getFirst90DaysRiskSummary(
  members: Member[]
): First90DaysRiskSummary {
  const first90DaysMembers = getFirst90DaysMembers(members);

  const membersInFirst30Days = first90DaysMembers.filter(
    (item) => item.daysSinceJoin <= 30
  );
  const membersIn31to60Days = first90DaysMembers.filter(
    (item) => item.daysSinceJoin > 30 && item.daysSinceJoin <= 60
  );
  const membersIn61to90Days = first90DaysMembers.filter(
    (item) => item.daysSinceJoin > 60 && item.daysSinceJoin <= 90
  );

  const highRiskFirst90DaysMembers = first90DaysMembers.filter(
    (item) => item.riskResult.level === "high"
  );

  // 要対応会員数（medium以上またはhighリスク）
  const first90DaysRetentionAlertCount = first90DaysMembers.filter(
    (item) =>
      item.riskResult.level === "medium" || item.riskResult.level === "high"
  ).length;

  return {
    membersInFirst30Days,
    membersIn31to60Days,
    membersIn61to90Days,
    highRiskFirst90DaysMembers,
    first90DaysRetentionAlertCount,
  };
}




