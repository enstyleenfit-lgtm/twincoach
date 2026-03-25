import { isSupabaseEnabled } from "@/lib/supabase/server";
import { requireUser } from "@/lib/authz/authorize";

export type AuditAction =
  | "store.switch"
  | "members.list"
  | "members.view"
  | "tasks.list"
  | "analysis.access";

export async function logAudit(params: {
  storeId: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
}) {
  if (!isSupabaseEnabled()) return;

  try {
    const { supabase, user } = await requireUser();
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      store_id: params.storeId,
      action: params.action,
      metadata: params.metadata ?? null,
    });
  } catch {
    // 監査ログ失敗で主要処理は落とさない
  }
}

