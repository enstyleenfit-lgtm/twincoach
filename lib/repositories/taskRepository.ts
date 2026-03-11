import { Task, SupabaseTask } from "@/types";
import { tasks } from "@/lib/mockData";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";
import { mapSupabaseTaskToTask } from "./supabaseMappers";

/**
 * タスクデータのリポジトリ
 * 環境変数が設定されている場合はSupabaseを使用、それ以外はモックデータを使用
 */
export class TaskRepository {
  /**
   * 全タスクを取得
   */
  async getAll(): Promise<Task[]> {
    if (isSupabaseEnabled() && supabase) {
      // Supabase接続時
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) {
        console.error("Supabase error:", error);
        // エラー時はモックデータにフォールバック
        return tasks;
      }
      // Supabaseのスネークケースをアプリケーションのキャメルケースに変換
      return (data as SupabaseTask[]).map(mapSupabaseTaskToTask);
    }
    // モックデータを使用
    return tasks;
  }

  /**
   * 会員IDでタスクを取得
   */
  async getByMemberId(memberId: string): Promise<Task[]> {
    if (isSupabaseEnabled() && supabase) {
      // Supabase接続時
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("member_id", memberId)
        .order("due_date", { ascending: true });
      if (error) {
        console.error("Supabase error:", error);
        // エラー時はモックデータにフォールバック
        return tasks.filter((task) => task.memberId === memberId);
      }
      // Supabaseのスネークケースをアプリケーションのキャメルケースに変換
      return (data as SupabaseTask[]).map(mapSupabaseTaskToTask);
    }
    // モックデータを使用
    return tasks.filter((task) => task.memberId === memberId);
  }
}

// シングルトンインスタンスをエクスポート
export const taskRepository = new TaskRepository();

