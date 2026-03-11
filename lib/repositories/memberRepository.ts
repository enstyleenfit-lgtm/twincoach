import { Member, MemberCreateInput, MemberUpdateInput, SupabaseMember } from "@/types";
import { members } from "@/lib/mockData";
import { supabase, isSupabaseEnabled } from "@/lib/supabase";
import { mapMemberToSupabaseMember, mapSupabaseMemberToMember } from "./supabaseMappers";

// モック用のインメモリストア（開発/プレビュー用）
// Supabase未接続時でも create/update の“動き”が確認できるようにする
let mockMembersStore: Member[] = members.map((m) => ({ ...m }));

function generateId(): string {
  // Node 18+ / Edge で利用可能なことが多い
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoAny = globalThis.crypto as any;
  if (cryptoAny?.randomUUID) return cryptoAny.randomUUID();
  return `mock_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * 会員データのリポジトリ
 * 環境変数が設定されている場合はSupabaseを使用、それ以外はモックデータを使用
 */
export class MemberRepository {
  /**
   * 互換メソッド（既存呼び出し用）
   */
  /**
   * 全会員を取得
   */
  async getAll(): Promise<Member[]> {
    return this.getAllMembers();
  }

  /**
   * 互換メソッド（既存呼び出し用）
   */
  /**
   * IDで会員を取得
   */
  async getById(id: string): Promise<Member | undefined> {
    return this.getMemberById(id);
  }

  /**
   * 全会員を取得（CRUD向けの明示メソッド）
   */
  async getAllMembers(): Promise<Member[]> {
    if (isSupabaseEnabled() && supabase) {
      // Supabase接続時
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Supabase error:", error);
        // エラー時はモックデータにフォールバック
        return mockMembersStore;
      }
      // Supabaseのスネークケースをアプリケーションのキャメルケースに変換
      return (data as SupabaseMember[]).map(mapSupabaseMemberToMember);
    }
    // モックデータを使用
    return mockMembersStore;
  }

  /**
   * IDで会員を取得（CRUD向けの明示メソッド）
   */
  async getMemberById(id: string): Promise<Member | undefined> {
    if (isSupabaseEnabled() && supabase) {
      // Supabase接続時
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Supabase error:", error);
        // エラー時はモックデータにフォールバック
        return mockMembersStore.find((member) => member.id === id);
      }
      // Supabaseのスネークケースをアプリケーションのキャメルケースに変換
      return data ? mapSupabaseMemberToMember(data as SupabaseMember) : undefined;
    }
    // モックデータを使用
    return mockMembersStore.find((member) => member.id === id);
  }

  /**
   * 会員を作成
   * Supabase接続時: INSERT\n+   * モック時: インメモリストアに追加（永続化なし）
   */
  async createMember(data: MemberCreateInput): Promise<Member> {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    const newMember: Member = {
      id: generateId(),
      name: data.name,
      plan: data.plan,
      storeName: data.storeName,
      joinDate: data.joinDate,
      lastVisitDate: data.joinDate || today,
      visitInterval: "0 days",
      assignedTrainer: data.assignedTrainer,
      notes: data.notes,
      hasCancellationHistory: false,
    };

    if (isSupabaseEnabled() && supabase) {
      const payload = mapMemberToSupabaseMember(newMember);
      const { data: inserted, error } = await supabase
        .from("members")
        .insert(payload)
        .select("*")
        .single();
      if (error) {
        console.error("Supabase error:", error);
        // Supabaseエラー時も“仮作成”として返す（UI導線を壊さない）
        mockMembersStore = [newMember, ...mockMembersStore];
        return newMember;
      }
      return mapSupabaseMemberToMember(inserted as SupabaseMember);
    }

    // モック時（インメモリに追加）
    mockMembersStore = [newMember, ...mockMembersStore];
    return newMember;
  }

  /**
   * 会員を更新
   * Supabase接続時: UPDATE\n+   * モック時: インメモリストアを更新（永続化なし）
   */
  async updateMember(id: string, data: MemberUpdateInput): Promise<Member | undefined> {
    const current = await this.getMemberById(id);
    if (!current) return undefined;

    const updated: Member = {
      ...current,
      name: data.name ?? current.name,
      plan: data.plan ?? current.plan,
      joinDate: data.joinDate ?? current.joinDate,
      storeName: data.storeName ?? current.storeName,
      assignedTrainer: data.assignedTrainer ?? current.assignedTrainer,
      notes: data.notes ?? current.notes,
      lastVisitDate: data.lastVisitDate ?? current.lastVisitDate,
      visitInterval: data.visitInterval ?? current.visitInterval,
      hasCancellationHistory: data.hasCancellationHistory ?? current.hasCancellationHistory,
      monthlyRevenue: data.monthlyRevenue ?? current.monthlyRevenue,
    };

    if (isSupabaseEnabled() && supabase) {
      const payload = mapMemberToSupabaseMember(updated);
      const { data: saved, error } = await supabase
        .from("members")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      if (error) {
        console.error("Supabase error:", error);
        // エラー時はモック側を更新して返す
        mockMembersStore = mockMembersStore.map((m) => (m.id === id ? updated : m));
        return updated;
      }
      return mapSupabaseMemberToMember(saved as SupabaseMember);
    }

    mockMembersStore = mockMembersStore.map((m) => (m.id === id ? updated : m));
    return updated;
  }
}

// シングルトンインスタンスをエクスポート
export const memberRepository = new MemberRepository();

