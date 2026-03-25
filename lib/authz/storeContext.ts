import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export const CURRENT_STORE_COOKIE = "tc_store_id";
export const STORE_ID_HEADER = "x-store-id";

export async function getCurrentStoreIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CURRENT_STORE_COOKIE)?.value ?? null;
}

export function getStoreIdFromRequest(req: NextRequest): string | null {
  const header = req.headers.get(STORE_ID_HEADER);
  if (header && header.trim()) return header.trim();
  const cookie = req.cookies.get(CURRENT_STORE_COOKIE)?.value;
  return cookie && cookie.trim() ? cookie.trim() : null;
}

