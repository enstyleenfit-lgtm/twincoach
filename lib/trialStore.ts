export type TrialStore = {
  id: string;
  name: string;
};

/** 試験用：右上の店舗切替で使う固定2店舗 */
export const TRIAL_STORES: TrialStore[] = [
  { id: "ningyocho", name: "人形町" },
  { id: "suitengumae", name: "水天宮前" },
];

export const TRIAL_STORE_DEFAULT_ID = "ningyocho";

export const TRIAL_SELECTED_STORE_STORAGE_KEY = "twincoach:trialSelectedStoreId:v1";

/**
 * モックデータ上の storeName は「◯◯店」で管理しているため、
 * 試験用店舗切替（id/name）からフィルタ用の storeName を解決する。
 */
export function getTrialStoreNameForData(storeId: string): string {
  if (storeId === "suitengumae") return "水天宮前店";
  return "人形町店";
}
