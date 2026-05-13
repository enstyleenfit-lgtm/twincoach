export type HacomonoPaymentStatus = "paid" | "unpaid" | "overdue";

export type StoreMonthlyRevenue = {
  storeId: string;
  storeName: string;
  month: string;
  totalRevenue: number;
  collectedAmount: number;
  unpaidAmount: number;
  unpaidCount: number;
  memberCount: number;
};

export type MemberPaymentRecord = {
  memberId: string;
  memberName: string;
  storeId: string;
  storeName: string;
  plan: string;
  monthlyFee: number;
  status: HacomonoPaymentStatus;
  unpaidMonths: number;
  lastPaymentDate: string;
  note?: string;
};

export const BILLING_DISPLAY_MONTH = "2026年5月";

const STORE_REVENUES: StoreMonthlyRevenue[] = [
  {
    storeId: "ningyocho",
    storeName: "人形町店",
    month: BILLING_DISPLAY_MONTH,
    totalRevenue: 2150000,
    collectedAmount: 2086000,
    unpaidAmount: 64000,
    unpaidCount: 2,
    memberCount: 42,
  },
  {
    storeId: "suitengumae",
    storeName: "水天宮前店",
    month: BILLING_DISPLAY_MONTH,
    totalRevenue: 1785000,
    collectedAmount: 1785000,
    unpaidAmount: 0,
    unpaidCount: 0,
    memberCount: 35,
  },
  {
    storeId: "shibuya",
    storeName: "渋谷店",
    month: BILLING_DISPLAY_MONTH,
    totalRevenue: 3020000,
    collectedAmount: 2966000,
    unpaidAmount: 54000,
    unpaidCount: 2,
    memberCount: 58,
  },
  {
    storeId: "nakano",
    storeName: "中野店",
    month: BILLING_DISPLAY_MONTH,
    totalRevenue: 1480000,
    collectedAmount: 1372000,
    unpaidAmount: 108000,
    unpaidCount: 4,
    memberCount: 29,
  },
  {
    storeId: "sangenjaya",
    storeName: "三軒茶屋本店",
    month: BILLING_DISPLAY_MONTH,
    totalRevenue: 3450000,
    collectedAmount: 3298000,
    unpaidAmount: 152000,
    unpaidCount: 5,
    memberCount: 67,
  },
];

const MEMBER_PAYMENTS: MemberPaymentRecord[] = [
  {
    memberId: "m-nc-001",
    memberName: "田中 健太",
    storeId: "ningyocho",
    storeName: "人形町店",
    plan: "スタンダードプラン",
    monthlyFee: 32000,
    status: "unpaid",
    unpaidMonths: 1,
    lastPaymentDate: "2026-04-01",
  },
  {
    memberId: "m-nc-002",
    memberName: "伊藤 麻衣",
    storeId: "ningyocho",
    storeName: "人形町店",
    plan: "スタンダードプラン",
    monthlyFee: 32000,
    status: "overdue",
    unpaidMonths: 2,
    lastPaymentDate: "2026-03-01",
    note: "連絡取れず。要フォロー。",
  },
  {
    memberId: "m-sb-001",
    memberName: "小林 翔",
    storeId: "shibuya",
    storeName: "渋谷店",
    plan: "スタンダードプラン",
    monthlyFee: 32000,
    status: "unpaid",
    unpaidMonths: 1,
    lastPaymentDate: "2026-04-01",
  },
  {
    memberId: "m-sb-002",
    memberName: "山田 花子",
    storeId: "shibuya",
    storeName: "渋谷店",
    plan: "ライトプラン",
    monthlyFee: 22000,
    status: "overdue",
    unpaidMonths: 3,
    lastPaymentDate: "2026-02-01",
    note: "支払い方法変更の意向あり。確認中。",
  },
  {
    memberId: "m-nk-001",
    memberName: "鈴木 大輔",
    storeId: "nakano",
    storeName: "中野店",
    plan: "スタンダードプラン",
    monthlyFee: 32000,
    status: "unpaid",
    unpaidMonths: 1,
    lastPaymentDate: "2026-04-01",
  },
  {
    memberId: "m-nk-002",
    memberName: "佐藤 美咲",
    storeId: "nakano",
    storeName: "中野店",
    plan: "ライトプラン",
    monthlyFee: 22000,
    status: "overdue",
    unpaidMonths: 2,
    lastPaymentDate: "2026-03-01",
  },
  {
    memberId: "m-nk-003",
    memberName: "高橋 拓也",
    storeId: "nakano",
    storeName: "中野店",
    plan: "スタンダードプラン",
    monthlyFee: 32000,
    status: "overdue",
    unpaidMonths: 2,
    lastPaymentDate: "2026-03-01",
    note: "休会申請の確認中。",
  },
  {
    memberId: "m-nk-004",
    memberName: "渡辺 由美",
    storeId: "nakano",
    storeName: "中野店",
    plan: "ライトプラン",
    monthlyFee: 22000,
    status: "unpaid",
    unpaidMonths: 1,
    lastPaymentDate: "2026-04-01",
  },
  {
    memberId: "m-sj-001",
    memberName: "中村 純",
    storeId: "sangenjaya",
    storeName: "三軒茶屋本店",
    plan: "プレミアムプラン",
    monthlyFee: 44000,
    status: "unpaid",
    unpaidMonths: 1,
    lastPaymentDate: "2026-04-01",
  },
  {
    memberId: "m-sj-002",
    memberName: "加藤 美幸",
    storeId: "sangenjaya",
    storeName: "三軒茶屋本店",
    plan: "スタンダードプラン",
    monthlyFee: 32000,
    status: "overdue",
    unpaidMonths: 3,
    lastPaymentDate: "2026-02-01",
    note: "クレジットカード期限切れ。更新依頼済み。",
  },
  {
    memberId: "m-sj-003",
    memberName: "吉田 亮太",
    storeId: "sangenjaya",
    storeName: "三軒茶屋本店",
    plan: "スタンダードプラン",
    monthlyFee: 32000,
    status: "overdue",
    unpaidMonths: 2,
    lastPaymentDate: "2026-03-01",
  },
  {
    memberId: "m-sj-004",
    memberName: "松本 千尋",
    storeId: "sangenjaya",
    storeName: "三軒茶屋本店",
    plan: "ライトプラン",
    monthlyFee: 22000,
    status: "unpaid",
    unpaidMonths: 1,
    lastPaymentDate: "2026-04-01",
  },
  {
    memberId: "m-sj-005",
    memberName: "井上 悠",
    storeId: "sangenjaya",
    storeName: "三軒茶屋本店",
    plan: "ライトプラン",
    monthlyFee: 22000,
    status: "overdue",
    unpaidMonths: 4,
    lastPaymentDate: "2026-01-01",
    note: "退会検討中。引き留め対応要。",
  },
];

export function getStoreRevenues(): StoreMonthlyRevenue[] {
  return STORE_REVENUES;
}

export function getStoreRevenueById(storeId: string): StoreMonthlyRevenue | undefined {
  return STORE_REVENUES.find((s) => s.storeId === storeId);
}

export function getMemberPaymentRecords(): MemberPaymentRecord[] {
  return MEMBER_PAYMENTS;
}

export function getMemberPaymentsByStore(storeId: string): MemberPaymentRecord[] {
  return MEMBER_PAYMENTS.filter((m) => m.storeId === storeId);
}

export function getUnpaidAndOverdueMembers(): MemberPaymentRecord[] {
  return [...MEMBER_PAYMENTS].sort((a, b) => b.unpaidMonths - a.unpaidMonths);
}
