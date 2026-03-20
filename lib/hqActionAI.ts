import type { Member, HQActionPlan } from "@/types";
import { getStoreSummaries } from "@/lib/storeSummary";
import { getPriceRevisionImpact } from "@/lib/priceRevisionImpact";
import { getReservationAnalysisByStore } from "@/lib/reservationAnalysis";
import { generateRevenueImprovementPlan } from "@/lib/revenueImprovementAI";

function countByStore(members: Member[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const mem of members) {
    const sn = mem.storeName || "店舗未設定";
    m.set(sn, (m.get(sn) ?? 0) + 1);
  }
  return m;
}

type IssueKind =
  | "price"
  | "loss"
  | "retention"
  | "reservation"
  | "first90"
  | "general";

/**
 * 全店舗のサマリー・収益リスク・価格改定影響・予約リスク・収益改善AIを統合し、
 * 本部が今月の打ち手を決めるための要約プランを返す。
 */
export function generateHQActionPlan(members: Member[]): HQActionPlan {
  if (members.length === 0) {
    return {
      topIssue: "会員データがありません",
      priorityLabel: "low",
      summary: "データ連携後に本部向けの改善提案を表示できます。",
      actions: [
        "会員マスタを最新化する",
        "店舗別KPIの取り込みを確認する",
        "価格改定フラグの整備を進める",
      ],
      priorityStores: [],
    };
  }

  const summaries = getStoreSummaries(members);
  const priceImpact = getPriceRevisionImpact(members);
  const targetCount = priceImpact.targetMembers.length;
  const highRiskAfterPriceCount = priceImpact.highRiskTargetMembers.length;
  const highRiskPriceByStore = countByStore(priceImpact.highRiskTargetMembers);
  const targetsByStore = countByStore(priceImpact.targetMembers);

  const reservationByStore = new Map<string, number>();
  for (const s of summaries) {
    const ra = getReservationAnalysisByStore(members, s.storeName);
    reservationByStore.set(s.storeName, ra.reservationRiskMembers.length);
  }

  const totalReservationRisk = reservationByStore.values().reduce(
    (a, b) => a + b,
    0
  );
  const reservationRatio =
    members.length > 0 ? totalReservationRisk / members.length : 0;

  const totalExpectedLoss30 = summaries.reduce(
    (sum, s) => sum + s.expectedLoss30Days,
    0
  );
  const sortedByLoss = [...summaries].sort(
    (a, b) => b.expectedLoss30Days - a.expectedLoss30Days
  );
  const topLossShare =
    totalExpectedLoss30 > 0 && sortedByLoss[0]
      ? sortedByLoss[0].expectedLoss30Days / totalExpectedLoss30
      : 0;

  const lowRetentionStores = summaries.filter(
    (s) => s.totalMembers >= 2 && s.estimatedRetentionRate < 65
  );

  const orgRev = generateRevenueImprovementPlan(members);
  const first90High = orgRev.metrics.first90HighRiskCount;

  const priceRiskRatio =
    targetCount > 0 ? highRiskAfterPriceCount / targetCount : 0;

  let issue: IssueKind = "general";
  let priorityLabel: HQActionPlan["priorityLabel"] = "medium";

  if (
    targetCount >= 1 &&
    (highRiskAfterPriceCount >= 3 ||
      (targetCount >= 2 && priceRiskRatio >= 0.35))
  ) {
    issue = "price";
    priorityLabel = "high";
  } else if (
    topLossShare >= 0.38 &&
    totalExpectedLoss30 > 0 &&
    sortedByLoss[0]
  ) {
    issue = "loss";
    priorityLabel = topLossShare >= 0.5 ? "high" : "medium";
  } else if (lowRetentionStores.length >= 2) {
    issue = "retention";
    priorityLabel = lowRetentionStores.length >= 4 ? "high" : "medium";
  } else if (reservationRatio >= 0.12 || totalReservationRisk >= 8) {
    issue = "reservation";
    priorityLabel = reservationRatio >= 0.2 ? "high" : "medium";
  } else if (first90High >= 4) {
    issue = "first90";
    priorityLabel = first90High >= 8 ? "high" : "medium";
  } else {
    issue = "general";
    priorityLabel =
      orgRev.metrics.expectedLoss30Days >
      orgRev.metrics.monthlyRevenue * 0.08
        ? "medium"
        : "low";
  }

  const topIssueMap: Record<IssueKind, string> = {
    price: "価格改定後の高リスク会員増加",
    loss: "来月損失予測の店舗集中",
    retention: "継続率の改善が必要な店舗の増加",
    reservation: "予約体験の改善が必要な会員の増加",
    first90: "初期90日会員の離脱リスク",
    general: "全店舗のリスク監視と優先店舗への集中投資",
  };

  const rankedStores = summaries
    .map((s) => {
      const resN = reservationByStore.get(s.storeName) ?? 0;
      const hrPrice = highRiskPriceByStore.get(s.storeName) ?? 0;
      const tgt = targetsByStore.get(s.storeName) ?? 0;
      const score =
        s.expectedLoss30Days * 1.1 +
        s.highRiskMembers * 14_000 +
        (100 - s.estimatedRetentionRate) * 140 +
        resN * 3_800 +
        hrPrice * 28_000 +
        tgt * 6_000;
      return { storeName: s.storeName, score };
    })
    .sort((a, b) => b.score - a.score);

  const namedFirst = rankedStores.filter(
    (r) => r.storeName !== "店舗未設定"
  );
  const priorityStores =
    namedFirst.length >= 3
      ? namedFirst.slice(0, 3).map((r) => r.storeName)
      : rankedStores.slice(0, 3).map((r) => r.storeName);

  const displayNames = priorityStores;
  const namePhrase =
    displayNames.length >= 2
      ? `${displayNames.slice(0, 3).join("・")}`
      : displayNames[0] ?? "主要店舗";

  let summary: string;
  switch (issue) {
    case "price":
      summary = `${namePhrase}を中心に、価格改定対象のうち改定後高リスクと見込まれる会員が${highRiskAfterPriceCount}名（対象${targetCount}名）にのぼっています。`;
      break;
    case "loss":
      summary = `${namePhrase}で30日期待損失が相対的に大きく、来月の収益インパクトが集中しています。`;
      break;
    case "retention":
      summary = `継続率が目安を下回る店舗が複数あり、${namePhrase}などでのフォロー強化が有効です。`;
      break;
    case "reservation":
      summary = `全体会員のうち予約問題リスクが${totalReservationRisk}名（比率 ${(reservationRatio * 100).toFixed(1)}%）で、${namePhrase}での枠・体験改善が求められます。`;
      break;
    case "first90":
      summary = `入会後90日以内の高リスク会員が${first90High}名おり、${namePhrase}を含む店舗での定着施策が優先です。`;
      break;
    default:
      summary = `店舗別の損失・リスク・継続率を踏まえ、${namePhrase}への集中対応が推奨されます（全体30日期待損失 ${Math.round(orgRev.metrics.expectedLoss30Days).toLocaleString("ja-JP")}円）。`;
  }

  const actions: string[] = [];
  switch (issue) {
    case "price":
      actions.push("価格改定対象会員の優先介入を実施する");
      actions.push("来月損失予測が高い店舗から本部面談・レビューを行う");
      actions.push("改定説明と代替プラン提示のテンプレを全店に共有する");
      break;
    case "loss":
      actions.push("来月損失予測上位店舗への本部レビューを設定する");
      actions.push("上位損失会員リストを店舗と週次で共有する");
      actions.push("収益防衛シミュレーションに基づき上位5名の介入を指示する");
      break;
    case "retention":
      actions.push("継続率が低い店舗にトレーナー配置とシフトを点検する");
      actions.push("成功店舗の初期90日フォロー施策を横展開する");
      actions.push("中リスク帯の定期コンタクト頻度を本部基準で引き上げる");
      break;
    case "reservation":
      actions.push("予約問題リスク会員へ代替枠・優先枠の提案を標準化する");
      actions.push("混雑時間帯の分散とキャンセル枠の可視化を進める");
      actions.push("来月損失予測が高い店舗とセットで体験改善KPIを追う");
      break;
    case "first90":
      actions.push("初期90日会員のフォロー週次レビューを本部主導で実施する");
      actions.push("成功店舗の初回セッションパターンをマニュアル化して横展開する");
      actions.push("高リスク兆候の早期アラートを店舗ダッシュボードに固定表示する");
      break;
    default:
      actions.push("店舗別リスクランキングに基づき月次の優先順位を固定する");
      actions.push("収益改善AIの上位アクションを全店の月次目標に紐づける");
      actions.push("価格改定モニターと予約リスクを週次で本部が確認する");
  }

  return {
    topIssue: topIssueMap[issue],
    priorityLabel,
    summary,
    actions: actions.slice(0, 3),
    priorityStores: displayNames.slice(0, 3),
  };
}
