export type DemoAppRole = "hq" | "owner" | "store";

export const DEMO_ROLE_COOKIE_NAME = "twincoach_demo_role";

export function isDemoRole(value: string | undefined | null): value is DemoAppRole {
  return value === "hq" || value === "owner" || value === "store";
}

export function roleHomePath(role: DemoAppRole): string {
  if (role === "hq") return "/hq";
  if (role === "owner") return "/owner";
  // 店舗は店舗一覧（/stores）を入口にする
  return "/stores";
}
