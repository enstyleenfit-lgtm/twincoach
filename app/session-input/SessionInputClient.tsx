"use client";

import { useEffect, useMemo, useState } from "react";
import type { Member, Session } from "@/types";
import {
  loadImportedSessions,
  saveImportedSessions,
} from "@/lib/importStore";
import { sessionWithConversationTags } from "@/lib/conversationTagAI";
import { generateNextActionsAfterSessionInput } from "@/lib/nextActionAI";
import { persistNextActionSuggestion } from "@/lib/memberNextActionStorage";
import { ExerciseSearchField } from "@/components/session-input/ExerciseSearchField";

type SessionRecord = {
  memberId: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  rest: number;
  formRating: "good" | "normal" | "bad";
  formIssues: string[];
  note?: string;
  createdAt: string;
};

type SavedSession = {
  sessionId: string;
  trainerName: string;
  memberId: string;
  memberName: string;
  storeName: string;
  sessionDate: string; // YYYY-MM-DD
  createdAt: string; // ISO
  records: SessionRecord[];
  /** トレーニングとは別の会話・フォロー用メモ */
  conversationNotes?: string;
};

const SESSION_RECORDS_KEY = "twincoach:trainerSessionRecords:v1";

const TRAINER_NAME = "山本トレーナー";

const EXERCISE_BASE = ["ベンチプレス", "スクワット", "デッドリフト", "その他"] as const;
type ExerciseBase = (typeof EXERCISE_BASE)[number];

const FORM_ISSUES = [
  "肩が前に出る",
  "腰が反る",
  "可動域が浅い",
  "バランス崩れる",
] as const;

