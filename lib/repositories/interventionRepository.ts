import { Intervention, SupabaseIntervention } from "@/types";
import { interventions } from "@/lib/mockData";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";
import { mapSupabaseInterventionToIntervention } from "./supabaseMappers";

/**
 * 介入データのリポジトリ
 * 環境変数が設定されている場合はSupabaseを使用、それ以外はモックデータを使用
 */
export class InterventionRepository {
  /**
   * 全介入履歴を取得
   */
  async getAll(): Promise<Intervention[]> {
    if (isSupabaseEnabled() && supabase) {
      // Supabase接続時
      const { data, error } = await supabase
        .from("interventions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Supabase error:", error);
        // エラー時はモックデータにフォールバック
        return interventions;
      }
      // Supabaseのスネークケースをアプリケーションのキャメルケースに変換
      return (data as SupabaseIntervention[]).map(
        mapSupabaseInterventionToIntervention
      );
    }
    // モックデータを使用
    return interventions;
  }

  /**
   * 会員IDで介入履歴を取得
   */
  async getByMemberId(memberId: string): Promise<Intervention[]> {
    if (isSupabaseEnabled() && supabase) {
      // Supabase接続時
      const { data, error } = await supabase
        .from("interventions")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Supabase error:", error);
        // エラー時はモックデータにフォールバック
        return interventions.filter(
          (intervention) => intervention.memberId === memberId
        );
      }
      // Supabaseのスネークケースをアプリケーションのキャメルケースに変換
      return (data as SupabaseIntervention[]).map(
        mapSupabaseInterventionToIntervention
      );
    }
    // モックデータを使用
    return interventions.filter(
      (intervention) => intervention.memberId === memberId
    );
  }
}

// シングルトンインスタンスをエクスポート
export const interventionRepository = new InterventionRepository();

