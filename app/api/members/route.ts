import { NextRequest, NextResponse } from "next/server";
import { memberRepository } from "@/lib/repositories";
import { MemberCreateInput } from "@/types";

/**
 * GET /api/members
 * 全会員を取得
 */
export async function GET() {
  try {
    const members = await memberRepository.getAll();
    return NextResponse.json(members);
  } catch (error) {
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
    const body: MemberCreateInput = await request.json();
    const newMember = await memberRepository.createMember(body);
    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}






