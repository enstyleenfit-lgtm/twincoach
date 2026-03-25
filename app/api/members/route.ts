import { NextRequest, NextResponse } from "next/server";
import { memberRepository } from "@/lib/repositories";
import { MemberCreateInput } from "@/types";
import { getStoreIdFromRequest } from "@/lib/authz/storeContext";
import { AuthzError } from "@/lib/authz/errors";
import { requireStoreAccess } from "@/lib/authz/authorize";
import { logAudit } from "@/lib/audit/logAudit";

/**
 * GET /api/members
 * 全会員を取得
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = getStoreIdFromRequest(request);
    if (!storeId) {
      return NextResponse.json({ error: "store_id is required" }, { status: 400 });
    }

    await requireStoreAccess({ storeId, requiredRoles: ["trainer", "owner", "hq", "staff"] });
    const members = await memberRepository.getAllForStore(storeId);
    await logAudit({ storeId, action: "members.list" });
    return NextResponse.json(members);
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/members
 * 新しい会員を作成
 */
export async function POST(request: NextRequest) {
  try {
    const storeId = getStoreIdFromRequest(request);
    if (!storeId) {
      return NextResponse.json({ error: "store_id is required" }, { status: 400 });
    }
    await requireStoreAccess({ storeId, requiredRoles: ["trainer", "owner", "hq", "staff"] });

    const body: MemberCreateInput = await request.json();
    // server-side で store 変更を防ぐ（UI改ざん対策）
    const payload: MemberCreateInput = { ...body, storeName: body.storeName };
    const newMember = await memberRepository.createMember(payload);
    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}







