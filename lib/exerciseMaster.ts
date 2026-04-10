/**
 * 種目マスタ（ローカル定数）。DB 移行時は同型で供給を差し替え可能。
 */

export type ExerciseCategory = "トレーニング" | "ピラティス";

export interface ExerciseMaster {
  id: string;
  name: string;
  category: ExerciseCategory;
  equipment: string;
  bodyPart: string;
  searchKeywords: string[];
  sortOrder: number;
  /** セッション入力の初期重量（kg）。未指定時は器具などから推定 */
  defaultWeightKg?: number;
  /** 初期回数（未指定時は 10） */
  defaultReps?: number;
  /** 重量0を有効とする（ピラティス・自重など） */
  allowsZeroWeight?: boolean;
}

/** スマホ選択フロー：TR の部位（マスタ bodyPart と突き合わせ） */
export const TRAINING_BODY_PARTS_UI = ["胸", "背中", "肩", "腕", "体幹", "お尻", "脚"] as const;

/** スマホ選択フロー：TR の器具表示順 */
export const TRAINING_EQUIPMENT_ORDER = [
  "スミス",
  "ダンベル",
  "バーベル",
  "EZバー",
  "ケーブル",
  "自重",
  "ST",
] as const;

/** スマホ選択フロー：PL の器具 */
export const PILATES_EQUIPMENT_ORDER = ["RF", "CH", "MT"] as const;

export function matchesTrainingBodyPart(masterBodyPart: string, selectedPart: string): boolean {
  if (masterBodyPart === selectedPart) return true;
  return masterBodyPart.split(/[・／]/).some((p) => p.trim() === selectedPart);
}

export function findMasterByName(name: string): ExerciseMaster | undefined {
  return EXERCISE_MASTERS.find((m) => m.name === name);
}

/**
 * 種目確定時の初期値（平均重量の目安・回数10）。
 * マスタの optional で上書き可能。
 */
export function getSessionPickDefaults(m: ExerciseMaster): {
  defaultWeightKg: number;
  defaultReps: number;
  allowsZeroWeight: boolean;
  workoutKind: "tr" | "pl";
} {
  const workoutKind = m.category === "ピラティス" ? "pl" : "tr";
  const defaultReps = m.defaultReps ?? 10;

  const allowsZeroWeight =
    m.allowsZeroWeight ?? (workoutKind === "pl" || m.equipment === "自重");

  let defaultWeightKg = m.defaultWeightKg;
  if (defaultWeightKg == null) {
    if (workoutKind === "pl") {
      defaultWeightKg = 0;
    } else if (m.equipment === "自重") {
      defaultWeightKg = 0;
    } else {
      switch (m.equipment) {
        case "バーベル":
          if (m.name.includes("デッド") || m.bodyPart.includes("背中")) {
            defaultWeightKg = m.name.includes("デッド") ? 80 : 50;
          } else if (m.bodyPart.includes("脚")) {
            defaultWeightKg = 60;
          } else {
            defaultWeightKg = 50;
          }
          break;
        case "スミス":
          defaultWeightKg = 40;
          break;
        case "ダンベル":
          defaultWeightKg = m.bodyPart === "腕" ? 10 : m.bodyPart === "肩" ? 12 : 14;
          break;
        case "EZバー":
          defaultWeightKg = 12;
          break;
        case "ケーブル":
          defaultWeightKg = 15;
          break;
        case "ST":
          defaultWeightKg = 30;
          break;
        default:
          defaultWeightKg = 20;
      }
    }
  }

  return { defaultWeightKg, defaultReps, allowsZeroWeight, workoutKind };
}

