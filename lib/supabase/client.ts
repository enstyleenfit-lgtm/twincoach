import { createBrowserClient } from "@supabase/ssr";

/**
 * ブラウザ（クライアントサイド）用のSupabaseクライアントを作成
 * Client Component で使用
 * 認証状態を管理するために使用
 */
export function createClientSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}







