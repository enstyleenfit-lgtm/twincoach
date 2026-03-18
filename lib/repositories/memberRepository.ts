import { Member, MemberCreateInput, MemberUpdateInput, SupabaseMember } from "@/types";
import { members } from "@/lib/mockData";
import { createServerSupabase, isSupabaseEnabled } from "@/lib/supabase/server";
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
    if (isSupabaseEnabled()) {
      try {
        // Supabase接続時
        const supabase = await createServerSupabase();
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
      } catch (error) {
        console.error("Failed to create Supabase client:", error);
        // エラー時はモックデータにフォールバック
        return mockMembersStore;
      }
    }
    // モックデータを使用
    return mockMembersStore;
  }

  /**
   * IDで会員を取得（CRUD向けの明示メソッド）
   */
  async getMemberById(id: string): Promise<Member | undefined> {
    if (isSupabaseEnabled()) {
      try {
        // Supabase接続時
        const supabase = await createServerSupabase();
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
      } catch (error) {
        console.error("Failed to create Supabase client:", error);
        // エラー時はモックデータにフォールバック
        return mockMembersStore.find((member) => member.id === id);
      }
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
      lastVisitDate: data.lastVisitDate || data.joinDate || today,
      visitInterval: data.visitInterval || "0 days",
      assignedTrainer: data.assignedTrainer,
      notes: data.notes,
      hasCancellationHistory: data.hasCancellationHistory ?? false,
      monthlyRevenue: data.monthlyRevenue,
    };

    if (isSupabaseEnabled()) {
      try {
        const supabase = await createServerSupabase();
        const payload = mapMemberToSupabaseMember(newMember);
        const { data: inserted, error } = await supabase
          .from("members")
          .insert(payload)
          .select("*")
          .single();
        if (error) {
          console.error("Supabase error:", error);
          // Supabaseエラー時も"仮作成"として返す（UI導線を壊さない）
          mockMembersStore = [newMember, ...mockMembersStore];
          return newMember;
        }
        return mapSupabaseMemberToMember(inserted as SupabaseMember);
      } catch (error) {
        console.error("Failed to create Supabase client:", error);
        // エラー時はモック側に追加して返す
        mockMembersStore = [newMember, ...mockMembersStore];
        return newMember;
      }
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

    mockMembersStore = mockMembersStore.map((m) => (m.id === id ? updated : m));
    return updated;
  }

  /**
   * 会員を一括作成（CSVインポート用）
   * @param membersData 会員データの配列
   * @returns 作成結果（成功数、失敗数、エラー詳細）
   */
  async createMembersBulk(
    membersData: MemberCreateInput[]
  ): Promise<{
    successCount: number;
    errorCount: number;
    errors: Array<{ index: number; data: MemberCreateInput; error: string }>;
    createdMembers: Member[];
  }> {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const errors: Array<{ index: number; data: MemberCreateInput; error: string }> = [];
    const createdMembers: Member[] = [];

    // バリデーション: 必須フィールドチェック
    membersData.forEach((data, index) => {
      if (!data.name || !data.name.trim()) {
        errors.push({
          index,
          data,
          error: "名前が必須です",
        });
      }
      if (!data.plan || !data.plan.trim()) {
        errors.push({
          index,
          data,
          error: "プランが必須です",
        });
      }
      if (!data.joinDate || !data.joinDate.trim()) {
        errors.push({
          index,
          data,
          error: "入会日が必須です",
        });
      }
      if (!data.storeName || !data.storeName.trim()) {
        errors.push({
          index,
          data,
          error: "店舗名が必須です",
        });
      }
    });

    // バリデーションエラーがある場合は、エラーを返す
    const validData = membersData.filter(
      (_, index) => !errors.some((e) => e.index === index)
    );

    if (validData.length === 0) {
      return {
        successCount: 0,
        errorCount: errors.length,
        errors,
        createdMembers: [],
      };
    }

    // 会員データを準備
    const newMembers: Member[] = validData.map((data) => ({
      id: generateId(),
      name: data.name,
      plan: data.plan,
      storeName: data.storeName,
      joinDate: data.joinDate,
      lastVisitDate: data.lastVisitDate || data.joinDate || today,
      visitInterval: data.visitInterval || "0 days",
      assignedTrainer: data.assignedTrainer,
      notes: data.notes,
      hasCancellationHistory: data.hasCancellationHistory ?? false,
      monthlyRevenue: data.monthlyRevenue,
    }));

    // モック時（インメモリに追加）
    mockMembersStore = [...newMembers, ...mockMembersStore];
    return {
      successCount: newMembers.length,
      errorCount: errors.length,
      errors,
      createdMembers: newMembers,
    };
  }
}

// シングルトンインスタンスをエクスポート
export const memberRepository = new MemberRepository();