/** マスタ一覧（sortOrder 昇順がデフォルト表示の基準） */
export const EXERCISE_MASTERS: ExerciseMaster[] = [
  // トレーニング — ST
  {
    id: "tr-st-1",
    name: "STチェストプレス",
    category: "トレーニング",
    equipment: "ST",
    bodyPart: "胸",
    searchKeywords: ["えすてぃ", "チェスト", "プレス", "chest"],
    sortOrder: 10,
  },
  {
    id: "tr-st-2",
    name: "STラットプル",
    category: "トレーニング",
    equipment: "ST",
    bodyPart: "背中",
    searchKeywords: ["らっと", "lat", "ぶら下がり"],
    sortOrder: 11,
  },
  // スミス
  {
    id: "tr-smith-1",
    name: "スミスベンチプレス",
    category: "トレーニング",
    equipment: "スミス",
    bodyPart: "胸",
    searchKeywords: ["すみす", "べんち", "bench", "すみすべんち"],
    sortOrder: 20,
  },
  {
    id: "tr-smith-2",
    name: "スミスクワット",
    category: "トレーニング",
    equipment: "スミス",
    bodyPart: "脚",
    searchKeywords: ["すくわっと", "squat"],
    sortOrder: 21,
  },
  // ダンベル
  {
    id: "tr-db-1",
    name: "ダンベルプレス",
    category: "トレーニング",
    equipment: "ダンベル",
    bodyPart: "胸",
    searchKeywords: ["だんべる", "dumbbell", "db"],
    sortOrder: 30,
  },
  {
    id: "tr-db-2",
    name: "ダンベルロウ",
    category: "トレーニング",
    equipment: "ダンベル",
    bodyPart: "背中",
    searchKeywords: ["ろう", "row"],
    sortOrder: 31,
  },
  {
    id: "tr-db-3",
    name: "ダンベルカール",
    category: "トレーニング",
    equipment: "ダンベル",
    bodyPart: "腕",
    searchKeywords: ["かーる", "curl", "二頭"],
    sortOrder: 32,
  },
  {
    id: "tr-db-4",
    name: "ダンベルヒップスラスト",
    category: "トレーニング",
    equipment: "ダンベル",
    bodyPart: "お尻",
    searchKeywords: ["ひっぷ", "hip", "グラ", "glute"],
    sortOrder: 33,
  },
  {
    id: "tr-db-5",
    name: "ダンベルショルダープレス",
    category: "トレーニング",
    equipment: "ダンベル",
    bodyPart: "肩",
    searchKeywords: ["しょるだー", "shoulder", "プレス"],
    sortOrder: 34,
  },
  // バーベル
  {
    id: "tr-bb-1",
    name: "バーベルベンチプレス",
    category: "トレーニング",
    equipment: "バーベル",
    bodyPart: "胸",
    searchKeywords: ["ばーべる", "barbell", "bb"],
    sortOrder: 40,
  },
  {
    id: "tr-bb-2",
    name: "バーベルデッドリフト",
    category: "トレーニング",
    equipment: "バーベル",
    bodyPart: "脚・背中",
    searchKeywords: ["でっど", "deadlift", "dl"],
    sortOrder: 41,
    defaultWeightKg: 80,
  },
  {
    id: "tr-bb-3",
    name: "バーベルスクワット",
    category: "トレーニング",
    equipment: "バーベル",
    bodyPart: "脚",
    searchKeywords: ["すくわっと"],
    sortOrder: 42,
  },
  // EZバー
  {
    id: "tr-ez-1",
    name: "EZバーカール",
    category: "トレーニング",
    equipment: "EZバー",
    bodyPart: "腕",
    searchKeywords: ["いーぜっと", "ez", "プリーチャー"],
    sortOrder: 50,
  },
  {
    id: "tr-ez-2",
    name: "EZバースカルクラッシャー",
    category: "トレーニング",
    equipment: "EZバー",
    bodyPart: "腕",
    searchKeywords: ["すかる", "三頭", "トライセプス"],
    sortOrder: 51,
  },
  // ケーブル
  {
    id: "tr-cb-1",
    name: "ケーブルクロスオーバー",
    category: "トレーニング",
    equipment: "ケーブル",
    bodyPart: "胸",
    searchKeywords: ["けーぶる", "cable", "クロス"],
    sortOrder: 60,
  },
  {
    id: "tr-cb-2",
    name: "ケーブルプルダウン",
    category: "トレーニング",
    equipment: "ケーブル",
    bodyPart: "背中",
    searchKeywords: ["ぷるだうん", "pulldown", "ラット"],
    sortOrder: 61,
  },
  // 自重
  {
    id: "tr-bw-1",
    name: "自重懸垂",
    category: "トレーニング",
    equipment: "自重",
    bodyPart: "背中",
    searchKeywords: ["けんすい", "ちんにんぐ", "pullup", "ぶら下がり"],
    sortOrder: 70,
  },
  {
    id: "tr-bw-2",
    name: "自重ディップス",
    category: "トレーニング",
    equipment: "自重",
    bodyPart: "腕・胸",
    searchKeywords: ["でぃっぷす", "dip"],
    sortOrder: 71,
  },
  {
    id: "tr-bw-3",
    name: "自重プッシュアップ",
    category: "トレーニング",
    equipment: "自重",
    bodyPart: "胸",
    searchKeywords: ["ぷっしゅ", "腕立て", "pushup"],
    sortOrder: 72,
  },
  {
    id: "tr-bw-4",
    name: "プランク",
    category: "トレーニング",
    equipment: "自重",
    bodyPart: "体幹",
    searchKeywords: ["ぷらんく", "plank"],
    sortOrder: 73,
  },
  // 既存クイック選択との整合
  {
    id: "tr-classic-1",
    name: "ベンチプレス",
    category: "トレーニング",
    equipment: "バーベル",
    bodyPart: "胸",
    searchKeywords: ["べんち", "bench"],
    sortOrder: 5,
  },
  {
    id: "tr-classic-2",
    name: "スクワット",
    category: "トレーニング",
    equipment: "バーベル",
    bodyPart: "脚",
    searchKeywords: ["すくわっと"],
    sortOrder: 6,
  },
  {
    id: "tr-classic-3",
    name: "デッドリフト",
    category: "トレーニング",
    equipment: "バーベル",
    bodyPart: "脚・背中",
    searchKeywords: ["でっど", "dl"],
    sortOrder: 7,
    defaultWeightKg: 80,
  },
  // ピラティス
  {
    id: "pi-rf-1",
    name: "RFフットワーク",
    category: "ピラティス",
    equipment: "RF",
    bodyPart: "脚",
    searchKeywords: ["りふぉーまー", "reformer", "ふっと"],
    sortOrder: 100,
  },
  {
    id: "pi-rf-2",
    name: "RFショートスパイン",
    category: "ピラティス",
    equipment: "RF",
    bodyPart: "背中・体幹",
    searchKeywords: ["すぱいん", "spine"],
    sortOrder: 101,
  },
  {
    id: "pi-rf-3",
    name: "RFペルビックリフト",
    category: "ピラティス",
    equipment: "RF",
    bodyPart: "体幹",
    searchKeywords: ["ぺるびっく", "pelvic", "りふと"],
    sortOrder: 102,
  },
  {
    id: "pi-ch-1",
    name: "CHサイドキック",
    category: "ピラティス",
    equipment: "CH",
    bodyPart: "脚・体幹",
    searchKeywords: ["chair", "ちぇあ", "さいど"],
    sortOrder: 110,
  },
  {
    id: "pi-ch-2",
    name: "CHプッシュダウン",
    category: "ピラティス",
    equipment: "CH",
    bodyPart: "腕・体幹",
    searchKeywords: ["ぷっしゅ"],
    sortOrder: 111,
  },
  {
    id: "pi-mt-1",
    name: "MTロールアップ",
    category: "ピラティス",
    equipment: "MT",
    bodyPart: "体幹",
    searchKeywords: ["まっと", "mat", "ろーる"],
    sortOrder: 120,
  },
  {
    id: "pi-mt-2",
    name: "MTショルダーブリッジ",
    category: "ピラティス",
    equipment: "MT",
    bodyPart: "脚・体幹",
    searchKeywords: ["ぶりっじ", "bridge"],
    sortOrder: 121,
  },
];
