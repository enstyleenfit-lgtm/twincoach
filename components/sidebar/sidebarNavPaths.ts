/**
 * 左サイドバーの href 単一ソース。
 * 本部・オーナーは必ず /hq/* /owner/*（ルート直下の /trainers 等にしない）。
 */
export const HQ_SIDEBAR_LINKS = {
  dashboard: "/hq",
  stores: "/hq/stores",
  trainers: "/hq/trainers",
  reports: "/hq/reports",
  ltv: "/hq/ltv",
  billing: "/hq/billing",
  inventory: "/hq/inventory",
  helpBoard: "/hq/help-board",
} as const;

export const OWNER_SIDEBAR_LINKS = {
  dashboard: "/owner",
  stores: "/owner/stores",
  trainers: "/owner/trainers",
  members: "/owner/members",
  tasks: "/owner/tasks",
  reports: "/owner/reports",
  billing: "/owner/billing",
  inventory: "/owner/inventory",
  helpBoard: "/owner/help-board",
} as const;

export const STORE_SIDEBAR_LINKS = {
  members: "/members",
  tasks: "/tasks",
  sessionInput: "/session-input",
  inventory: "/store/inventory",
  helpBoard: "/store/help-board",
} as const;

export const COMMON_SIDEBAR_LINKS = {
  notifications: "/notifications",
  settings: "/settings",
} as const;
