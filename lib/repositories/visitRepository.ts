import { Visit } from "@/types";
import { visits } from "@/lib/mockData";

/**
 * 訪問データのリポジトリ
 * 現在はモックデータを使用、将来的にSupabaseに置き換え可能
 */
export class VisitRepository {
  /**
   * 全訪問履歴を取得
   */
  async getAll(): Promise<Visit[]> {
    // TODO: Supabase接続時に以下に置き換え
    // const { data, error } = await supabase.from('visits').select('*');
    // if (error) throw error;
    // return data;
    return visits;
  }

  /**
   * 会員IDで訪問履歴を取得
   */
  async getByMemberId(memberId: string): Promise<Visit[]> {
    // TODO: Supabase接続時に以下に置き換え
    // const { data, error } = await supabase.from('visits').select('*').eq('member_id', memberId);
    // if (error) throw error;
    // return data;
    return visits.filter((visit) => visit.memberId === memberId);
  }
}

// シングルトンインスタンスをエクスポート
export const visitRepository = new VisitRepository();

