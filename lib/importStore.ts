import { Member, MemberCreateInput, Session } from "@/types";

const STORAGE_KEY = "twincoach:importedMembers:v1";
const SESSIONS_STORAGE_KEY = "twincoach:importedSessions:v1";

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `import_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function memberKey(m: Pick<Member, "name" | "storeName" | "joinDate">): string {
  return `${m.storeName || ""}__${m.name || ""}__${m.joinDate || ""}`;
}

export function toMemberFromCreateInput(input: MemberCreateInput): Member {
  const today = new Date().toISOString().slice(0, 10);
  const joinDate = input.joinDate || input.lastVisitDate || today;
  const lastVisitDate = input.lastVisitDate || input.joinDate || today;
  const storeName = input.storeName || "店舗未設定";

  return {
    id: generateId(),
    name: input.name,
    plan: input.plan,
    storeName,
    joinDate,
    lastVisitDate,
    visitInterval: input.visitInterval || "",
    assignedTrainer: input.assignedTrainer,
    hasCancellationHistory: input.hasCancellationHistory,
    monthlyRevenue: input.monthlyRevenue,
    notes: input.notes,
  };
}

export function loadImportedMembers(): Member[] {
  if (!canUseLocalStorage()) return [];
  const parsed = safeJsonParse<Member[]>(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed;
}

export function saveImportedMembers(members: Member[]): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

export function upsertImportedMembers(newMembers: Member[]): Member[] {
  const current = loadImportedMembers();
  const map = new Map<string, Member>();
  current.forEach((m) => map.set(memberKey(m), m));
  newMembers.forEach((m) => map.set(memberKey(m), m)); // importedData優先
  const merged = Array.from(map.values());
  saveImportedMembers(merged);
  return merged;
}

export function mergeBaseAndImported(base: Member[], imported: Member[]): Member[] {
  const map = new Map<string, Member>();
  base.forEach((m) => map.set(memberKey(m), m));
  imported.forEach((m) => map.set(memberKey(m), m)); // importedが優先
  return Array.from(map.values());
}

export function clearImportedMembers(): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function loadImportedSessions(): Session[] {
  if (!canUseLocalStorage()) return [];
  const parsed = safeJsonParse<Session[]>(window.localStorage.getItem(SESSIONS_STORAGE_KEY));
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed;
}

export function saveImportedSessions(sessions: Session[]): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
}

function sessionKey(s: Pick<Session, "memberName" | "sessionDate" | "trainerName">): string {
  return `${s.memberName || ""}__${s.sessionDate || ""}__${s.trainerName || ""}`;
}

export function upsertImportedSessions(newSessions: Session[]): Session[] {
  const current = loadImportedSessions();
  const map = new Map<string, Session>();
  current.forEach((s) => map.set(sessionKey(s), s));
  newSessions.forEach((s) => map.set(sessionKey(s), s));
  const merged = Array.from(map.values());
  saveImportedSessions(merged);
  return merged;
}

export function getSessionsForMemberName(memberName: string): Session[] {
  const all = loadImportedSessions();
  return all.filter((s) => (s.memberName || "").trim() === memberName.trim());
}

export function clearImportedSessions(): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(SESSIONS_STORAGE_KEY);
}


