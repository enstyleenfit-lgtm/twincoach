import { Intervention } from "@/types";
import { interventions } from "@/lib/mockData";

/**
 * 介入データのリポジトリ
 * 現在はモックデータを使用
 */
export class InterventionRepository {
  /**
   * 全介入履歴を取得
   */
  async getAll(): Promise<Intervention[]> {
    return interventions;
  }

  /**
   * 会員IDで介入履歴を取得
   */
  async getByMemberId(memberId: string): Promise<Intervention[]> {
    return interventions.filter(
      (intervention) => intervention.memberId === memberId
    );
  }
}

// シングルトンインスタンスをエクスポート
export const interventionRepository = new InterventionRepository();

