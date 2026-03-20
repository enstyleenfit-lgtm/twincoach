import type { Member, RevenueImprovementPlan } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";
import { getRevenueRiskForecast } from "@/lib/revenueForecast";
import { estimateMemberLTV, getLTVLevel } from "@/lib/ltvPrediction";
import { getFirst90DaysRiskSummary } from "@/lib/first90Days";
import { getReservationAnalysis } from "@/lib/reservationAnalysis";
import {
  getRevenueDefenseSimulation,
  getStoreRevenueDefenseSimulation,
} from "@/lib/revenueDefenseSimulation";

function formatCurrencyYen(n: number): string {
  return `¥${Math.round(Math.max(0, n)).toLocaleString("ja-JP")}`;
}

type ImproveTheme = "ltv" | "loss" | "90" | "reservation" | "retention";

/**
 * 継続率・LTV・収益リスク・収益防衛シミュレーションを統合し、
 * 経営判断のための改善テーマとアクションをルールベースで提案する。
 */
export function generateRevenueImprovementPlan(
  members: Member[],
  storeName?: string
): RevenueImprovementPlan {
  const scope = storeName
    ? members.filter((m) => m.storeName === storeName)
    : members;

  const emptyMetrics = {
    monthlyRevenue: 0,
    avgRiskAdjustedLTV: 0,
    expectedLoss30Days: 0,
    expectedLoss60Days: 0,
    highRiskMembers: 0,
    first90HighRiskCount: 0,
    reservationRiskCount: 0,
  };

  if (scope.length === 0) {
    return {
      topPriority: "会員データがないためプランを算出できません",
      expectedImpact: "—",
      actions: [
        { title: "対象店舗・会員を登録してください", impact: "データ投入後に再計算されます" },
      ],
      highImpactMemberCount: 0,
      metrics: emptyMetrics,
    };
  }

  let monthlyRevenue = 0;
  let expectedLoss30Days = 0;
  let expectedLoss60Days = 0;
  let ltvSum = 0;
  let highRiskMembers = 0;

  const enriched = scope.map((member) => {
    const forecast = getRevenueRiskForecast(member);
    const risk = calculateRiskScore(member);
    const ltv = estimateMemberLTV(member);
    monthlyRevenue += forecast.monthlyRevenue;
    expectedLoss30Days += forecast.expectedLoss30Days;
    expectedLoss60Days += forecast.expectedLoss60Days;
    ltvSum += ltv.riskAdjustedLTV;
    if (risk.level === "high") highRiskMembers += 1;
    return { member, forecast, risk, ltv };
  });

  const avgRiskAdjustedLTV =
    scope.length > 0 ? Math.round(ltvSum / scope.length) : 0;

  const first90 = getFirst90DaysRiskSummary(scope);
  const first90HighRiskCount = first90.highRiskFirst90DaysMembers.length;

  const reservation = getReservationAnalysis(scope);
  const reservationRiskCount = reservation.reservationRiskMembers.length;

  const defenseSim = storeName
    ? getStoreRevenueDefenseSimulation(members, storeName)
    : getRevenueDefenseSimulation(scope);

  const highLtvHighRisk = enriched
    .filter(
      (x) =>
        getLTVLevel(x.ltv.riskAdjustedLTV) === "high" &&
        x.risk.level === "high"
    )
    .sort(
      (a, b) => b.forecast.expectedLoss30Days - a.forecast.expectedLoss30Days
    );

  const highImpactMemberCount = highLtvHighRisk.length;
  const top5HighLtvLoss = highLtvHighRisk
    .slice(0, 5)
    .reduce((s, x) => s + x.forecast.expectedLoss30Days, 0);

  const lossIntensity =
    monthlyRevenue > 0 ? expectedLoss30Days / monthlyRevenue : 0;

  const scoreLtv =
    highImpactMemberCount > 0
      ? top5HighLtvLoss * 1.25 + highImpactMemberCount * 25_000
      : 0;
  const scoreLoss = expectedLoss30Days * (0.65 + Math.min(lossIntensity, 0.5));
  const score90 =
    first90HighRiskCount *
    (monthlyRevenue / Math.max(scope.length, 1)) *
    0.08;
  const scoreRes =
    reservationRiskCount *
    (expectedLoss30Days / Math.max(scope.length, 1)) *
    0.12;

  const candidates: { theme: ImproveTheme; score: number }[] = [
    { theme: "ltv", score: scoreLtv },
    { theme: "loss", score: scoreLoss },
    { theme: "90", score: score90 },
    { theme: "reservation", score: scoreRes },
  ];
  const ranked = candidates.slice().sort((a, b) => b.score - a.score);

  let theme: ImproveTheme = ranked[0].theme;
  if (theme === "ltv" && highImpactMemberCount === 0) {
    const alt = ranked.find((r) => r.theme !== "ltv" && r.score > 0);
    theme = alt?.theme ?? "retention";
  }
  if (ranked.every((r) => r.score === 0)) {
    theme = "retention";
  }

  const topPriorityMap: Record<ImproveTheme, string> = {
    ltv: "高LTV会員の離脱防止",
    loss: "30日期待損失の圧縮",
    "90": "初期90日フォロー強化",
    reservation: "予約体験の改善と離脱予防",
    retention: "継続率の底上げと優良顧客の維持",
  };

  const defenseFloor = Math.round(defenseSim.protectedRevenueIfTop5Saved);
  const expectedImpact =
    defenseFloor > 0
      ? `月間 +${formatCurrencyYen(defenseFloor)} の防衛余地（上位損失帯の介入想定）`
      : "介入により損失ペースの抑制が見込めます";

  const actions: RevenueImprovementPlan["actions"] = [];

  if (highImpactMemberCount > 0) {
    const amt = Math.min(
      top5HighLtvLoss,
      defenseSim.protectedRevenueIfTop5Saved || top5HighLtvLoss
    );
    actions.push({
      title: "高LTV高リスク会員 上位5名を優先介入",
      impact: `月間 ${formatCurrencyYen(amt)} 防衛見込み`,
    });
  }

  if (first90HighRiskCount > 0) {
    actions.push({
      title: "初期90日会員フォロー強化",
      impact: "継続率 +2% 見込み",
    });
  }

  if (reservationRiskCount > 0) {
    actions.push({
      title: "予約問題会員へ代替枠提案",
      impact: `${reservationRiskCount}名の体験改善・離脱予防`,
    });
  }

  if (actions.length === 0 && expectedLoss30Days > 0) {
    actions.push({
      title: "30日期待損失が高い会員へ優先接触",
      impact: `月間 ${formatCurrencyYen(defenseSim.protectedRevenueIfTop3Saved)} 規模の防衛余地（上位3名）`,
    });
  }

  const padding: RevenueImprovementPlan["actions"] = [
    {
      title: "高リスク会員のフォロー週次レビュー",
      impact: `未防衛の損失 ${formatCurrencyYen(Math.max(0, expectedLoss30Days - defenseFloor))} を意識した優先順位付け`,
    },
    {
      title: "プラン・成果の可視化と価値再訴求",
      impact: `平均LTV ${formatCurrencyYen(avgRiskAdjustedLTV)} 水準の維持`,
    },
    {
      title: "成功セッションパターンの横展開",
      impact: "店舗KPIの安定化",
    },
  ];

  for (const p of padding) {
    if (actions.length >= 3) break;
    if (!actions.some((a) => a.title === p.title)) {
      actions.push(p);
    }
  }

  return {
    topPriority: topPriorityMap[theme],
    expectedImpact,
    actions: actions.slice(0, 3),
    highImpactMemberCount,
    metrics: {
      monthlyRevenue,
      avgRiskAdjustedLTV,
      expectedLoss30Days,
      expectedLoss60Days,
      highRiskMembers,
      first90HighRiskCount,
      reservationRiskCount,
    },
  };
}
