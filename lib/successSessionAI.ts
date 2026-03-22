import { estimateChurnReasons } from "@/lib/churnReasonAI";
import { sessionWithConversationTags } from "@/lib/conversationTagAI";
import { estimateMemberLTV, getLTVLevel } from "@/lib/ltvPrediction";
import { generateNextActions } from "@/lib/nextActionAI";
import { calculateRiskScore } from "@/lib/riskScore";
import { getChurnPrediction } from "@/lib/churnPrediction";
import { parseVisitIntervalDays } from "@/lib/memberDateUtils";
import type {
  HighPerformingSessionTrait,
  Member,
  Session,
  SuccessSessionAnalysis,
  SuccessSessionPattern,
} from "@/types";

function impactFromRatio(ratio: number, base: number): number {
  return Math.max(40, Math.min(95, Math.round(base + ratio * 45)));
}

function daysSinceLastVisit(iso: string): number {
  const t = new Date(iso || "").getTime();
  if (Number.isNaN(t)) return 9999;
  return Math.max(0, (Date.now() - t) / 86400000);
}

/** デモ・過去CSVでも「直近」を拾えるよう、コホート内の最新来店からの差で判定 */
function cohortLatestVisitMs(members: Member[]): number {
  const times = members
    .map((m) => new Date(m.lastVisitDate).getTime())
    .filter((t) => !Number.isNaN(t));
  return times.length ? Math.max(...times) : 0;
}

function isRecentVisitRelative(m: Member, cohortLatestMs: number, maxGapDays: number): boolean {
  const t = new Date(m.lastVisitDate).getTime();
  if (!cohortLatestMs || Number.isNaN(t)) return false;
  return cohortLatestMs - t <= maxGapDays * 86400000;
}

function daysSinceJoin(iso: string): number {
  const t = new Date(iso || "").getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (Date.now() - t) / 86400000);
}

function appendMemberDerivedPatterns(
  targetMembers: Member[],
  patterns: SuccessSessionPattern[],
  sessionBackedCount: number
): void {
  const n = Math.max(1, targetMembers.length);
  const titles = new Set(patterns.map((p) => p.title));
  const cohortLatest = cohortLatestVisitMs(targetMembers);

  const push = (p: SuccessSessionPattern) => {
    if (titles.has(p.title)) return;
    patterns.push(p);
    titles.add(p.title);
  };

  const recentVisit = targetMembers.filter((m) => isRecentVisitRelative(m, cohortLatest, 60)).length;
  if (recentVisit > 0) {
    push({
      title: "直近の来店リズムが安定",
      description:
        sessionBackedCount > 0
          ? "セッション記録と最終来店日の両方から、途切れにくい来店サイクルが読み取れます。"
          : "会員マスタの最終来店日から、継続的な来店リズムが読み取れます。",
      impactScore: impactFromRatio(recentVisit / n, 54),
    });
  }

  const easyReservation = targetMembers.filter((m) => m.reservationDifficultyLevel === "easy").length;
  if (easyReservation > 0) {
    push({
      title: "希望に沿った予約枠の確保",
      description: "取りやすい予約状況が維持されており、継続の摩擦が低い層に多く見られます。",
      impactScore: impactFromRatio(easyReservation / n, 53),
    });
  }

  const slotMatch = targetMembers.filter(
    (m) =>
      Boolean(m.preferredTimeSlot) &&
      Boolean(m.bookedTimeSlot) &&
      m.preferredTimeSlot === m.bookedTimeSlot
  ).length;
  if (slotMatch > 0) {
    push({
      title: "希望時間帯での予約維持",
      description: "希望枠と実際の予約が一致しており、生活リズムにフィットした運用ができています。",
      impactScore: impactFromRatio(slotMatch / n, 56),
    });
  }

  const noCancel = targetMembers.filter((m) => !m.hasCancellationHistory).length;
  if (noCancel > 0 && noCancel >= Math.ceil(n * 0.5)) {
    push({
      title: "キャンセル履歴の少ない継続",
      description: "直近のキャンセル履歴が少ない会員が多く、コミットメントが安定している傾向です。",
      impactScore: impactFromRatio(noCancel / n, 51),
    });
  }

  const midFreq = targetMembers.filter((m) => {
    const d = parseVisitIntervalDays(m.visitInterval);
    return d >= 8 && d <= 14;
  }).length;
  if (midFreq > 0) {
    push({
      title: "中頻度でも継続来店",
      description: "週複数回ではなくても、一定間隔での来店が続いている成功パターンです。",
      impactScore: impactFromRatio(midFreq / n, 49),
    });
  }

  const longTenureRecent = targetMembers.filter(
    (m) =>
      daysSinceJoin(m.joinDate) >= 90 && isRecentVisitRelative(m, cohortLatest, 45)
  ).length;
  if (longTenureRecent > 0) {
    push({
      title: "長期会員の活動継続",
      description: "入会から時間が経過した会員でも来店が途切れにくく、定着が進んでいます。",
      impactScore: impactFromRatio(longTenureRecent / n, 57),
    });
  }

  if (targetMembers.length === 1) {
    const m = targetMembers[0];
    const d = parseVisitIntervalDays(m.visitInterval);
    if (d > 7 && isRecentVisitRelative(m, cohortLatest, 60)) {
      push({
        title: "間隔は空くが来店は継続",
        description: "来店間隔はやや長めでも、直近は途切れず通えている点が成功サインです。",
        impactScore: 62,
      });
    }
    if (m.assignedTrainer?.trim()) {
      push({
        title: "担当トレーナーとの継続関係",
        description: "担当が固定されており、関係性の蓄積が継続に寄与している可能性があります。",
        impactScore: 55,
      });
    }
  }
}

