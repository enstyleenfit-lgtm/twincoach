/**
 * セッション入力のトレーナー候補（試験用店舗切替と連動）
 * 水天宮前（suitengumae）のみ候補を差し替え
 */

export const SESSION_TRAINER_CUSTOM = "__custom__" as const;

/** 人形町（デモ既定） */
export const SESSION_TRAINER_PRESETS_DEFAULT = [
  "我妻",
  "竹内",
  "小野",
] as const;

/** 水天宮前店エリア */
export const SESSION_TRAINER_PRESETS_SUITENGUMAE = ["小野", "渡部", "藤本"] as const;

export function getSessionTrainerPresetOptions(storeId: string): string[] {
  if (storeId === "suitengumae") {
    return [...SESSION_TRAINER_PRESETS_SUITENGUMAE];
  }
  return [...SESSION_TRAINER_PRESETS_DEFAULT];
}
