import { NextRequest, NextResponse } from "next/server";
import { CURRENT_STORE_COOKIE, getStoreIdFromRequest } from "@/lib/authz/storeContext";
import { requireStoreAccess } from "@/lib/authz/authorize";
import { logAudit } from "@/lib/audit/logAudit";

/**
 * GET /api/current-store
 * 現在選択中の store_id（cookie/header）を検証して返す
 */
export async function GET(req: NextRequest) {
  const storeId = getStoreIdFromRequest(req);
  if (!storeId) return NextResponse.json({ storeId: null });

  // 所属チェックはする（ただし契約状態は問わない：ロック画面でも store は選べる）
  const access = await requireStoreAccess({ storeId, requireActiveOrTrial: false });
  return NextResponse.json({
    storeId: access.store.id,
    storeName: access.store.name,
    contractStatus: access.store.contractStatus,
    role: access.membership.role,
  });
}

/**
 * POST /api/current-store
 * { storeId } を受け取り、所属店舗であれば cookie に保存して返す
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { storeId?: string } | null;
  const storeId = body?.storeId?.trim();
  if (!storeId) return NextResponse.json({ error: "storeId is required" }, { status: 400 });

  const access = await requireStoreAccess({ storeId, requireActiveOrTrial: false });

  const res = NextResponse.json({
    storeId: access.store.id,
    storeName: access.store.name,
    contractStatus: access.store.contractStatus,
    role: access.membership.role,
  });

  res.cookies.set(CURRENT_STORE_COOKIE, access.store.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  await logAudit({ storeId: access.store.id, action: "store.switch" });
  return res;
}

