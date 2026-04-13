/**
 * hacomono API 連携を想定したデモ予約データ（モック）。
 * 実APIは呼ばず、店舗ID・日付でフィルタして表示する。
 */

export type HacomonoDemoPatternId = "A" | "B" | "C";

export type HacomonoReservationStatus = "予約済み" | "仮予約" | "キャンセル";

export type HacomonoDemoReservation = {
  id: string;
  storeId: "ningyocho" | "suitengumae";
  date: string;
  memberId: string;
  memberName: string;
  trainerName: string;
  startTime: string;
  endTime: string;
  menuType: string;
  status: HacomonoReservationStatus;
};

function slot(
  id: string,
  storeId: "ningyocho" | "suitengumae",
  date: string,
  memberId: string,
  memberName: string,
  trainerName: string,
  startTime: string,
  endTime: string,
  menuType: string,
  status: HacomonoReservationStatus = "予約済み"
): HacomonoDemoReservation {
  return {
    id,
    storeId,
    date,
    memberId,
    memberName,
    trainerName,
    startTime,
    endTime,
    menuType,
    status,
  };
}

/** パターンA：通常日（適度な予約＋空き） */
export function buildHacomonoPatternA(date: string): HacomonoDemoReservation[] {
  return [
    slot("hac-a-nc-1", "ningyocho", date, "2", "佐藤花子", "佐々木トレーナー", "09:00", "10:00", "パーソナル"),
    slot("hac-a-nc-2", "ningyocho", date, "ningyocho_demo_1", "山口拓海", "我妻", "10:30", "11:30", "グループ"),
    slot("hac-a-nc-3", "ningyocho", date, "13", "渡辺さくら", "山本トレーナー", "12:00", "13:00", "ピラティス"),
    slot("hac-a-nc-4", "ningyocho", date, "ningyocho_demo_2", "石田美月", "竹内", "14:00", "15:00", "パーソナル"),
    slot(
      "hac-a-nc-5",
      "ningyocho",
      date,
      "ningyocho_demo_3",
      "森田健介",
      "小野",
      "15:30",
      "16:30",
      "パーソナル",
      "仮予約"
    ),
    slot("hac-a-nc-6", "ningyocho", date, "ningyocho_demo_4", "小林里奈", "我妻", "18:00", "19:00", "パーソナル"),
    slot("hac-a-st-1", "suitengumae", date, "3", "鈴木一郎", "山本トレーナー", "10:00", "11:00", "パーソナル"),
    slot("hac-a-st-2", "suitengumae", date, "suitengumae_demo_1", "山田 花音", "小野", "11:30", "12:30", "グループ"),
    slot("hac-a-st-3", "suitengumae", date, "suitengumae_demo_2", "佐藤 恒一", "渡部", "14:00", "15:00", "パーソナル"),
    slot("hac-a-st-4", "suitengumae", date, "17", "村上麻衣", "藤本", "16:00", "17:00", "ピラティス"),
    slot("hac-a-st-5", "suitengumae", date, "suitengumae_demo_5", "中村 彩乃", "渡部", "18:30", "19:30", "グループ"),
  ];
}

