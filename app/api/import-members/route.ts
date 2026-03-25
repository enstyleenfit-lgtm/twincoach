import { NextRequest, NextResponse } from "next/server";
import { memberRepository } from "@/lib/repositories";
import { MemberCreateInput } from "@/types";
import { getStoreIdFromRequest } from "@/lib/authz/storeContext";
import { AuthzError } from "@/lib/authz/errors";
import { requireStoreAccess } from "@/lib/authz/authorize";

export interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ index: number; data: MemberCreateInput; error: string }>;
}

/**
 * POST /api/import-members
 * CSVから読み込んだ会員データを一括でSupabaseに保存
 */
export async function POST(request: NextRequest) {
  try {
    const storeId = getStoreIdFromRequest(request);
    if (!storeId) {
      return NextResponse.json({ error: "store_id is required" }, { status: 400 });
    }
    await requireStoreAccess({ storeId, requiredRoles: ["owner", "hq"] });

    const body: MemberCreateInput[] = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected an array of members." },
        { status: 400 }
      );
    }

    if (body.length === 0) {
      return NextResponse.json(
        { error: "No members data provided." },
        { status: 400 }
      );
    }

    // memberRepository.createMembersBulk を使用して一括保存
    const result = await memberRepository.createMembersBulk(body);

    const importResult: ImportResult = {
      successCount: result.successCount,
      errorCount: result.errorCount,
      errors: result.errors,
    };

    return NextResponse.json(importResult);
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("Import error:", error);
    return NextResponse.json(
      {
        error: "Failed to import members",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}







