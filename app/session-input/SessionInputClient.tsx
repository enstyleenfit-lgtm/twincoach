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
import { MobileExercisePicker } from "@/components/session-input/MobileExercisePicker";
import { findMasterByName, getSessionPickDefaults, type ExerciseMaster } from "@/lib/exerciseMaster";
import { getTrialStoreNameForData } from "@/lib/trialStore";
import { useTrialStore } from "@/components/store/TrialStoreProvider";
import {
  getSessionTrainerPresetOptions,
  SESSION_TRAINER_CUSTOM,
} from "@/lib/sessionTrainerPresets";

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
  /** マスタ外の種目・補足（自由記述） */
  supplementalExerciseText?: string;
};

const SESSION_RECORDS_KEY = "twincoach:trainerSessionRecords:v1";
/** スマホ：会員プルダウン「その他 / 手入力」 */
const MANUAL_MEMBER_ID = "__manual_member__";

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
  /** ピラティス・自重などで重量0を許可 */
  allowsZeroWeight?: boolean;
  workoutKind?: "tr" | "pl";
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

function applyMasterToDraftPatch(master: ExerciseMaster): Pick<
  ExerciseDraft,
  "exerciseBase" | "customExercise" | "weight" | "reps" | "allowsZeroWeight" | "workoutKind"
> {
  const base = exerciseNameToDraftBase(master.name);
  const def = getSessionPickDefaults(master);
  return {
    exerciseBase: base.exerciseBase,
    customExercise: base.customExercise,
    weight: def.defaultWeightKg,
    reps: def.defaultReps,
    allowsZeroWeight: def.allowsZeroWeight,
    workoutKind: def.workoutKind,
  };
}

function draftWeightIsValid(d: ExerciseDraft): boolean {
  if (d.weight > 0) return true;
  if (d.weight === 0 && d.allowsZeroWeight) return true;
  return false;
}

function createDraftFromMaster(master: ExerciseMaster, preferredIssues: string[]): ExerciseDraft {
  const patch = applyMasterToDraftPatch(master);
  return {
    localId: makeId(),
    exerciseBase: patch.exerciseBase,
    customExercise: patch.customExercise,
    weight: patch.weight,
    reps: patch.reps,
    sets: 1,
    rest: 90,
    formRating: "good",
    formIssues: [...preferredIssues],
    note: "",
    allowsZeroWeight: patch.allowsZeroWeight,
    workoutKind: patch.workoutKind,
  };
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
    const master = findMasterByName(prefill.exercise);
    const def = master ? getSessionPickDefaults(master) : null;
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
      ...(def
        ? { allowsZeroWeight: def.allowsZeroWeight, workoutKind: def.workoutKind }
        : {}),
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
    const master = findMasterByName(r.exercise);
    const def = master ? getSessionPickDefaults(master) : null;
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
      ...(def
        ? { allowsZeroWeight: def.allowsZeroWeight, workoutKind: def.workoutKind }
        : {}),
    };
  });
}

type SessionInputProps = {
  initialMembers: Member[];
};

