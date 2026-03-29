/**
 * アプリ内のロール文脈（URL プレフィックス）に応じたパス生成。
 * レイアウトの AppRouteProvider で segment を渡し、クライアントは useAppRouteSegment() と組み合わせる。
 */

export type AppRouteSegment = "hq" | "owner" | "store" | "trainer";

export function segmentFromPathname(pathname: string): AppRouteSegment {
  if (pathname.startsWith("/hq")) return "hq";
  if (pathname.startsWith("/owner")) return "owner";
  if (pathname.startsWith("/stores") || pathname.startsWith("/store/")) return "store";
  return "trainer";
}

export function dashboardHref(seg: AppRouteSegment): string {
  switch (seg) {
    case "hq":
      return "/hq";
    case "owner":
      return "/owner";
    case "store":
      return "/stores";
    default:
      return "/trainer";
  }
}

export function membersListHref(seg: AppRouteSegment): string {
  if (seg === "owner") return "/owner/members";
  if (seg === "hq") return "/hq/members";
  return "/members";
}

export function memberDetailHref(seg: AppRouteSegment, memberId: string): string {
  if (seg === "owner") return `/owner/members/${memberId}`;
  if (seg === "hq") return `/hq/members/${memberId}`;
  return `/members/${memberId}`;
}

export function trainersListHref(seg: AppRouteSegment): string {
  if (seg === "hq") return "/hq/trainers";
  if (seg === "owner") return "/owner/trainers";
  return "/trainers";
}

export function trainerDetailHref(seg: AppRouteSegment, trainerName: string): string {
  const enc = encodeURIComponent(trainerName);
  if (seg === "hq") return `/hq/trainers/${enc}`;
  if (seg === "owner") return `/owner/trainers/${enc}`;
  return `/trainers/${enc}`;
}

export function storesListHref(seg: AppRouteSegment): string {
  if (seg === "hq") return "/hq/stores";
  if (seg === "owner") return "/owner/stores";
  return "/stores";
}

/** 店舗詳細（店舗名または ID を URL セグメントに使う既存仕様に合わせる） */
export function storeDetailHref(seg: AppRouteSegment, storeIdOrName: string): string {
  const enc = encodeURIComponent(storeIdOrName);
  if (seg === "hq") return `/hq/store/${enc}`;
  if (seg === "owner") return `/owner/store/${enc}`;
  return `/store/${enc}`;
}

export function reportsHref(seg: AppRouteSegment): string {
  if (seg === "hq") return "/hq/reports";
  if (seg === "owner") return "/owner/reports";
  return "/reports";
}

export function tasksHref(seg: AppRouteSegment): string {
  if (seg === "owner") return "/owner/tasks";
  return "/tasks";
}

export function priceRevisionHref(seg: AppRouteSegment): string {
  if (seg === "hq") return "/hq/price-revision";
  return "/price-revision";
}

export function pocSummaryHref(seg: AppRouteSegment): string {
  if (seg === "hq") return "/hq/poc-summary";
  return "/poc-summary";
}

/** pathname から推測するフォールバック（Provider なしのルート用） */
export function dashboardHrefFromPathname(pathname: string): string {
  return dashboardHref(segmentFromPathname(pathname));
}

export function membersListHrefFromPathname(pathname: string): string {
  return membersListHref(segmentFromPathname(pathname));
}

export function memberDetailHrefFromPathname(pathname: string, memberId: string): string {
  return memberDetailHref(segmentFromPathname(pathname), memberId);
}

export function trainerDetailHrefFromPathname(pathname: string, trainerName: string): string {
  return trainerDetailHref(segmentFromPathname(pathname), trainerName);
}

export function trainersListHrefFromPathname(pathname: string): string {
  return trainersListHref(segmentFromPathname(pathname));
}
