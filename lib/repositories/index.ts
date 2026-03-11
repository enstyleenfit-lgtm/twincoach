/**
 * リポジトリの統一エクスポート
 * 将来的にSupabase接続時に、ここでクライアントを初期化
 */

export { memberRepository, MemberRepository } from "./memberRepository";
export { visitRepository, VisitRepository } from "./visitRepository";
export { interventionRepository, InterventionRepository } from "./interventionRepository";
export { taskRepository, TaskRepository } from "./taskRepository";

// TODO: Supabase接続時に以下を追加
// import { createClient } from '@supabase/supabase-js';
// export const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

