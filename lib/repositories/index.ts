/**
 * リポジトリの統一エクスポート
 * 各リポジトリは createServerSupabase() を使用してSupabaseに接続
 */

export { memberRepository, MemberRepository } from "./memberRepository";
export { visitRepository, VisitRepository } from "./visitRepository";
export { interventionRepository, InterventionRepository } from "./interventionRepository";
export { taskRepository, TaskRepository } from "./taskRepository";

/**
 * 現在のデータソース状態を確認
 * 開発時にモックデータとDB接続を切り替えやすくするためのヘルパー
 */
export function getDataSourceStatus() {
  return {
    isUsingSupabase: false,
    dataSource: "Mock Data",
  };
}

