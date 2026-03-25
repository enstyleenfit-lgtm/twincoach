import { Task, SupabaseTask } from "@/types";
import { tasks } from "@/lib/mockData";
import { createServerSupabase, isSupabaseEnabled } from "@/lib/supabase/server";
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
    if (isSupabaseEnabled()) {
      try {
        // Supabase接続時
        const supabase = await createServerSupabase();
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
      } catch (error) {
        console.error("Failed to create Supabase client:", error);
        // エラー時はモックデータにフォールバック
        return tasks;
      }
    }
    // モックデータを使用
    return tasks;
  }

  /**
   * 指定店舗のタスクのみ取得
   * - Supabase接続時: store_id で絞り込み（未契約/未所属は上位で 403）
   * - モック時: 現状 store を持たないため空配列
   */
  async getAllForStore(storeId: string): Promise<Task[]> {
    if (!storeId) return [];
    if (isSupabaseEnabled()) {
      try {
        const supabase = await createServerSupabase();
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("store_id", storeId)
          .order("due_date", { ascending: true });
        if (error) {
          console.error("Supabase error:", error);
          return [];
        }
        return (data as SupabaseTask[]).map(mapSupabaseTaskToTask);
      } catch (error) {
        console.error("Failed to create Supabase client:", error);
        return [];
      }
    }
    return [];
  }

  /**
   * 会員IDでタスクを取得
   */
  async getByMemberId(memberId: string): Promise<Task[]> {
    if (isSupabaseEnabled()) {
      try {
        // Supabase接続時
        const supabase = await createServerSupabase();
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
      } catch (error) {
        console.error("Failed to create Supabase client:", error);
        // エラー時はモックデータにフォールバック
        return tasks.filter((task) => task.memberId === memberId);
      }
    }
    // モックデータを使用
    return tasks.filter((task) => task.memberId === memberId);
  }
}

// シングルトンインスタンスをエクスポート
export const taskRepository = new TaskRepository();

