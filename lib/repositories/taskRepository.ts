import { Task } from "@/types";
import { tasks } from "@/lib/mockData";

/**
 * タスクデータのリポジトリ
 * 現在はモックデータを使用、将来的にSupabaseに置き換え可能
 */
export class TaskRepository {
  /**
   * 全タスクを取得
   */
  async getAll(): Promise<Task[]> {
    // TODO: Supabase接続時に以下に置き換え
    // const { data, error } = await supabase.from('tasks').select('*');
    // if (error) throw error;
    // return data;
    return tasks;
  }

  /**
   * 会員IDでタスクを取得
   */
  async getByMemberId(memberId: string): Promise<Task[]> {
    // TODO: Supabase接続時に以下に置き換え
    // const { data, error } = await supabase.from('tasks').select('*').eq('member_id', memberId);
    // if (error) throw error;
    // return data;
    return tasks.filter((task) => task.memberId === memberId);
  }
}

// シングルトンインスタンスをエクスポート
export const taskRepository = new TaskRepository();