function supplementHighPerformingTraits(
  traits: HighPerformingSessionTrait[],
  targetMembers: Member[],
  targetSessions: Session[]
): HighPerformingSessionTrait[] {
  const out = [...traits];
  const seen = new Set(out.map((t) => t.trait));

  const add = (t: HighPerformingSessionTrait) => {
    if (seen.has(t.trait)) return;
    out.push(t);
    seen.add(t.trait);
  };

  if (targetSessions.length > 0) {
    add({
      trait: "セッション記録の蓄積",
      description: "会話要約・次回アクションが残っており、再現性の高い振り返りが可能です。",
    });
  }

  if (targetMembers.some((m) => m.reservationDifficultyLevel === "easy")) {
    add({
      trait: "予約摩擦の低減",
      description: "取りやすい枠を維持し、次回来店のハードルを下げる意識が効いています。",
    });
  }

  const latest = cohortLatestVisitMs(targetMembers);
  if (targetMembers.some((m) => isRecentVisitRelative(m, latest, 30))) {
    add({
      trait: "直近来店のフォロー",
      description: "生活変化が出やすいタイミングでも、来店が続いている点を評価材料にします。",
    });
  }

  const defaults: HighPerformingSessionTrait[] = [
    {
      trait: "次回アクションの明確化",
      description: "セッション後に1つの実行項目を決める運用が有効です。",
    },
    {
      trait: "コンディション起点の声かけ",
      description: "体調・睡眠・仕事負荷を短時間で確認し、メニューと頻度を合わせます。",
    },
    {
      trait: "小さな成功の言語化",
      description: "変化を一つ拾い上げ、次回までの再現しやすい行動に落とし込みます。",
    },
  ];

  for (const t of defaults) {
    if (out.length >= 3) break;
    add(t);
  }

  return out.slice(0, 3);
}

