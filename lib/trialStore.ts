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

/** オーナーが管轄する店舗ID一覧（tc_store_id Cookieに依存しない固定定義） */
export const OWNER_STORE_IDS: string[] = TRIAL_STORES.map((s) => s.id);

/**
 * モックデータ上の storeName は「◯◯店」で管理しているため、
 * 試験用店舗切替（id/name）からフィルタ用の storeName を解決する。
 */
export function getTrialStoreNameForData(storeId: string): string {
  if (storeId === "suitengumae") return "水天宮前店";
  return "人形町店";
}
