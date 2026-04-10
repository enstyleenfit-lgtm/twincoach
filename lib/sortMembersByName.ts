/**
 * 会員一覧などの表示名ソート（日本語の自然順・英字はアルファベット順に近い並び）。
 * 読み仮名フィールドが無い場合は表示名（漢字・かな・英字混在）をそのまま比較する。
 * 将来 nameReading 等が追加されたら、比較キーを差し替えやすいよう関数を分離。
 */

import type { Member } from "@/types";

/** 表示順の比較に使う文字列（将来は reading を優先可能） */
export function getMemberSortKey(m: Pick<Member, "name">): string {
  return (m.name ?? "").trim();
}

const displayNameCollator = new Intl.Collator("ja", {
  sensitivity: "base",
  numeric: true,
});

export function compareMemberDisplayName(a: string, b: string): number {
  return displayNameCollator.compare(a.trim(), b.trim());
}

export function compareMembersByDisplayName(
  a: Pick<Member, "name">,
  b: Pick<Member, "name">
): number {
  return compareMemberDisplayName(getMemberSortKey(a), getMemberSortKey(b));
}

/** 非破壊ソート（会員一覧の初期順など） */
export function sortMembersByDisplayName<T extends Pick<Member, "name">>(members: T[]): T[] {
  return [...members].sort((x, y) => compareMembersByDisplayName(x, y));
}
