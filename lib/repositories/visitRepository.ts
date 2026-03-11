import { Visit, SupabaseVisit } from "@/types";
import { visits } from "@/lib/mockData";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";
import { mapSupabaseVisitToVisit } from "./supabaseMappers";

/**
 * 訪問データのリポジトリ
 * 環境変数が設定されている場合はSupabaseを使用、それ以外はモックデータを使用
 */
export class VisitRepository {
  /**
   * 全訪問履歴を取得
   */
  async getAll(): Promise<Visit[]> {
    if (isSupabaseEnabled() && supabase) {
      // Supabase接続時
      const { data, error } = await supabase
        .from("visits")
        .select("*")
        .order("visit_date", { ascending: false });
      if (error) {
        console.error("Supabase error:", error);
        // エラー時はモックデータにフォールバック
        return visits;
      }
      // Supabaseのスネークケースをアプリケーションのキャメルケースに変換
      return (data as SupabaseVisit[]).map(mapSupabaseVisitToVisit);
    }
    // モックデータを使用
    return visits;
  }

  /**
   * 会員IDで訪問履歴を取得
   */
  async getByMemberId(memberId: string): Promise<Visit[]> {
    if (isSupabaseEnabled() && supabase) {
      // Supabase接続時
      const { data, error } = await supabase
        .from("visits")
        .select("*")
        .eq("member_id", memberId)
        .order("visit_date", { ascending: false });
      if (error) {
        console.error("Supabase error:", error);
        // エラー時はモックデータにフォールバック
        return visits.filter((visit) => visit.memberId === memberId);
      }
      // Supabaseのスネークケースをアプリケーションのキャメルケースに変換
      return (data as SupabaseVisit[]).map(mapSupabaseVisitToVisit);
    }
    // モックデータを使用
    return visits.filter((visit) => visit.memberId === memberId);
  }
}

// シングルトンインスタンスをエクスポート
export const visitRepository = new VisitRepository();

