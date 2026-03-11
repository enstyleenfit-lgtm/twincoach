/**
 * 会員情報
 * Supabase接続時は members テーブルに対応
 */
export interface Member {
  id: string;
  name: string;
  plan: string;
  joinDate: string;
  lastVisitDate: string;
  visitInterval: string;
  riskScore: number;
  interventionStatus: string;
  recommendedIntervention: string;
  notes: string;
  hasCancellationHistory?: boolean;
}

/**
 * 訪問履歴
 * Supabase接続時は visits テーブルに対応
 */
export interface Visit {
  id: string;
  memberId: string;
  visitDate: string;
}

/**
 * 介入履歴
 * Supabase接続時は interventions テーブルに対応
 */
export interface Intervention {
  id: string;
  memberId: string;
  type: string;
  action?: string;
  status: string;
  trainer?: string;
  createdAt: string;
}

/**
 * タスク
 * Supabase接続時は tasks テーブルに対応
 */
export interface Task {
  id: string;
  memberId: string;
  memberName: string;
  action: string;
  status: "pending" | "in progress" | "done";
  assignedTrainer: string;
  dueDate: string;
}