/** パターンB：混雑日（朝〜夜まで埋まり気味・人気帯が詰まる） */
export function buildHacomonoPatternB(date: string): HacomonoDemoReservation[] {
  return [
    slot("hac-b-nc-1", "ningyocho", date, "2", "佐藤花子", "佐々木トレーナー", "07:00", "08:00", "パーソナル"),
    slot("hac-b-nc-2", "ningyocho", date, "ningyocho_demo_1", "山口拓海", "我妻", "08:15", "09:15", "グループ"),
    slot("hac-b-nc-3", "ningyocho", date, "13", "渡辺さくら", "山本トレーナー", "09:30", "10:30", "ピラティス"),
    slot("hac-b-nc-4", "ningyocho", date, "ningyocho_demo_2", "石田美月", "竹内", "10:45", "11:45", "パーソナル"),
    slot("hac-b-nc-5", "ningyocho", date, "ningyocho_demo_3", "森田健介", "山本トレーナー", "12:00", "13:00", "パーソナル"),
    slot("hac-b-nc-6", "ningyocho", date, "ningyocho_demo_4", "藤井玲奈", "佐々木トレーナー", "13:15", "14:15", "グループ"),
    slot("hac-b-nc-7", "ningyocho", date, "ningyocho_demo_5", "松本悠斗", "竹内", "15:00", "16:00", "パーソナル"),
    slot(
      "hac-b-nc-8",
      "ningyocho",
      date,
      "2",
      "佐藤花子",
      "佐々木トレーナー",
      "18:00",
      "19:00",
      "パーソナル",
      "キャンセル"
    ),
    slot("hac-b-st-1", "suitengumae", date, "3", "鈴木一郎", "山本トレーナー", "07:00", "08:00", "パーソナル"),
    slot("hac-b-st-2", "suitengumae", date, "suitengumae_demo_1", "山田 花音", "小野", "08:00", "09:00", "グループ"),
    slot("hac-b-st-3", "suitengumae", date, "suitengumae_demo_2", "佐藤 恒一", "渡部", "09:00", "10:00", "パーソナル"),
    slot("hac-b-st-4", "suitengumae", date, "suitengumae_demo_3", "高橋 美咲", "藤本", "10:00", "11:00", "ピラティス"),
    slot("hac-b-st-5", "suitengumae", date, "suitengumae_demo_4", "伊藤 拓真", "小野", "11:00", "12:00", "パーソナル"),
    slot("hac-b-st-6", "suitengumae", date, "suitengumae_demo_5", "中村 彩乃", "渡部", "12:00", "13:00", "グループ"),
    slot("hac-b-st-7", "suitengumae", date, "suitengumae_demo_b_1", "清水あかり", "小野", "13:00", "14:00", "パーソナル"),
    slot("hac-b-st-8", "suitengumae", date, "suitengumae_demo_b_2", "林大輔", "渡部", "14:00", "15:00", "グループ"),
    slot("hac-b-st-9", "suitengumae", date, "suitengumae_demo_b_3", "岡田さくら", "藤本", "15:00", "16:00", "ピラティス"),
    slot("hac-b-st-10", "suitengumae", date, "suitengumae_demo_b_4", "長谷川翼", "小野", "16:00", "17:00", "パーソナル"),
    slot("hac-b-st-11", "suitengumae", date, "suitengumae_demo_b_5", "井上結衣", "渡部", "17:00", "18:00", "パーソナル"),
    slot("hac-b-st-12", "suitengumae", date, "17", "村上麻衣", "藤本", "18:00", "19:00", "ピラティス"),
    slot("hac-b-st-13", "suitengumae", date, "3", "鈴木一郎", "山本トレーナー", "19:00", "20:00", "グループ"),
    slot("hac-b-st-14", "suitengumae", date, "suitengumae_demo_1", "山田 花音", "小野", "20:00", "21:00", "パーソナル"),
  ];
}

/** パターンC：穴あき日（予約少なめ・稼働率低め） */
export function buildHacomonoPatternC(date: string): HacomonoDemoReservation[] {
  return [
    slot("hac-c-nc-1", "ningyocho", date, "ningyocho_demo_1", "山口拓海", "我妻", "11:00", "12:00", "パーソナル"),
    slot("hac-c-nc-2", "ningyocho", date, "13", "渡辺さくら", "山本トレーナー", "16:00", "17:00", "グループ"),
    slot("hac-c-st-1", "suitengumae", date, "suitengumae_demo_3", "高橋 美咲", "藤本", "10:00", "11:00", "ピラティス"),
    slot("hac-c-st-2", "suitengumae", date, "suitengumae_demo_b_4", "長谷川翼", "小野", "15:00", "16:00", "パーソナル"),
  ];
}

const PATTERN_BUILDERS: Record<
  HacomonoDemoPatternId,
  (date: string) => HacomonoDemoReservation[]
> = {
  A: buildHacomonoPatternA,
  B: buildHacomonoPatternB,
  C: buildHacomonoPatternC,
};

/**
 * デフォルト：人形町は通常日(A)、水天宮前は混雑日(B)で対比を出す。
 * URLクエリ `?hacomonoDemo=A|B|C` で両店とも同一シナリオに揃える（HacomonoDemoTodayReservations 側）。
 */
export const HACOMONO_DEFAULT_PATTERN_BY_STORE: Record<
  string,
  HacomonoDemoPatternId
> = {
  ningyocho: "A",
  suitengumae: "B",
};

export function resolveHacomonoDemoPattern(
  storeId: string,
  queryOverride: HacomonoDemoPatternId | null
): HacomonoDemoPatternId {
  if (queryOverride) return queryOverride;
  return HACOMONO_DEFAULT_PATTERN_BY_STORE[storeId] ?? "A";
}

export function getHacomonoDemoReservationsForStore(
  storeId: string,
  dateYmd: string,
  pattern: HacomonoDemoPatternId
): HacomonoDemoReservation[] {
  const rows = PATTERN_BUILDERS[pattern](dateYmd).filter(
    (r) => r.storeId === storeId && r.date === dateYmd
  );
  return rows.sort((a, b) => a.startTime.localeCompare(b.startTime));
}