const REST_OPTIONS = [30, 60, 90, 120] as const;

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function makeId(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = typeof crypto !== "undefined" ? crypto : null;
  if (c?.randomUUID) return c.randomUUID();
  return `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function ratingToJa(r: SessionRecord["formRating"]): string {
  if (r === "good") return "良い";
  if (r === "normal") return "やや崩れ";
  return "崩れあり";
}

function normalizeNumber(v: string, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

type ExerciseDraft = {
  localId: string;
  exerciseBase: ExerciseBase;
  customExercise: string;
  weight: number;
  reps: number;
  sets: number;
  rest: number;
  formRating: SessionRecord["formRating"];
  formIssues: string[];
  note: string;
};

function defaultDraft(exercise: string): ExerciseDraft {
  const normalized = (exercise || "").trim();
  const isKnownBase = EXERCISE_BASE.includes(normalized as ExerciseBase);
  const exerciseBase: ExerciseBase = isKnownBase
    ? (normalized as ExerciseBase)
    : "その他";
  const customExercise =
    exerciseBase === "その他" && !isKnownBase ? normalized : "";
  return {
    localId: makeId(),
    exerciseBase,
    customExercise,
    weight: 0,
    reps: 0,
    sets: 1,
    rest: 90,
    formRating: "good",
    formIssues: [],
    note: "",
  };
}

function exerciseNameToDraftBase(exercise: string): { exerciseBase: ExerciseBase; customExercise: string } {
  const name = (exercise || "").trim();
  if (!name) return { exerciseBase: "その他", customExercise: "" };
  if (EXERCISE_BASE.includes(name as ExerciseBase) && name !== "その他") {
    return { exerciseBase: name as ExerciseBase, customExercise: "" };
  }
  if (name === "その他") return { exerciseBase: "その他", customExercise: "" };
  return { exerciseBase: "その他", customExercise: name };
}

function buildDraftFromPrefill(params: {
  localId: string;
  desiredExerciseName: string;
  prefill?: SessionRecord | null;
  preferredIssues: string[];
}): ExerciseDraft {
  const { localId, desiredExerciseName, prefill, preferredIssues } = params;

  if (prefill) {
    const base = exerciseNameToDraftBase(prefill.exercise);
    return {
      localId,
      exerciseBase: base.exerciseBase,
      customExercise: base.customExercise,
      weight: prefill.weight,
      reps: prefill.reps,
      sets: prefill.sets,
      rest: prefill.rest,
      formRating: prefill.formRating,
      // 過去の「頻出癖」が空であっても、癖ONができるようにフォールバック
      formIssues:
        prefill.formIssues && prefill.formIssues.length > 0
          ? prefill.formIssues
          : preferredIssues,
      note: prefill.note ?? "",
    };
  }

  const base = exerciseNameToDraftBase(desiredExerciseName);
  return {
    localId,
    exerciseBase: base.exerciseBase,
    customExercise: base.customExercise,
    weight: 0,
    reps: 0,
    sets: 1,
    rest: 90,
    formRating: "good",
    formIssues: preferredIssues,
    note: "",
  };
}

function getExerciseName(d: ExerciseDraft): string {
  if (d.exerciseBase !== "その他") return d.exerciseBase;
  return d.customExercise.trim() || "その他";
}

function buildSessionMenuSummary(records: SessionRecord[]): string {
  return records
    .map((r) => {
      const issues = r.formIssues.length ? ` / 癖:${r.formIssues.join("、")}` : "";
      const note = r.note ? ` / メモ:${r.note}` : "";
      return `${r.exercise}: ${r.weight}kg x ${r.reps} x ${r.sets}${issues} / 休憩:${r.rest}s / 評価:${ratingToJa(r.formRating)}${note}`;
    })
    .join("\n");
}

function buildConversationSummary(records: SessionRecord[]): string {
  const parts: string[] = [];
  for (const r of records) {
    parts.push(`種目:${r.exercise}`);
    parts.push(`動作評価:${ratingToJa(r.formRating)}`);
    if (r.formIssues.length > 0) parts.push(`フォームの癖:${r.formIssues.join("、")}`);
    if (r.note?.trim()) parts.push(`メモ:${r.note.trim()}`);
  }
  parts.push("次回予約: 退館前に確定");
  return parts.join(" / ");
}

function copyLastSessionRecords(
  last: SavedSession | null | undefined,
  preferredIssues: string[]
): ExerciseDraft[] {
  if (!last || last.records.length === 0) return [];
  const records = last.records;
  return records.map((r) => {
    const isLift =
      r.exercise === "ベンチプレス" ||
      r.exercise === "スクワット" ||
      r.exercise === "デッドリフト";
    return {
      localId: makeId(),
      exerciseBase: isLift ? (r.exercise as ExerciseBase) : "その他",
      customExercise: isLift ? "" : r.exercise === "その他" ? "" : r.exercise,
      weight: r.weight,
      reps: r.reps,
      sets: r.sets,
      rest: r.rest,
      formRating: r.formRating,
      formIssues:
        r.formIssues && r.formIssues.length > 0 ? r.formIssues : preferredIssues,
      note: r.note ?? "",
    };
  });
}

type SessionInputProps = {
  initialMembers: Member[];
};

export default function SessionInputClient({ initialMembers }: SessionInputProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [assignedMembers, setAssignedMembers] = useState<Member[]>(() =>
    initialMembers.filter((m) => m.assignedTrainer === TRAINER_NAME)
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [drafts, setDrafts] = useState<ExerciseDraft[]>([]);
  const [conversationNotes, setConversationNotes] = useState("");
  const [status, setStatus] = useState<string>("");
  const [memoOpen, setMemoOpen] = useState<Record<string, boolean>>({});

  const selectedMember = useMemo(
    () => assignedMembers.find((m) => m.id === selectedMemberId) ?? null,
    [assignedMembers, selectedMemberId]
  );

  const quickMenu = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of savedSessions) {
      for (const r of s.records) {
        const name = r.exercise?.trim();
        if (!name) continue;
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    const items = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
      .map(([exercise]) => exercise);

    // ベース定番を極力残す（登録が無くても迷わない）
    const base = ["ベンチプレス", "スクワット", "デッドリフト", "その他"];
    const merged = Array.from(new Set([...items, ...base]));
    return merged.filter((x) => x !== "");
  }, [savedSessions]);

  const lastSessionForSelectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    const list = savedSessions
      .filter((s) => s.memberId === selectedMemberId)
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list[0] ?? null;
  }, [savedSessions, selectedMemberId]);

  const recentSessionsForMember = useMemo(() => {
    if (!selectedMemberId) return [];
    return savedSessions
      .filter((s) => s.memberId === selectedMemberId)
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [savedSessions, selectedMemberId]);

  const frequentFormIssues = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of recentSessionsForMember) {
      for (const r of s.records) {
        for (const issue of r.formIssues ?? []) {
          if (!FORM_ISSUES.includes(issue as (typeof FORM_ISSUES)[number])) continue;
          counts.set(issue, (counts.get(issue) ?? 0) + 1);
        }
      }
    }

    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const atLeastTwo = entries.filter(([, c]) => c >= 2).map(([issue]) => issue);
    if (atLeastTwo.length > 0) return atLeastTwo;
    if (entries.length > 0) return [entries[0][0]];
    return [];
  }, [recentSessionsForMember]);

  useEffect(() => {
    if (!status) return;
    const t = window.setTimeout(() => setStatus(""), 2600);
    return () => window.clearTimeout(t);
  }, [status]);

  useEffect(() => {
    setMembers(initialMembers);
    setAssignedMembers(initialMembers.filter((m) => m.assignedTrainer === TRAINER_NAME));
  }, [initialMembers]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
    const raw = window.localStorage.getItem(SESSION_RECORDS_KEY);
    const parsed = safeParse<SavedSession[]>(raw);
    setSavedSessions(Array.isArray(parsed) ? parsed : []);
  }, []);

  useEffect(() => {
    if (!selectedMemberId && assignedMembers.length > 0) {
      setSelectedMemberId(assignedMembers[0].id);
    }
  }, [assignedMembers, selectedMemberId]);

  useEffect(() => {
    setConversationNotes("");
  }, [selectedMemberId]);

  useEffect(() => {
    // 初期ドラフトは「1種目だけ」。直近セッション1件目を優先で埋めます。
    const initialExercise = quickMenu[0] ?? "ベンチプレス";
    const lastRecords = lastSessionForSelectedMember?.records ?? [];
    const prefill = lastRecords.length > 0 ? lastRecords[0] : null;

    const isPristine =
      drafts.length === 0 ||
      (drafts.length === 1 &&
        drafts[0].weight === 0 &&
        drafts[0].reps === 0 &&
        drafts[0].note.trim() === "" &&
        drafts[0].formIssues.length === 0);

    if (!isPristine) return;

    const localId = drafts[0]?.localId ?? makeId();
    setDrafts([
      buildDraftFromPrefill({
        localId,
        desiredExerciseName: initialExercise,
        prefill,
        preferredIssues: frequentFormIssues,
      }),
    ]);
  }, [quickMenu, selectedMemberId, lastSessionForSelectedMember, frequentFormIssues]);

  useEffect(() => {
    // member切り替え時に、前回コピー相当を自動反映（ただし未保存の入力は上書きしない）
    if (!selectedMemberId) return;
    if (drafts.length === 1) {
      // draftがデフォルト初期状態のときだけ上書き
      const isBlank =
        drafts[0].weight === 0 &&
        drafts[0].reps === 0 &&
        drafts[0].rest === 90 &&
        drafts[0].note.trim() === "";
      if (isBlank) {
        const initialExercise = quickMenu[0] ?? "ベンチプレス";
        const lastRecords = lastSessionForSelectedMember?.records ?? [];
        const prefill = lastRecords.length > 0 ? lastRecords[0] : null;
        const localId = drafts[0].localId;
        setDrafts([
          buildDraftFromPrefill({
            localId,
            desiredExerciseName: initialExercise,
            prefill,
            preferredIssues: frequentFormIssues,
          }),
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMemberId, frequentFormIssues, lastSessionForSelectedMember, quickMenu]);

  const setDraftAt = (localId: string, patch: Partial<ExerciseDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.localId === localId ? { ...d, ...patch } : d)));
  };

  const handleExerciseMasterPick = (exerciseName: string, append: boolean) => {
    if (append) {
      setDrafts((prev) => [
        ...prev,
        buildDraftFromPrefill({
          localId: makeId(),
          desiredExerciseName: exerciseName,
          prefill: null,
          preferredIssues: frequentFormIssues,
        }),
      ]);
      setStatus(`「${exerciseName}」を追加しました`);
      return;
    }
    setDrafts((prev) => {
      if (prev.length === 0) {
        return [
          buildDraftFromPrefill({
            localId: makeId(),
            desiredExerciseName: exerciseName,
            prefill: null,
            preferredIssues: frequentFormIssues,
          }),
        ];
      }
      const first = prev[0];
      const base = exerciseNameToDraftBase(exerciseName);
      return [
        {
          ...first,
          exerciseBase: base.exerciseBase,
          customExercise: base.customExercise,
        },
        ...prev.slice(1),
      ];
    });
    setStatus(`「${exerciseName}」を1種目に設定しました`);
  };

  const addExercise = () => {
    const nextExercise = quickMenu[0] ?? "ベンチプレス";
    const lastRecords = lastSessionForSelectedMember?.records ?? [];
    const index = drafts.length;
    const prefill = index < lastRecords.length ? lastRecords[index] : null;
    const localId = makeId();
    setDrafts((prev) => [
      ...prev,
      buildDraftFromPrefill({
        localId,
        desiredExerciseName: nextExercise,
        prefill,
        preferredIssues: frequentFormIssues,
      }),
    ]);
  };

  const handleCopyLast = () => {
    const copied = copyLastSessionRecords(lastSessionForSelectedMember, frequentFormIssues);
    if (copied.length === 0) {
      setStatus("前回コピーできる記録がありません");
      return;
    }
    setDrafts(copied);
    setMemoOpen({});
    setConversationNotes(lastSessionForSelectedMember?.conversationNotes ?? "");
    setStatus("前回をコピーしました");
  };

  const validateDraft = (d: ExerciseDraft): string | null => {
    const exercise = getExerciseName(d);
    if (!exercise || exercise === "その他") return "種目を入力してください";
    if (d.weight <= 0) return "重量（kg）を入力してください";
    if (d.reps <= 0) return "回数を入力してください";
    if (d.sets <= 0) return "セット数を入力してください";
    if (!d.rest) return "休憩時間を選択してください";
    return null;
  };

  const persistSession = (
    draftsToSave: ExerciseDraft[],
    opts?: { conversationNotes?: string }
  ) => {
    setStatus("");
    if (!selectedMember) {
      setStatus("会員を選択してください");
      return;
    }
    const notesForSave =
      opts?.conversationNotes !== undefined ? opts.conversationNotes : conversationNotes;
    if (draftsToSave.length === 0) {
      setStatus("種目を追加してください");
      return;
    }
    for (const d of draftsToSave) {
      const err = validateDraft(d);
      if (err) {
        setStatus(err);
        return;
      }
    }

    const sessionDate = todayYmd();
    const sessionId = makeId();
    const createdAt = new Date().toISOString();

    const records: SessionRecord[] = draftsToSave.map((d) => ({
      memberId: selectedMember.id,
      exercise: getExerciseName(d),
      weight: d.weight,
      reps: d.reps,
      sets: d.sets,
      rest: d.rest,
      formRating: d.formRating,
      formIssues: d.formIssues,
      note: d.note.trim() ? d.note.trim() : undefined,
      createdAt,
    }));

    const notesTrimmed = notesForSave.trim();
    const saved: SavedSession = {
      sessionId,
      trainerName: TRAINER_NAME,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      storeName: selectedMember.storeName,
      sessionDate,
      createdAt,
      records,
      ...(notesTrimmed ? { conversationNotes: notesTrimmed } : {}),
    };

    if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
    const nextSavedSessions = [saved, ...savedSessions].slice(0, 300);
    window.localStorage.setItem(
      SESSION_RECORDS_KEY,
      JSON.stringify(nextSavedSessions)
    );
    setSavedSessions(nextSavedSessions);

    const nextSuggestion = generateNextActionsAfterSessionInput(selectedMember, records, {
      sessionId,
      sessionDate,
      trainerName: TRAINER_NAME,
      conversationNotes: notesTrimmed || undefined,
    });
    persistNextActionSuggestion(selectedMember.id, nextSuggestion);
    const primaryNextAction =
      nextSuggestion.actions[0]?.title ?? "次回予約をその場で確定";

    setStatus("保存しました · 次回提案を更新しました");

    // 既存のセッション履歴（MemberSessionsClient）へも反映
    try {
      const imported = loadImportedSessions();
      const menuSummary = buildSessionMenuSummary(records);
      const conversationSummary = buildConversationSummary(records);
      const session: Session = sessionWithConversationTags({
        id: sessionId,
        memberName: selectedMember.name,
        sessionDate,
        menuSummary,
        conversationSummary,
        conversationNotes: notesTrimmed || undefined,
        nextAction: primaryNextAction,
        trainerName: TRAINER_NAME,
        storeName: selectedMember.storeName,
      });
      const merged = [session, ...imported];
      saveImportedSessions(merged);
    } catch {
      // 表示系は必須ではないため握りつぶす（ログだけ残す）
      // eslint-disable-next-line no-console
      console.error("Failed to sync to session history");
    }
  };

  const handleSave = () => persistSession(drafts);

  const handleSaveSameAsLast = () => {
    const copied = copyLastSessionRecords(lastSessionForSelectedMember, frequentFormIssues);
    if (!selectedMember) {
      setStatus("会員を選択してください");
      return;
    }
    if (copied.length === 0) {
      setStatus("前回の保存データがありません");
      return;
    }
    const lastNotes = lastSessionForSelectedMember?.conversationNotes ?? "";
    setConversationNotes(lastNotes);
    setDrafts(copied);
    setMemoOpen({});
    persistSession(copied, { conversationNotes: lastNotes });
  };

  const quickExercisesOptions = useMemo(() => {
    // よく使うメニュー上位 + ベース定番
    const unique = Array.from(new Set([...quickMenu, ...EXERCISE_BASE]));
    return unique;
  }, [quickMenu]);

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden py-4 sm:py-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-6 sm:pr-6">
      <div className="w-full max-w-3xl mx-auto min-w-0">
        <header className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-balance">セッション入力</h1>
          <p className="text-slate-600 text-base mt-1">
            タップで完了。1種目は10秒目標で入力できます。
          </p>
        </header>

        <div className="mb-4 bg-white border border-slate-200 shadow-sm rounded-xl p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <div className="text-slate-500 text-xs mb-1">会員</div>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full min-w-0 rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-900"
              >
                {assignedMembers.length === 0 ? (
                  <option value="">担当会員がありません</option>
                ) : (
                  assignedMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="shrink-0 sm:self-end">
              <button
                type="button"
                onClick={handleCopyLast}
                className="h-12 w-full sm:w-auto px-4 rounded-lg border border-slate-200 bg-slate-100/80 text-slate-800 text-base font-semibold hover:bg-slate-100 transition-colors"
              >
                前回コピー
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4 bg-white border border-slate-200 shadow-sm rounded-xl p-4">
          <h2 className="text-slate-900 font-semibold text-base mb-2">会話内容</h2>
          <p className="text-slate-500 text-xs mb-2">
            雑談・仕事・生活の変化・悩み・次回の話題など（トレーニングの種目メモとは別）
          </p>
          <textarea
            value={conversationNotes}
            onChange={(e) => setConversationNotes(e.target.value)}
            placeholder="会話した内容、最近の変化、気になったことを記録"
            rows={5}
            className="w-full min-h-[120px] rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-900 placeholder:text-slate-600 resize-y"
          />
        </div>

        <div className="mb-4">
          <h2 className="text-slate-900 font-semibold text-base mb-2">トレーニング内容</h2>
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <ExerciseSearchField onPick={handleExerciseMasterPick} />
          </div>
          <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-2">
            よく使うメニュー
          </div>
          <div className="flex flex-wrap gap-2">
            {quickExercisesOptions.slice(0, 5).map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => {
                  // 一番上の種目へセット（速度重視）
                  setDrafts((prev) => {
                    if (prev.length === 0) return prev;
                    const first = prev[0];
                    const base = EXERCISE_BASE.includes(x as ExerciseBase)
                      ? (x as ExerciseBase)
                      : "その他";
                    return prev.map((d, idx) => {
                      if (idx !== 0) return d;
                      return {
                        ...d,
                        exerciseBase: base,
                        customExercise:
                          base === "その他" && x !== "その他" ? x : d.customExercise,
                      };
                    });
                  });
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 hover:bg-slate-100 transition-colors"
              >
                {x}
              </button>
            ))}
          </div>
        </div>

        {/* max-lg: 下タブ(約5rem)＋固定保存バー分の余白（本文が隠れないよう多めに） */}
        <div className="space-y-3 pb-56 lg:pb-24">
          {drafts.map((d, idx) => (
            <div
              key={d.localId}
              className={`bg-white border rounded-2xl p-4 ${
                d.weight > 0 || d.reps > 0
                  ? "border-emerald-500/40"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-slate-900 font-semibold">
                  {idx + 1}種目
                </div>
                {drafts.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDrafts((prev) => prev.filter((x) => x.localId !== d.localId));
                    }}
                    className="text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    削除
                  </button>
                ) : (
                  <span className="text-slate-500 text-xs">タップ入力</span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-slate-500 text-xs mb-1">種目</div>
                  <select
                    value={d.exerciseBase}
                    onChange={(e) => {
                      const base = e.target.value as ExerciseBase;
                      setDraftAt(d.localId, {
                        exerciseBase: base,
                        customExercise: base === "その他" ? d.customExercise : "",
                      });
                    }}
                    className="w-full min-w-0 rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-900"
                  >
                    <option value="ベンチプレス">ベンチプレス</option>
                    <option value="スクワット">スクワット</option>
                    <option value="デッドリフト">デッドリフト</option>
                    <option value="その他">その他</option>
                  </select>
                  {d.exerciseBase === "その他" && (
                    <input
                      value={d.customExercise}
                      onChange={(e) => setDraftAt(d.localId, { customExercise: e.target.value })}
                      placeholder="例）ベンチプレス（フォーム改善）"
                      className="mt-2 w-full min-w-0 rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-900 placeholder:text-slate-600"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-slate-500 text-xs mb-1">重量（kg）</div>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={d.weight}
                      onChange={(e) => setDraftAt(d.localId, { weight: normalizeNumber(e.target.value, 0) })}
                      className={`w-full min-w-0 rounded-lg bg-slate-50 border px-3 py-3 text-base text-slate-900 ${
                        d.weight > 0 ? "border-emerald-500/50" : "border-slate-200"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">回数</div>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={d.reps}
                      onChange={(e) => setDraftAt(d.localId, { reps: normalizeNumber(e.target.value, 0) })}
                      className={`w-full min-w-0 rounded-lg bg-slate-50 border px-3 py-3 text-base text-slate-900 ${
                        d.reps > 0 ? "border-emerald-500/50" : "border-slate-200"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-slate-500 text-xs mb-1">セット数</div>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={d.sets}
                      onChange={(e) => setDraftAt(d.localId, { sets: normalizeNumber(e.target.value, 1) })}
                      className={`w-full min-w-0 rounded-lg bg-slate-50 border px-3 py-3 text-base text-slate-900 ${
                        d.sets > 0 && (d.weight > 0 || d.reps > 0)
                          ? "border-emerald-500/50"
                          : "border-slate-200"
                      }`}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="text-slate-500 text-xs mb-1">休憩時間</div>
                    <select
                      value={d.rest}
                      onChange={(e) => setDraftAt(d.localId, { rest: normalizeNumber(e.target.value, 90) })}
                      className={`w-full min-w-0 rounded-lg bg-slate-50 border px-3 py-3 text-base text-slate-900 ${
                        d.weight > 0 || d.reps > 0
                          ? "border-emerald-500/50"
                          : "border-slate-200"
                      }`}
                    >
                      {REST_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}秒
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 text-xs mb-1">動作評価</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { key: "good", label: "良い" },
                        { key: "normal", label: "やや崩れ" },
                        { key: "bad", label: "崩れあり" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setDraftAt(d.localId, { formRating: opt.key })}
                        className={`rounded-lg border px-2 py-3 text-sm font-semibold transition-colors ${
                          d.formRating === opt.key
                            ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-800"
                            : "border-slate-200 bg-slate-50/40 text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 text-xs mb-1">フォームの癖（複数選択）</div>
                  <div className="grid grid-cols-2 gap-2">
                    {FORM_ISSUES.map((issue) => {
                      const checked = d.formIssues.includes(issue);
                      return (
                        <button
                          key={issue}
                          type="button"
                          onClick={() => {
                            setDraftAt(d.localId, {
                              formIssues: checked
                                ? d.formIssues.filter((x) => x !== issue)
                                : [...d.formIssues, issue],
                            });
                          }}
                          className={`rounded-lg border px-2 py-2.5 text-sm font-semibold transition-colors ${
                            checked
                              ? "border-red-500/40 bg-red-500/10 text-red-700"
                              : "border-slate-200 bg-slate-50/40 text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          {issue}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <button
                      type="button"
                      onClick={() =>
                        setMemoOpen((prev) => ({
                          ...prev,
                          [d.localId]: !prev[d.localId],
                        }))
                      }
                      className="text-slate-500 text-xs hover:text-slate-700"
                    >
                      メモ（任意） {memoOpen[d.localId] ? "閉じる" : "開く"}
                    </button>
                    {d.note.trim() ? (
                      <span className="text-[11px] text-emerald-800">入力あり</span>
                    ) : null}
                  </div>

                  {memoOpen[d.localId] ? (
                    <div>
                      <input
                        value={d.note}
                        onChange={(e) => setDraftAt(d.localId, { note: e.target.value })}
                        placeholder="例）次回はフォーム意識"
                        className={`w-full min-w-0 rounded-lg bg-slate-50 border px-3 py-3 text-base text-slate-900 placeholder:text-slate-600 ${
                          d.note.trim()
                            ? "border-emerald-500/40"
                            : "border-slate-200"
                        }`}
                      />
                      <div className="mt-2 text-[11px] text-slate-500">
                        将来：音声入力に対応する前提の構造です。
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-600">
                      タップでメモ入力
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={addExercise}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
            >
              ＋種目追加
            </button>
          </div>
        </div>

        {/*
          モバイル: 下タブ（z-40）の上に固定。bottom-20 は RoleBasedShell の main pb-20 と同じ基準。
          PC（lg）: 従来どおりビューポート下端・z-30・半透明バー。
        */}
        <div className="fixed bottom-20 left-0 right-0 z-50 max-w-full overflow-x-hidden border-t border-slate-200 bg-white/95 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] shadow-[0_-4px_20px_rgba(15,23,42,0.1)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90 sm:px-6 lg:bottom-0 lg:z-30 lg:bg-slate-50/70 lg:py-4 lg:pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] lg:shadow-none lg:backdrop-blur">
          <div className="w-full max-w-3xl mx-auto min-w-0 px-0">
            {lastSessionForSelectedMember && lastSessionForSelectedMember.records.length > 0 ? (
              <button
                type="button"
                onClick={handleSaveSameAsLast}
                className="w-full rounded-2xl border border-slate-200 bg-white/60 hover:bg-white px-4 py-4 text-sm font-bold text-slate-800 mb-3"
              >
                前回と同じで保存
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-500 text-slate-900 py-4 text-sm font-bold"
            >
              保存
            </button>
            {status ? (
              <div className="mt-2 text-center text-xs text-slate-700">{status}</div>
            ) : (
              <div className="mt-2 text-center text-xs text-slate-500">保存はローカルのみ（ローカル完結）</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