export default function SessionInputClient({ initialMembers }: SessionInputProps) {
  const { selectedStore } = useTrialStore();
  const presetOptions = useMemo(
    () => getSessionTrainerPresetOptions(selectedStore.id),
    [selectedStore.id]
  );

  const [members, setMembers] = useState<Member[]>([]);
  const [trainerSelectValue, setTrainerSelectValue] = useState<string>(() =>
    getSessionTrainerPresetOptions(selectedStore.id)[0] ?? ""
  );
  const [trainerCustomInput, setTrainerCustomInput] = useState("");
  const resolvedTrainerName = useMemo(() => {
    if (trainerSelectValue === SESSION_TRAINER_CUSTOM) return trainerCustomInput.trim();
    return (trainerSelectValue || "").trim();
  }, [trainerSelectValue, trainerCustomInput]);

  const [assignedMembers, setAssignedMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [manualMemberName, setManualMemberName] = useState("");

  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [draft1, setDraft1] = useState<ExerciseDraft | null>(null);
  const [draft2, setDraft2] = useState<ExerciseDraft | null>(null);
  const [supplementalExerciseText, setSupplementalExerciseText] = useState("");
  const [conversationNotes, setConversationNotes] = useState("");
  const [status, setStatus] = useState<string>("");
  const [memoOpen, setMemoOpen] = useState<Record<string, boolean>>({});

  /** 店舗・会員IDの変更時のみ入力をリセット（手入力名のキー入力ではリセットしない） */
  const memberSessionKey = useMemo(
    () => `${selectedStore.id}|${selectedMemberId}`,
    [selectedStore.id, selectedMemberId]
  );

  const selectedMember = useMemo((): Member | null => {
    if (!selectedMemberId) return null;
    if (selectedMemberId === MANUAL_MEMBER_ID) {
      const n = manualMemberName.trim();
      if (!n) return null;
      return {
        id: MANUAL_MEMBER_ID,
        name: n,
        plan: "",
        storeName: getTrialStoreNameForData(selectedStore.id),
        joinDate: "",
        lastVisitDate: "",
        visitInterval: "",
      };
    }
    return assignedMembers.find((m) => m.id === selectedMemberId) ?? null;
  }, [assignedMembers, selectedMemberId, manualMemberName, selectedStore.id]);

  const lastSessionForSelectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    if (selectedMemberId === MANUAL_MEMBER_ID) {
      const n = manualMemberName.trim();
      if (!n) return null;
      const list = savedSessions
        .filter(
          (s) =>
            s.memberId === MANUAL_MEMBER_ID &&
            s.memberName === n &&
            (!s.trainerName || s.trainerName === resolvedTrainerName)
        )
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list[0] ?? null;
    }
    const list = savedSessions
      .filter(
        (s) =>
          s.memberId === selectedMemberId &&
          (!s.trainerName || s.trainerName === resolvedTrainerName)
      )
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list[0] ?? null;
  }, [savedSessions, selectedMemberId, manualMemberName, resolvedTrainerName]);

  const recentSessionsForMember = useMemo(() => {
    if (!selectedMemberId) return [];
    if (selectedMemberId === MANUAL_MEMBER_ID) {
      const n = manualMemberName.trim();
      if (!n) return [];
      return savedSessions
        .filter(
          (s) =>
            s.memberId === MANUAL_MEMBER_ID &&
            s.memberName === n &&
            (!s.trainerName || s.trainerName === resolvedTrainerName)
        )
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
    }
    return savedSessions
      .filter(
        (s) =>
          s.memberId === selectedMemberId &&
          (!s.trainerName || s.trainerName === resolvedTrainerName)
      )
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [savedSessions, selectedMemberId, manualMemberName, resolvedTrainerName]);

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
    const opts = getSessionTrainerPresetOptions(selectedStore.id);
    setTrainerSelectValue(opts[0] ?? "");
    setTrainerCustomInput("");
  }, [selectedStore.id]);

  useEffect(() => {
    const storeName = getTrialStoreNameForData(selectedStore.id);
    setMembers(initialMembers.filter((m) => m.storeName === storeName));
  }, [initialMembers, selectedStore.id]);

  useEffect(() => {
    setAssignedMembers(members.filter((m) => m.assignedTrainer === resolvedTrainerName));
  }, [members, resolvedTrainerName]);

  useEffect(() => {
    setSelectedMemberId((prev) => {
      if (prev === MANUAL_MEMBER_ID) return prev;
      if (assignedMembers.some((m) => m.id === prev)) return prev;
      return assignedMembers[0]?.id ?? "";
    });
  }, [assignedMembers]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
    const raw = window.localStorage.getItem(SESSION_RECORDS_KEY);
    const parsed = safeParse<SavedSession[]>(raw);
    setSavedSessions(Array.isArray(parsed) ? parsed : []);
  }, []);

  useEffect(() => {
    setDraft1(null);
    setDraft2(null);
    setSupplementalExerciseText("");
    setConversationNotes("");
    setMemoOpen({});
  }, [memberSessionKey]);

  const setDraftAt = (localId: string, patch: Partial<ExerciseDraft>) => {
    setDraft1((d) => (d && d.localId === localId ? { ...d, ...patch } : d));
    setDraft2((d) => (d && d.localId === localId ? { ...d, ...patch } : d));
  };

  const handleMobilePickFirst = (master: ExerciseMaster) => {
    setDraft1(createDraftFromMaster(master, frequentFormIssues));
    setStatus(`「${master.name}」を設定しました`);
  };

  const handleMobilePickSecond = (master: ExerciseMaster) => {
    setDraft2(createDraftFromMaster(master, frequentFormIssues));
    setStatus(`「${master.name}」を2つ目に設定しました`);
  };

  /** PC: append=false で1つ目、true で2つ目 */
  const handleDesktopExercisePick = (master: ExerciseMaster, append: boolean) => {
    const d = createDraftFromMaster(master, frequentFormIssues);
    if (append) {
      setDraft2(d);
      setStatus(`「${master.name}」を2つ目に設定しました`);
    } else {
      setDraft1(d);
      setStatus(`「${master.name}」を設定しました`);
    }
  };

  const handleCopyLast = () => {
    const copied = copyLastSessionRecords(lastSessionForSelectedMember, frequentFormIssues);
    if (copied.length === 0 && !(lastSessionForSelectedMember?.supplementalExerciseText?.trim())) {
      setStatus("前回コピーできる記録がありません");
      return;
    }
    setDraft1(copied[0] ?? null);
    setDraft2(copied[1] ?? null);
    setSupplementalExerciseText(lastSessionForSelectedMember?.supplementalExerciseText ?? "");
    setMemoOpen({});
    setConversationNotes(lastSessionForSelectedMember?.conversationNotes ?? "");
    setStatus("前回をコピーしました");
  };

  const validateDraft = (d: ExerciseDraft): string | null => {
    const exercise = getExerciseName(d);
    if (!exercise || exercise === "その他") return "種目を入力してください";
    if (!draftWeightIsValid(d)) return "重量（kg）を入力してください";
    if (d.reps <= 0) return "回数を入力してください";
    if (d.sets <= 0) return "セット数を入力してください";
    if (!d.rest) return "休憩時間を選択してください";
    return null;
  };

  const persistSession = (
    draftsToSave: ExerciseDraft[],
    opts?: { conversationNotes?: string; supplementalExerciseText?: string }
  ) => {
    setStatus("");
    if (!resolvedTrainerName) {
      setStatus("トレーナーを選択するか、「その他（手入力）」で名前を入力してください");
      return;
    }
    if (!selectedMember) {
      setStatus("会員を選択してください");
      return;
    }
    const notesForSave =
      opts?.conversationNotes !== undefined ? opts.conversationNotes : conversationNotes;
    const supplementalForSave =
      opts?.supplementalExerciseText !== undefined
        ? opts.supplementalExerciseText
        : supplementalExerciseText;
    const supplementalTrim = supplementalForSave.trim();

    if (draftsToSave.length === 0 && !supplementalTrim) {
      setStatus("種目を選ぶか、その他種目（手入力）を入力してください");
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
    let menuSummary = buildSessionMenuSummary(records);
    let conversationSummary = buildConversationSummary(records);
    if (supplementalTrim) {
      menuSummary = menuSummary
        ? `${menuSummary}\n【その他種目・補足】\n${supplementalTrim}`
        : `【その他種目・補足】\n${supplementalTrim}`;
      const oneLine = supplementalTrim.replace(/\s+/g, " ");
      conversationSummary = conversationSummary
        ? `${conversationSummary} / 補足種目:${oneLine}`
        : `補足種目:${oneLine}`;
    }

    const saved: SavedSession = {
      sessionId,
      trainerName: resolvedTrainerName,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      storeName: selectedMember.storeName,
      sessionDate,
      createdAt,
      records,
      ...(notesTrimmed ? { conversationNotes: notesTrimmed } : {}),
      ...(supplementalTrim ? { supplementalExerciseText: supplementalTrim } : {}),
    };

    if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
    const nextSavedSessions = [saved, ...savedSessions].slice(0, 300);
    window.localStorage.setItem(
      SESSION_RECORDS_KEY,
      JSON.stringify(nextSavedSessions)
    );
    setSavedSessions(nextSavedSessions);

    const mergedNotes = [notesTrimmed, supplementalTrim ? `補足種目: ${supplementalTrim}` : ""]
      .filter(Boolean)
      .join("\n");

    const nextSuggestion = generateNextActionsAfterSessionInput(selectedMember, records, {
      sessionId,
      sessionDate,
      trainerName: resolvedTrainerName,
      conversationNotes: mergedNotes || undefined,
    });
    persistNextActionSuggestion(selectedMember.id, nextSuggestion);
    const primaryNextAction =
      nextSuggestion.actions[0]?.title ?? "次回予約をその場で確定";

    setStatus("保存しました · 次回提案を更新しました");

    // 既存のセッション履歴（MemberSessionsClient）へも反映
    try {
      const imported = loadImportedSessions();
      const session: Session = sessionWithConversationTags({
        id: sessionId,
        memberName: selectedMember.name,
        sessionDate,
        menuSummary,
        conversationSummary,
        conversationNotes: notesTrimmed || undefined,
        nextAction: primaryNextAction,
        trainerName: resolvedTrainerName,
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

  const handleSave = () =>
    persistSession([draft1, draft2].filter((x): x is ExerciseDraft => x != null));

  const handleSaveSameAsLast = () => {
    const copied = copyLastSessionRecords(lastSessionForSelectedMember, frequentFormIssues);
    if (!selectedMember) {
      setStatus("会員を選択してください");
      return;
    }
    const lastSup = lastSessionForSelectedMember?.supplementalExerciseText ?? "";
    if (copied.length === 0 && !lastSup.trim()) {
      setStatus("前回の保存データがありません");
      return;
    }
    const lastNotes = lastSessionForSelectedMember?.conversationNotes ?? "";
    setConversationNotes(lastNotes);
    setSupplementalExerciseText(lastSup);
    setDraft1(copied[0] ?? null);
    setDraft2(copied[1] ?? null);
    setMemoOpen({});
    persistSession(copied, {
      conversationNotes: lastNotes,
      supplementalExerciseText: lastSup,
    });
  };

  const trainerFields = (
    <>
      <div className="text-slate-500 text-xs mb-1">トレーナー</div>
      <select
        value={trainerSelectValue === SESSION_TRAINER_CUSTOM ? SESSION_TRAINER_CUSTOM : trainerSelectValue}
        onChange={(e) => {
          const v = e.target.value;
          setTrainerSelectValue(v);
          if (v !== SESSION_TRAINER_CUSTOM) setTrainerCustomInput("");
        }}
        className="w-full min-w-0 rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-900"
      >
        {presetOptions.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
        <option value={SESSION_TRAINER_CUSTOM}>その他（手入力）</option>
      </select>
      {trainerSelectValue === SESSION_TRAINER_CUSTOM ? (
        <div className="mt-2">
          <label className="block">
            <span className="text-slate-500 text-xs mb-1 block">ヘルプトレーナーを入力</span>
            <input
              type="text"
              value={trainerCustomInput}
              onChange={(e) => setTrainerCustomInput(e.target.value)}
              placeholder="氏名（他店舗ヘルプ・ゲストなど）"
              autoComplete="name"
              className="w-full min-w-0 rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
            />
          </label>
        </div>
      ) : null}
    </>
  );

  const saveBarInner = (
    <>
      {lastSessionForSelectedMember &&
      (lastSessionForSelectedMember.records.length > 0 ||
        (lastSessionForSelectedMember.supplementalExerciseText?.trim() ?? "")) ? (
        <button
          type="button"
          onClick={handleSaveSameAsLast}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-4 text-sm font-bold text-slate-800 mb-3"
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
    </>
  );

  const memberSelect = (
    <>
      <div className="text-slate-500 text-xs mb-1">会員</div>
      <select
        value={selectedMemberId}
        onChange={(e) => {
          const v = e.target.value;
          setSelectedMemberId(v);
          if (v !== MANUAL_MEMBER_ID) setManualMemberName("");
        }}
        className="w-full min-w-0 rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-900"
      >
        {assignedMembers.length === 0 ? (
          <option value="" disabled>
            担当会員がいません
          </option>
        ) : (
          assignedMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))
        )}
        <option value={MANUAL_MEMBER_ID}>その他 / 手入力</option>
      </select>
      {selectedMemberId === MANUAL_MEMBER_ID ? (
        <div className="mt-2">
          <label className="block">
            <span className="text-slate-500 text-xs mb-1 block">会員名（手入力）</span>
            <input
              type="text"
              value={manualMemberName}
              onChange={(e) => setManualMemberName(e.target.value)}
              placeholder="氏名を入力"
              autoComplete="name"
              className="w-full min-w-0 rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
            />
          </label>
        </div>
      ) : null}
    </>
  );

  const exerciseDraftCard = (d: ExerciseDraft, slot: "first" | "second") => (
    <div
      key={d.localId}
      className={`bg-white border rounded-2xl p-4 ${
        d.weight > 0 || d.reps > 0 ? "border-emerald-500/40" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-slate-500 text-xs mb-0.5">{slot === "first" ? "選択した種目" : "続きの種目"}</div>
          <div className="text-slate-900 font-semibold text-base leading-snug break-words">
            {getExerciseName(d)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (slot === "first") {
              setDraft1(null);
              setDraft2(null);
            } else {
              setDraft2(null);
            }
          }}
          className="shrink-0 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          選び直す
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-slate-500 text-xs mb-1">種目</div>
          <div className="lg:hidden rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3">
            <p className="text-base font-semibold text-slate-900">{getExerciseName(d)}</p>
            <p className="text-[11px] text-slate-500 mt-1">上の選択フローから変更できます（スマホ）</p>
          </div>
          <div className="hidden lg:block">
            <select
              value={d.exerciseBase}
              onChange={(e) => {
                const base = e.target.value as ExerciseBase;
                const resolvedName = base === "その他" ? d.customExercise.trim() : base;
                const m = resolvedName ? findMasterByName(resolvedName) : undefined;
                const patch = m ? applyMasterToDraftPatch(m) : null;
                setDraftAt(d.localId, {
                  exerciseBase: base,
                  customExercise: base === "その他" ? d.customExercise : "",
                  ...(patch
                    ? {
                        weight: patch.weight,
                        reps: patch.reps,
                        allowsZeroWeight: patch.allowsZeroWeight,
                        workoutKind: patch.workoutKind,
                      }
                    : base === "その他"
                      ? { allowsZeroWeight: undefined, workoutKind: undefined }
                      : {}),
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
                onChange={(e) => {
                  const v = e.target.value;
                  const m = findMasterByName(v.trim());
                  if (m) {
                    setDraftAt(d.localId, {
                      ...applyMasterToDraftPatch(m),
                      customExercise: v,
                    });
                  } else {
                    setDraftAt(d.localId, {
                      customExercise: v,
                      allowsZeroWeight: undefined,
                      workoutKind: undefined,
                    });
                  }
                }}
                placeholder="例）ベンチプレス（フォーム改善）"
                className="mt-2 w-full min-w-0 rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-900 placeholder:text-slate-600"
              />
            )}
          </div>
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
                d.sets > 0 && (d.weight > 0 || d.reps > 0) ? "border-emerald-500/50" : "border-slate-200"
              }`}
            />
          </div>
          <div className="col-span-2">
            <div className="text-slate-500 text-xs mb-1">休憩時間</div>
            <select
              value={d.rest}
              onChange={(e) => setDraftAt(d.localId, { rest: normalizeNumber(e.target.value, 90) })}
              className={`w-full min-w-0 rounded-lg bg-slate-50 border px-3 py-3 text-base text-slate-900 ${
                d.weight > 0 || d.reps > 0 ? "border-emerald-500/50" : "border-slate-200"
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
            {d.note.trim() ? <span className="text-[11px] text-emerald-800">入力あり</span> : null}
          </div>

          {memoOpen[d.localId] ? (
            <div>
              <input
                value={d.note}
                onChange={(e) => setDraftAt(d.localId, { note: e.target.value })}
                placeholder="例）次回はフォーム意識"
                className={`w-full min-w-0 rounded-lg bg-slate-50 border px-3 py-3 text-base text-slate-900 placeholder:text-slate-600 ${
                  d.note.trim() ? "border-emerald-500/40" : "border-slate-200"
                }`}
              />
              <div className="mt-2 text-[11px] text-slate-500">将来：音声入力に対応する前提の構造です。</div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-600">タップでメモ入力</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden py-4 sm:py-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-6 sm:pr-6">
      <div className="w-full max-w-3xl mx-auto min-w-0">
        <header className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-balance">セッション入力</h1>
          <p className="text-slate-600 text-base mt-1">タップで完了。種目は選択フローから選べます。</p>
        </header>

        <div className="mb-4 bg-white border border-slate-200 shadow-sm rounded-xl p-4">
          {/* スマホ（lg 未満）: 会員 → トレーナー → 前回コピー */}
          <div className="flex flex-col gap-4 lg:hidden">
            <div className="min-w-0">{memberSelect}</div>
            <div className="min-w-0">{trainerFields}</div>
            <button
              type="button"
              onClick={handleCopyLast}
              className="h-12 w-full shrink-0 rounded-lg border border-slate-200 bg-slate-100/80 text-slate-800 text-base font-semibold hover:bg-slate-100 transition-colors"
            >
              前回コピー
            </button>
          </div>
          {/* PC（lg 以上）: 会員 | 前回コピー（従来） */}
          <div className="hidden lg:flex flex-row gap-3 items-end">
            <div className="min-w-0 flex-1">{memberSelect}</div>
            <div className="shrink-0 self-end">
              <button
                type="button"
                onClick={handleCopyLast}
                className="h-12 px-4 rounded-lg border border-slate-200 bg-slate-100/80 text-slate-800 text-base font-semibold hover:bg-slate-100 transition-colors"
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
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
            <MobileExercisePicker heading="種目を選ぶ" onPick={handleMobilePickFirst} />
          </div>
          <div className="mb-4 hidden lg:block rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <ExerciseSearchField onPick={handleDesktopExercisePick} />
          </div>
        </div>

        <div className="space-y-3 pb-8">
          {draft1 ? exerciseDraftCard(draft1, "first") : null}

          {draft1 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
              <MobileExercisePicker heading="続きの種目を選ぶ" onPick={handleMobilePickSecond} />
            </div>
          ) : null}

          {draft2 ? exerciseDraftCard(draft2, "second") : null}

          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <label className="block">
              <span className="text-slate-500 text-xs mb-1 block">その他種目（手入力）・補足種目メモ</span>
              <textarea
                value={supplementalExerciseText}
                onChange={(e) => setSupplementalExerciseText(e.target.value)}
                placeholder="マスタにない種目・補助メモ・特別対応など"
                rows={4}
                className="w-full min-h-[100px] rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-base text-slate-900 placeholder:text-slate-600 resize-y"
              />
            </label>
          </div>

          <div className="hidden lg:block rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {trainerFields}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
            <div className="text-slate-500 text-xs font-medium mb-3">保存</div>
            {saveBarInner}
          </div>
        </div>
      </div>
    </div>
  );
}

