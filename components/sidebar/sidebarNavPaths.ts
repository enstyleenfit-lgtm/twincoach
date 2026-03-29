/**
 * 左サイドバーの href 単一ソース。
 * 本部・オーナーは必ず /hq/* /owner/*（ルート直下の /trainers 等にしない）。
 */
export const HQ_SIDEBAR_LINKS = {
  dashboard: "/hq",
  stores: "/hq/stores",
  trainers: "/hq/trainers",
  reports: "/hq/reports",
  priceRevision: "/hq/price-revision",
  pocSummary: "/hq/poc-summary",
} as const;

export const OWNER_SIDEBAR_LINKS = {
  dashboard: "/owner",
  stores: "/owner/stores",
  trainers: "/owner/trainers",
  members: "/owner/members",
  tasks: "/owner/tasks",
  reports: "/owner/reports",
} as const;
