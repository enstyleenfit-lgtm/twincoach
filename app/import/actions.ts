"use server";

import { memberRepository } from "@/lib/repositories";
import { MemberCreateInput } from "@/types";

export interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ index: number; data: MemberCreateInput; error: string }>;
}

export async function importMembers(membersData: MemberCreateInput[]): Promise<ImportResult> {
  try {
    const result = await memberRepository.createMembersBulk(membersData);
    return {
      successCount: result.successCount,
      errorCount: result.errorCount,
      errors: result.errors,
    };
  } catch (error) {
    console.error("Import error:", error);
    return {
      successCount: 0,
      errorCount: membersData.length,
      errors: membersData.map((data, index) => ({
        index,
        data,
        error: error instanceof Error ? error.message : "不明なエラーが発生しました",
      })),
    };
  }
}





