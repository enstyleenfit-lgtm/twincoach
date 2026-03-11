import { createClient } from "@supabase/supabase-js";

/**
 * Supabaseクライアントの作成
 * 環境変数が設定されていない場合はnullを返す（モックデータを使用）
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 環境変数が設定されていない場合はnullを返す
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Supabaseクライアントのシングルトンインスタンス
 * 環境変数が設定されていない場合はnull
 */
export const supabase = createSupabaseClient();

/**
 * Supabase接続が有効かどうかを判定
 */
export function isSupabaseEnabled(): boolean {
  return supabase !== null;
}

