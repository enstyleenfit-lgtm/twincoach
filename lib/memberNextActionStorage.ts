/**
 * 会員別「次回提案」の localStorage 永続化（ブラウザ専用）
 * サーバーでは一切 window に触れない（Vercel 等で安全）
 */
import type { NextActionItem, NextActionSuggestion } from "@/types";

export const MEMBER_NEXT_ACTION_STORAGE_KEY = "twincoach:memberNextActionSuggestion:v1";

export type StoredNextActionPayload = {
  suggestion: NextActionSuggestion;
  updatedAt: string;
};

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isValidSuggestion(s: unknown): s is NextActionSuggestion {
  if (!s || typeof s !== "object") return false;
  const o = s as NextActionSuggestion;
  const pr = o.priority;
  if (pr !== "high" && pr !== "medium" && pr !== "low") return false;
  if (!Array.isArray(o.actions)) return false;
  return o.actions.every(
    (a) =>
      a &&
      typeof a === "object" &&
      typeof (a as NextActionItem).type === "string" &&
      typeof (a as NextActionItem).title === "string" &&
      typeof (a as NextActionItem).description === "string"
  );
}

/**
 * 会員IDに紐づく、セッション入力保存済みの次回提案を読み込む（クライアント専用）
 */
export function readStoredNextActionSuggestion(memberId: string): StoredNextActionPayload | null {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(MEMBER_NEXT_ACTION_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, unknown>;
    const entry = map[memberId];
    if (!entry || typeof entry !== "object") return null;
    const payload = entry as { suggestion?: unknown; updatedAt?: string };
    if (typeof payload.updatedAt !== "string" || !isValidSuggestion(payload.suggestion)) return null;
    return { suggestion: payload.suggestion, updatedAt: payload.updatedAt };
  } catch {
    return null;
  }
}

export function persistNextActionSuggestion(memberId: string, suggestion: NextActionSuggestion): void {
  if (!canUseLocalStorage()) return;
  try {
    const raw = window.localStorage.getItem(MEMBER_NEXT_ACTION_STORAGE_KEY);
    const map: Record<string, StoredNextActionPayload> = raw
      ? (JSON.parse(raw) as Record<string, StoredNextActionPayload>)
      : {};
    map[memberId] = { suggestion, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(MEMBER_NEXT_ACTION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // 永続化失敗は握りつぶす
  }
}
