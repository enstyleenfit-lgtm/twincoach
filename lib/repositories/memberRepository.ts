import { Member } from "@/types";
import { members } from "@/lib/mockData";

/**
 * 会員データのリポジトリ
 * 現在はモックデータを使用、将来的にSupabaseに置き換え可能
 */
export class MemberRepository {
  /**
   * 全会員を取得
   */
  async getAll(): Promise<Member[]> {
    // TODO: Supabase接続時に以下に置き換え
    // const { data, error } = await supabase.from('members').select('*');
    // if (error) throw error;
    // return data;
    return members;
  }

  /**
   * IDで会員を取得
   */
  async getById(id: string): Promise<Member | undefined> {
    // TODO: Supabase接続時に以下に置き換え
    // const { data, error } = await supabase.from('members').select('*').eq('id', id).single();
    // if (error) throw error;
    // return data;
    return members.find((member) => member.id === id);
  }
}

// シングルトンインスタンスをエクスポート
export const memberRepository = new MemberRepository();

