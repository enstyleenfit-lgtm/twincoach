/**
 * セッション入力のトレーナー候補（試験用店舗切替と連動）
 * 水天宮前（suitengumae）のみ候補を差し替え
 */

export const SESSION_TRAINER_CUSTOM = "__custom__" as const;

/** デフォルト（人形町等） */
export const SESSION_TRAINER_PRESETS_DEFAULT = [
  "山本トレーナー",
  "佐々木トレーナー",
  "高橋トレーナー",
] as const;

/** 水天宮前店エリア */
export const SESSION_TRAINER_PRESETS_SUITENGUMAE = ["小野", "渡部", "藤本"] as const;

export function getSessionTrainerPresetOptions(storeId: string): string[] {
  if (storeId === "suitengumae") {
    return [...SESSION_TRAINER_PRESETS_SUITENGUMAE];
  }
  return [...SESSION_TRAINER_PRESETS_DEFAULT];
}
