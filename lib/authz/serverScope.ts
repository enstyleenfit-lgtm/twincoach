import { cookies } from "next/headers";
import { DEMO_ROLE_COOKIE_NAME, isDemoRole } from "@/lib/authz/demoSession";
import { CURRENT_STORE_COOKIE } from "@/lib/authz/storeContext";
import { TRIAL_STORES } from "@/lib/trialStore";

/**
 * サーバーコンポーネント専用。
 * store デモロール時のみ絞り込み対象の storeId を返す。
 * hq / owner / trainer（非デモ含む）は null を返す → 呼び出し元は getAll() をそのまま使う。
 */
export async function getStoreScopeId(): Promise<string | null> {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get(DEMO_ROLE_COOKIE_NAME)?.value;
  if (!isDemoRole(demoRole) || demoRole !== "store") return null;

  // tc_store_id クッキー優先、未設定時はデフォルト店舗にフォールバック
  const storeId = cookieStore.get(CURRENT_STORE_COOKIE)?.value?.trim() || null;
  return storeId ?? (TRIAL_STORES[0]?.id ?? "ningyocho");
}
