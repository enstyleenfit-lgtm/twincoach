export type ImportFileFormat = "twincoach" | "hacomono" | "visits" | "tasks" | "sessions";

export interface ImportHistoryEntry {
  id: string;
  importedAt: string; // ISO
  fileFormat: ImportFileFormat;
  count: number;
  successCount: number;
  errorCount: number;
  message?: string; // エラー概要など（任意）
}

const STORAGE_KEY = "twincoach:importHistory:v1";
const MAX_ENTRIES = 50;

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
  return `history_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function loadImportHistory(): ImportHistoryEntry[] {
  if (!canUseLocalStorage()) return [];
  const parsed = safeJsonParse<ImportHistoryEntry[]>(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed;
}

export function addImportHistoryEntry(entry: Omit<ImportHistoryEntry, "id" | "importedAt">): ImportHistoryEntry[] {
  if (!canUseLocalStorage()) return [];
  const current = loadImportHistory();
  const next: ImportHistoryEntry = {
    id: generateId(),
    importedAt: new Date().toISOString(),
    ...entry,
  };
  const merged = [next, ...current].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export function clearImportHistory(): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}