export function analyzeSuccessfulSessions(
  members: Member[],
  sessions: Session[] = []
): SuccessSessionAnalysis {
  if (members.length === 0) {
    return {
      commonPatterns: [],
      highPerformingSessionTraits: [],
      recommendedActions: [],
    };
  }

  const successfulMembers = members.filter((member) => {
    const risk = calculateRiskScore(member);
    const churn = getChurnPrediction(member);
    const ltv = estimateMemberLTV(member);
    const ltvLevel = getLTVLevel(ltv.riskAdjustedLTV);
    return risk.level === "low" || churn.label30Days === "low" || ltvLevel === "high";
  });

  const targetMembers = successfulMembers.length > 0 ? successfulMembers : members;
  const targetMemberNames = new Set(
    targetMembers.map((m) => (m.name || "").trim()).filter(Boolean)
  );
  const targetSessions = sessions
    .filter((s) => targetMemberNames.has((s.memberName || "").trim()))
    .map(sessionWithConversationTags);

  const commonPatterns: SuccessSessionPattern[] = [];
  const highPerformingSessionTraits: HighPerformingSessionTrait[] = [];

  const weeklyVisitMembers = targetMembers.filter((m) => {
    const days = parseVisitIntervalDays(m.visitInterval);
    return days > 0 && days <= 7;
  }).length;
  if (weeklyVisitMembers > 0) {
    const ratio = weeklyVisitMembers / targetMembers.length;
    commonPatterns.push({
      title: "週1回来店の維持",
      description: "継続会員で来店頻度が安定しているパターンです。",
      impactScore: impactFromRatio(ratio, 58),
    });
  }

  const reservationActionCount = targetSessions.filter((s) =>
    /(予約|次回|確定|リマインド)/.test(`${s.nextAction} ${s.conversationSummary}`)
  ).length;
  if (reservationActionCount > 0) {
    const ratio = reservationActionCount / Math.max(1, targetSessions.length);
    commonPatterns.push({
      title: "次回予約をその場で確定",
      description: "成功セッションで次回予約取得を明示している割合が高いです。",
      impactScore: impactFromRatio(ratio, 55),
    });
  }

  const tagCounts = new Map<string, number>();
  for (const session of targetSessions) {
    for (const tag of session.tags ?? []) {
      tagCounts.set(tag.tag, (tagCounts.get(tag.tag) ?? 0) + 1);
    }
  }
  const topTag = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topTag) {
    commonPatterns.push({
      title: `${topTag[0]}の定期ヒアリング`,
      description: "会話タグの継続的なフォローが、離脱予防に寄与している可能性があります。",
      impactScore: impactFromRatio(topTag[1] / Math.max(1, targetSessions.length), 52),
    });
  }

  const menuSupportCount = targetSessions.filter((s) =>
    /(フォーム|軽め|調整|姿勢|可動域)/.test(s.menuSummary || "")
  ).length;
  if (menuSupportCount > 0) {
    commonPatterns.push({
      title: "状態に合わせたメニュー調整",
      description: "会員状態に合わせた負荷調整メニューが多く見られます。",
      impactScore: impactFromRatio(menuSupportCount / Math.max(1, targetSessions.length), 50),
    });
  }

  if (targetSessions.length === 0 || commonPatterns.length < 3) {
    appendMemberDerivedPatterns(targetMembers, commonPatterns, targetSessions.length);
  }

  const actionTraitCounts = new Map<string, { trait: string; description: string; count: number }>();
  for (const member of targetMembers) {
    const reasons = estimateChurnReasons(member, targetSessions);
    const nextActions = generateNextActions(member, targetSessions, reasons);
    for (const action of nextActions.actions.slice(0, 2)) {
      const key = action.title;
      const prev = actionTraitCounts.get(key);
      if (prev) {
        prev.count += 1;
      } else {
        actionTraitCounts.set(key, {
          trait: action.title,
          description: `成功会員で再現性が高い対応（${action.type}）`,
          count: 1,
        });
      }
    }
  }
  highPerformingSessionTraits.push(
    ...Array.from(actionTraitCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((x) => ({ trait: x.trait, description: x.description }))
  );

  const finalTraits = supplementHighPerformingTraits(
    highPerformingSessionTraits,
    targetMembers,
    targetSessions
  );

  const sortedPatterns = [...commonPatterns]
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 3);

  const recommendedActions = [
    sortedPatterns[0]?.title ? `「${sortedPatterns[0].title}」を標準手順に追加` : null,
    finalTraits[0]?.trait ? `「${finalTraits[0].trait}」を担当者間でロールプレイ` : null,
    targetSessions.length > 0
      ? "セッション記録に会話タグと次回アクションを必ず残す"
      : "/import からセッションCSVを取り込むと、次回予約・会話タグの分析がより精密になります",
  ].filter((v): v is string => Boolean(v));

  return {
    commonPatterns: sortedPatterns,
    highPerformingSessionTraits: finalTraits,
    recommendedActions,
  };
}
