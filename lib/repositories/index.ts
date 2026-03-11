/**
 * リポジトリの統一エクスポート
 * Supabase接続時は、ここでクライアントを初期化して各リポジトリに渡す
 */

import { supabase, isSupabaseEnabled } from "@/lib/supabase";

export { memberRepository, MemberRepository } from "./memberRepository";
export { visitRepository, VisitRepository } from "./visitRepository";
export { interventionRepository, InterventionRepository } from "./interventionRepository";
export { taskRepository, TaskRepository } from "./taskRepository";

// Supabaseクライアントをエクスポート（環境変数が設定されていない場合はnull）
export { supabase, isSupabaseEnabled };

/**
 * 現在のデータソース状態を確認
 * 開発時にモックデータとDB接続を切り替えやすくするためのヘルパー
 */
export function getDataSourceStatus() {
  return {
    isUsingSupabase: isSupabaseEnabled(),
    dataSource: isSupabaseEnabled() ? "Supabase" : "Mock Data",
  };
}

