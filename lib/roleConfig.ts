import { Role } from "@/types";

/**
 * ダッシュボードセクションの識別子
 */
export type DashboardSection =
  | "summaryCards" // サマリーカード（退会リスク高、介入必要、本日のタスク）
  | "interventionTypeCards" // 介入タイプ別カード
  | "retentionOverview" // 継続率サマリー
  | "interventionQueue" // 今日の優先対応
  | "dropoutRanking" // 退会予測ランキング
  | "riskTrendChart" // 退会リスク分布
  | "revenueAtRisk" // 退会リスク売上
  | "storeSummary" // 店舗別サマリー
  | "kpiGap" // KPI緊張感モード
  | "reservationAnalysis" // 予約詰まり分析
  | "first90Days" // 入会後90日モニター
  | "planTransition" // デュアル移行最適化
  | "trainerMetrics" // トレーナー別継続率
  | "priceRevision" // 価格改定影響モニター
  | "highRiskMembersList" // 退会リスク会員一覧
  | "needInterventionMembers"; // 介入推奨会員

/**
 * 各ロールで表示すべきダッシュボードセクション
 */
export const roleDashboardConfig: Record<Role, DashboardSection[]> = {
  // 本部経営陣: 全体俯瞰と経営判断に必要な情報
  admin: [
    "summaryCards",
    "retentionOverview",
    "storeSummary",
    "kpiGap",
    "revenueAtRisk",
    "priceRevision",
    "trainerMetrics",
    "riskTrendChart",
    "reservationAnalysis",
  ],

  // FCオーナー: 自店舗の経営状況と危険売上
  owner: [
    "summaryCards",
    "retentionOverview",
    "revenueAtRisk",
    "storeSummary", // 自店舗のみフィルタリング可能にする想定
    "kpiGap", // 自店舗のみ
    "first90Days",
    "dropoutRanking",
  ],

  // 店舗責任者: 現場の優先対応と継続率改善
  manager: [
    "summaryCards",
    "interventionQueue",
    "dropoutRanking",
    "first90Days",
    "highRiskMembersList",
    "needInterventionMembers",
    "reservationAnalysis",
    "planTransition",
  ],

  // トレーナー: 今日の対応と担当会員管理
  trainer: [
    "summaryCards",
    "interventionQueue",
    "needInterventionMembers",
    "first90Days",
    "planTransition",
  ],
};

/**
 * 現在のロールを取得（ダミー実装）
 * 将来的に Supabase Auth やセッションから取得する想定
 * 
 * 注意: サーバーコンポーネントで使用する場合は、この関数を直接呼び出すのではなく、
 * app/page.tsx のように定数として設定してください。
 * 実認証連携時は、サーバー側でセッションから取得する関数に置き換えます。
 */
export function getCurrentRole(): Role {
  // TODO: 実認証連携時に以下に置き換え
  // const session = await getSession();
  // return session?.user?.role || "trainer";
  
  // ダミー実装: 環境変数から取得
  // 開発時は環境変数 NEXT_PUBLIC_DEFAULT_ROLE で切り替え可能
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEFAULT_ROLE) {
    const envRole = process.env.NEXT_PUBLIC_DEFAULT_ROLE;
    if (["admin", "owner", "manager", "trainer"].includes(envRole)) {
      return envRole as Role;
    }
  }
  
  // デフォルトは trainer
  return "trainer";
}

/**
 * ロールの表示名を取得
 */
export function getRoleDisplayName(role: Role): string {
  switch (role) {
    case "admin":
      return "本部経営陣";
    case "owner":
      return "FCオーナー";
    case "manager":
      return "店舗責任者";
    case "trainer":
      return "トレーナー";
  }
}

/**
 * ロールの説明を取得
 */
export function getRoleDescription(role: Role): string {
  switch (role) {
    case "admin":
      return "全体の経営状況と店舗別サマリーを確認できます";
    case "owner":
      return "自店舗の経営状況と危険売上を確認できます";
    case "manager":
      return "優先対応すべき会員と継続率改善のための情報を確認できます";
    case "trainer":
      return "今日の対応すべき会員とタスクを確認できます";
  }
}

