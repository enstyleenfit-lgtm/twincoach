/**
 * 応援掲示板デモデータ（モック）。
 * 実データは扱わない。将来の hacomono / KING OF TIME / AKASHI 連携を想定した型設計。
 * 個人名・連絡先・時給・雇用契約情報は含まない。
 */

export type HelpType = "欠員補充" | "代行出勤" | "短時間サポート";
export type RequestStatus = "募集中" | "確定済み" | "キャンセル";
export type ApplicationStatus = "応募中" | "確定" | "見送り";
export type ShiftSlot = "午前" | "午後" | "終日";
export type HelpSource = "manual" | "hacomono" | "king_of_time" | "akashi";

export type HelpRequest = {
  requestId: string;
  storeId: string;
  storeName: string;
  date: string;
  shiftSlot: ShiftSlot;
  helpType: HelpType;
  requiredCount: number;
  description: string;
  status: RequestStatus;
  postedAt: string;
  postedBy: string;
  source: HelpSource;
};

export type HelpApplication = {
  applicationId: string;
  requestId: string;
  applicantStoreId: string;
  applicantStoreName: string;
  status: ApplicationStatus;
  appliedAt: string;
  note?: string;
};

const HELP_REQUESTS: HelpRequest[] = [
  {
    requestId: "req-001",
    storeId: "ningyocho",
    storeName: "人形町店",
    date: "2026-05-17",
    shiftSlot: "午前",
    helpType: "代行出勤",
    requiredCount: 1,
    description: "急なスタッフ欠員のため午前セッションの補助が1名必要です。経験者歓迎。",
    status: "募集中",
    postedAt: "2026-05-14",
    postedBy: "人形町店",
    source: "manual",
  },
  {
    requestId: "req-002",
    storeId: "shibuya",
    storeName: "渋谷店",
    date: "2026-05-18",
    shiftSlot: "午後",
    helpType: "短時間サポート",
    requiredCount: 1,
    description: "新規入会が重なり午後の対応が手薄になります。2〜3時間のサポートを歓迎します。",
    status: "募集中",
    postedAt: "2026-05-13",
    postedBy: "渋谷店",
    source: "manual",
  },
  {
    requestId: "req-003",
    storeId: "nakano",
    storeName: "中野店",
    date: "2026-05-20",
    shiftSlot: "終日",
    helpType: "欠員補充",
    requiredCount: 1,
    description: "スタッフ退職による欠員対応。終日対応できる方を1名募集しています。",
    status: "募集中",
    postedAt: "2026-05-12",
    postedBy: "中野店",
    source: "manual",
  },
  {
    requestId: "req-004",
    storeId: "sangenjaya",
    storeName: "三軒茶屋本店",
    date: "2026-05-16",
    shiftSlot: "午後",
    helpType: "代行出勤",
    requiredCount: 1,
    description: "スタッフ急病による代行出勤の募集。水天宮前店が対応確定。",
    status: "確定済み",
    postedAt: "2026-05-13",
    postedBy: "三軒茶屋本店",
    source: "manual",
  },
  {
    requestId: "req-005",
    storeId: "suitengumae",
    storeName: "水天宮前店",
    date: "2026-05-22",
    shiftSlot: "午前",
    helpType: "短時間サポート",
    requiredCount: 1,
    description: "店内体験イベントのため午前のサポートを募集しています。未経験者でも可。",
    status: "募集中",
    postedAt: "2026-05-14",
    postedBy: "水天宮前店",
    source: "manual",
  },
  {
    requestId: "req-006",
    storeId: "shibuya",
    storeName: "渋谷店",
    date: "2026-05-15",
    shiftSlot: "終日",
    helpType: "代行出勤",
    requiredCount: 1,
    description: "体調不良による欠員でしたが本人が回復したためキャンセルします。",
    status: "キャンセル",
    postedAt: "2026-05-12",
    postedBy: "渋谷店",
    source: "manual",
  },
];

const HELP_APPLICATIONS: HelpApplication[] = [
  {
    applicationId: "app-001",
    requestId: "req-001",
    applicantStoreId: "suitengumae",
    applicantStoreName: "水天宮前店",
    status: "応募中",
    appliedAt: "2026-05-14",
    note: "午前の時間帯は対応可能です。",
  },
  {
    applicationId: "app-002",
    requestId: "req-002",
    applicantStoreId: "ningyocho",
    applicantStoreName: "人形町店",
    status: "応募中",
    appliedAt: "2026-05-13",
  },
  {
    applicationId: "app-003",
    requestId: "req-002",
    applicantStoreId: "nakano",
    applicantStoreName: "中野店",
    status: "応募中",
    appliedAt: "2026-05-14",
    note: "14時以降なら対応可能です。",
  },
  {
    applicationId: "app-004",
    requestId: "req-004",
    applicantStoreId: "suitengumae",
    applicantStoreName: "水天宮前店",
    status: "確定",
    appliedAt: "2026-05-13",
    note: "対応確定しました。当日は9時に到着予定です。",
  },
];

export function getAllRequests(): HelpRequest[] {
  return HELP_REQUESTS;
}

export function getRequestsByStore(storeId: string): HelpRequest[] {
  return HELP_REQUESTS.filter((r) => r.storeId === storeId);
}

export function getOpenRequests(): HelpRequest[] {
  return HELP_REQUESTS.filter((r) => r.status === "募集中");
}

export function getOpenRequestsExcluding(storeId: string): HelpRequest[] {
  return getOpenRequests().filter((r) => r.storeId !== storeId);
}

export function getApplicationsForRequest(requestId: string): HelpApplication[] {
  return HELP_APPLICATIONS.filter((a) => a.requestId === requestId);
}

export function getApplicationsByStore(storeId: string): HelpApplication[] {
  return HELP_APPLICATIONS.filter((a) => a.applicantStoreId === storeId);
}

export const HELP_TYPE_LABEL: Record<HelpType, string> = {
  "欠員補充": "欠員補充",
  "代行出勤": "代行出勤",
  "短時間サポート": "短時間サポート",
};

export const SHIFT_SLOT_LABEL: Record<ShiftSlot, string> = {
  午前: "午前",
  午後: "午後",
  終日: "終日",
};
