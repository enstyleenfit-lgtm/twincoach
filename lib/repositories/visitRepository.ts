import { Visit } from "@/types";
import { visits } from "@/lib/mockData";

/**
 * 訪問データのリポジトリ
 * 現在はモックデータを使用
 */
export class VisitRepository {
  /**
   * 全訪問履歴を取得
   */
  async getAll(): Promise<Visit[]> {
    return visits;
  }

  /**
   * 会員IDで訪問履歴を取得
   */
  async getByMemberId(memberId: string): Promise<Visit[]> {
    return visits.filter((visit) => visit.memberId === memberId);
  }
}

// シングルトンインスタンスをエクスポート
export const visitRepository = new VisitRepository();

