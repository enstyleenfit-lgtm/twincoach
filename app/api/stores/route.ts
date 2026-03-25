import { NextResponse } from "next/server";
import { listMyStores } from "@/lib/authz/authorize";

/**
 * GET /api/stores
 * ログインユーザーが所属する店舗一覧（店舗名・契約ステータス・自分のroleのみ）を返す
 */
export async function GET() {
  const stores = await listMyStores();
  return NextResponse.json(stores);
}

