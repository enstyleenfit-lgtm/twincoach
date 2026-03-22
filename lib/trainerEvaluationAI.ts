import { getChurnPrediction } from "@/lib/churnPrediction";
import { estimateChurnReasons } from "@/lib/churnReasonAI";
import { generateNextActions } from "@/lib/nextActionAI";
import { calculateRiskScore } from "@/lib/riskScore";
import { getRevenueAtRisk } from "@/lib/revenueRisk";
import { getDaysSinceDate } from "@/lib/memberDateUtils";
import type { Member, Session, TrainerEvaluationResult } from "@/types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toLevel(score: number): TrainerEvaluationResult["level"] {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "watch";
  return "support_needed";
}

export function getTrainerEvaluationLevelLabel(level: TrainerEvaluationResult["level"]): string {
  switch (level) {
    case "excellent":
      return "強みあり";
    case "good":
      return "安定";
    case "watch":
      return "改善余地あり";
    case "support_needed":
      return "支援優先";
  }
}

export function evaluateTrainerPerformance(
  members: Member[],
  trainerName: string,
  sessions?: Session[]
): TrainerEvaluationResult {
  const trainerMembers = members.filter((m) => (m.assignedTrainer || "未割り当て") === trainerName);
  const totalMembers = trainerMembers.length;

  if (totalMembers === 0) {
    return {
      trainerName,
      summaryScore: 0,
      level: "support_needed",
      strengths: [],
      improvementPoints: [
        {
          title: "担当会員データが不足",
          description: "担当会員の割り当て後に評価AIが有効になります。",
        },
      ],
      actionItems: ["担当会員の割り当て状況を確認する"],
      metrics: {
        totalMembers: 0,
        highRiskMembers: 0,
        estimatedRetentionRate: 0,
        highChurn30DaysMembers: 0,
        annualRevenueAtRisk: 0,
        earlyHighRiskMembers90Days: 0,
        sessionRecordCount: 0,
        sessionRecordQuality: 0,
      },
    };
  }

  let highRiskMembers = 0;
  let safeMembers = 0;
  let highChurn30DaysMembers = 0;
  let annualRevenueAtRisk = 0;
  let earlyHighRiskMembers90Days = 0;

  const reasonCount = new Map<string, number>();
  const actionCount = new Map<string, number>();

  for (const member of trainerMembers) {
    const risk = calculateRiskScore(member);
    const churn = getChurnPrediction(member);
    const churnReasons = estimateChurnReasons(member, sessions);
    const nextActions = generateNextActions(member, sessions, churnReasons);

    if (risk.level === "high") {
      highRiskMembers += 1;
      annualRevenueAtRisk += getRevenueAtRisk(member).annualRevenueAtRisk;
      if (getDaysSinceDate(member.joinDate) <= 90) {
        earlyHighRiskMembers90Days += 1;
      }
    } else {
      safeMembers += 1;
    }

    if (churn.label30Days === "high") {
      highChurn30DaysMembers += 1;
    }

    for (const reason of churnReasons.reasons.slice(0, 2)) {
      reasonCount.set(reason.tag, (reasonCount.get(reason.tag) ?? 0) + 1);
    }
    for (const action of nextActions.actions.slice(0, 2)) {
      actionCount.set(action.title, (actionCount.get(action.title) ?? 0) + 1);
    }
  }

  const estimatedRetentionRate = (safeMembers / totalMembers) * 100;
  const highRiskRatio = highRiskMembers / totalMembers;
  const highChurnRatio = highChurn30DaysMembers / totalMembers;
  const earlyHighRiskRatio = earlyHighRiskMembers90Days / totalMembers;
  const annualRiskPerMember = annualRevenueAtRisk / totalMembers;

  const trainerSessions = (sessions ?? []).filter((s) => (s.trainerName || "").trim() === trainerName.trim());
  const sessionRecordCount = trainerSessions.length;
  const qualityScoreRaw =
    trainerSessions.length === 0
      ? 0
      : trainerSessions.reduce((sum, s) => {
          const conversation = (s.conversationSummary || "").trim().length >= 10 ? 1 : 0;
          const menu = (s.menuSummary || "").trim().length >= 8 ? 1 : 0;
          const action = (s.nextAction || "").trim().length >= 8 ? 1 : 0;
          return sum + (conversation + menu + action) / 3;
        }, 0) / trainerSessions.length;
  const sessionRecordQuality = Math.round(qualityScoreRaw * 100);

  let score = 50;
  score += (1 - highRiskRatio) * 20;
  score += (estimatedRetentionRate / 100) * 20;
  score += clamp(15 - annualRiskPerMember / 12000, 0, 15);
  score -= highChurnRatio * 10;
  score -= earlyHighRiskRatio * 10;
  score += clamp(sessionRecordCount * 1.5, 0, 10);
  score += (sessionRecordQuality / 100) * 15 - 7;
  const summaryScore = Math.round(clamp(score, 0, 100));
  const level = toLevel(summaryScore);

  const strengths: TrainerEvaluationResult["strengths"] = [];
  const improvementPoints: TrainerEvaluationResult["improvementPoints"] = [];

  if (highRiskRatio <= 0.25) {
    strengths.push({
      title: "高リスク会員比率が抑えられている",
      description: "担当会員のリスク分布が安定しており、予防的な支援が機能しています。",
    });
  } else {
    improvementPoints.push({
      title: "高リスク会員の予防フォロー強化",
      description: "高リスク会員比率が高めのため、早期介入の頻度を上げる余地があります。",
    });
  }

  if (estimatedRetentionRate >= 70) {
    strengths.push({
      title: "継続率が安定",
      description: "継続が見込める会員の割合が高く、日常フォローが安定しています。",
    });
  } else {
    improvementPoints.push({
      title: "継続率の底上げ余地",
      description: "中リスク会員の離脱予防フォローを増やすことで改善が期待できます。",
    });
  }

  if (earlyHighRiskMembers90Days >= 2) {
    improvementPoints.push({
      title: "初期90日会員のフォロー強化",
      description: "入会後90日以内の高リスク会員が複数いるため、定着支援の優先度が高いです。",
    });
  }

  if (sessionRecordCount >= totalMembers && sessionRecordQuality >= 70) {
    strengths.push({
      title: "記録運用の質が高い",
      description: "セッション記録数と記録内容が安定しており、振り返りに活用しやすい状態です。",
    });
  } else {
    improvementPoints.push({
      title: "セッション記録の運用改善",
      description: "記録数または記録の具体性に改善余地があります。要点記録の標準化が有効です。",
    });
  }

  const topReason = Array.from(reasonCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topAction = Array.from(actionCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

  const actionItems = [
    earlyHighRiskMembers90Days > 0
      ? "初期90日会員の面談を今週中に実施"
      : "中リスク会員へ週次フォローを実施",
    highRiskMembers > 0
      ? "高リスク会員の次回予約取得率を上げる"
      : "低リスク会員の継続動機を維持する声掛けを継続",
    topAction ? `チームで「${topAction}」の実施手順を共通化` : "対応フローを週次で振り返る",
  ];

  if (topReason && improvementPoints.length < 3) {
    improvementPoints.push({
      title: `${topReason}に対する対応設計`,
      description: `担当会員で「${topReason}」が多く見られるため、対応テンプレートを整備すると再現性が上がります。`,
    });
  }

  return {
    trainerName,
    summaryScore,
    level,
    strengths: strengths.slice(0, 3),
    improvementPoints: improvementPoints.slice(0, 3),
    actionItems: actionItems.slice(0, 3),
    metrics: {
      totalMembers,
      highRiskMembers,
      estimatedRetentionRate: Math.round(estimatedRetentionRate * 10) / 10,
      highChurn30DaysMembers,
      annualRevenueAtRisk: Math.round(annualRevenueAtRisk),
      earlyHighRiskMembers90Days,
      sessionRecordCount,
      sessionRecordQuality,
    },
  };
}
