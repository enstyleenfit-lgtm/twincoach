import { Intervention } from "@/types";
import { interventions } from "@/lib/mockData";

/**
 * 介入データのリポジトリ
 * 現在はモックデータを使用、将来的にSupabaseに置き換え可能
 */
export class InterventionRepository {
  /**
   * 全介入履歴を取得
   */
  async getAll(): Promise<Intervention[]> {
    // TODO: Supabase接続時に以下に置き換え
    // const { data, error } = await supabase.from('interventions').select('*');
    // if (error) throw error;
    // return data;
    return interventions;
  }

  /**
   * 会員IDで介入履歴を取得
   */
  async getByMemberId(memberId: string): Promise<Intervention[]> {
    // TODO: Supabase接続時に以下に置き換え
    // const { data, error } = await supabase.from('interventions').select('*').eq('member_id', memberId);
    // if (error) throw error;
    // return data;
    return interventions.filter((intervention) => intervention.memberId === memberId);
  }
}

// シングルトンインスタンスをエクスポート
export const interventionRepository = new InterventionRepository();

