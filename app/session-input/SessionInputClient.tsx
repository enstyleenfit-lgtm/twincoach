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
  sessionDate: string;
  createdAt: string;
  records: SessionRecord[];
  conversationNotes?: string;
  supplementalExerciseText?: string;
};

const SESSION_RECORDS_KEY = "twincoach:trainerSessionRecords:v1";
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

// suppress unused warning — kept for API compatibility with prefill consumers
void buildDraftFromPrefill;

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

type DemoHistoryItem = {
  date: string;
  bodyPart: "上半身" | "下半身" | "姿勢改善" | "コンディショニング";
  category: "トレーニング" | "ピラティス";
  exerciseName: string;
  weight: number;
  reps: number;
  sets: number;
  note?: string;
};

const HISTORY_FILTERS = ["全履歴", "上半身", "下半身", "姿勢改善", "コンディショニング"] as const;

const DEMO_HISTORY: DemoHistoryItem[] = [
  { date: "5/12", bodyPart: "上半身", category: "トレーニング", exerciseName: "ベンチプレス", weight: 60, reps: 10, sets: 3, note: "肩甲骨を引いて肩が前に出ないよう意識" },
  { date: "5/12", bodyPart: "上半身", category: "トレーニング", exerciseName: "ラットプルダウン", weight: 45, reps: 12, sets: 3 },
  { date: "5/8",  bodyPart: "上半身", category: "トレーニング", exerciseName: "ショルダープレス", weight: 20, reps: 10, sets: 3, note: "可動域を最大限使う" },
  { date: "5/8",  bodyPart: "上半身", category: "トレーニング", exerciseName: "ダンベルフライ",  weight: 14, reps: 12, sets: 3 },
  { date: "5/10", bodyPart: "下半身", category: "トレーニング", exerciseName: "スクワット",     weight: 80, reps: 8,  sets: 4, note: "膝がつま先より前に出ないよう注意" },
  { date: "5/10", bodyPart: "下半身", category: "トレーニング", exerciseName: "ヒップスラスト", weight: 60, reps: 12, sets: 3 },
  { date: "5/6",  bodyPart: "下半身", category: "トレーニング", exerciseName: "レッグプレス",   weight: 120, reps: 10, sets: 3 },
  { date: "5/6",  bodyPart: "下半身", category: "トレーニング", exerciseName: "デッドリフト",   weight: 70, reps: 8,  sets: 3, note: "股関節を引くイメージで" },
  { date: "5/14", bodyPart: "姿勢改善", category: "トレーニング", exerciseName: "プランク",     weight: 0, reps: 60, sets: 3, note: "体幹キープ60秒" },
  { date: "5/14", bodyPart: "姿勢改善", category: "ピラティス",   exerciseName: "デッドバグ",   weight: 0, reps: 10, sets: 3 },
  { date: "5/11", bodyPart: "姿勢改善", category: "トレーニング", exerciseName: "フェイスプル", weight: 20, reps: 15, sets: 3, note: "外旋を意識してゆっくり引く" },
  { date: "5/15", bodyPart: "コンディショニング", category: "ピラティス", exerciseName: "ハンドレッド",         weight: 0, reps: 100, sets: 1 },
  { date: "5/15", bodyPart: "コンディショニング", category: "ピラティス", exerciseName: "ロールアップ",         weight: 0, reps: 8,   sets: 3, note: "腰椎から丁寧にひとつずつ" },
  { date: "5/9",  bodyPart: "コンディショニング", category: "ピラティス", exerciseName: "シングルレッグストレッチ", weight: 0, reps: 10, sets: 3 },
];

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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<(typeof HISTORY_FILTERS)[number]>("全履歴");
  const [pickerOpen, setPickerOpen] = useState(false);

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
    setPickerOpen(false);
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

  const handleMobilePick = (master: ExerciseMaster) => {
    if (!draft1) {
      handleMobilePickFirst(master);
    } else if (!draft2) {
      handleMobilePickSecond(master);
    }
    setPickerOpen(false);
  };

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

  const filteredHistory = useMemo(() => {
    if (historyFilter === "全履歴") return DEMO_HISTORY;
    return DEMO_HISTORY.filter((item) => item.bodyPart === historyFilter);
  }, [historyFilter]);

  const handleAddFromHistory = (item: DemoHistoryItem) => {
    const master = findMasterByName(item.exerciseName);
    const base = master
      ? createDraftFromMaster(master, frequentFormIssues)
      : defaultDraft(item.exerciseName);
    const draft: ExerciseDraft = {
      ...base,
      weight: item.weight,
      reps: item.reps,
      sets: item.sets,
      note: item.note ?? "",
    };
    if (!draft1) {
      setDraft1(draft);
    } else if (!draft2) {
      setDraft2(draft);
    } else {
      setStatus("種目は2つまで追加できます");
      return;
    }
    setHistoryOpen(false);
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
      setStatus("種目を選ぶか、補足メモを入力してください");
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
    window.localStorage.setItem(SESSION_RECORDS_KEY, JSON.stringify(nextSavedSessions));
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
    persistSession(copied, { conversationNotes: lastNotes, supplementalExerciseText: lastSup });
  };

  const exerciseDraftCard = (d: ExerciseDraft, slot: "first" | "second") => {
    const exerciseName = getExerciseName(d);
    const master = findMasterByName(exerciseName);
    const bodyPartLabel = master?.bodyPart || "";
    const isPilates = d.workoutKind === "pl";

    return (
      <div key={d.localId} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 border-b border-slate-50">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-base leading-snug">{exerciseName}</span>
              {bodyPartLabel && (
                <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {bodyPartLabel}
                </span>
              )}
              {isPilates && !bodyPartLabel && (
                <span className="inline-flex items-center rounded-full bg-purple-50 border border-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                  ピラティス
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{slot === "first" ? "1種目" : "2種目"}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (slot === "first") { setDraft1(null); setDraft2(null); }
              else { setDraft2(null); }
            }}
            className="shrink-0 text-slate-400 hover:text-red-500 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 transition-colors"
          >
            削除
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Metrics: weight + reps */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5">重量（kg）</div>
              <input
                type="number"
                inputMode="decimal"
                value={d.weight}
                onChange={(e) => setDraftAt(d.localId, { weight: normalizeNumber(e.target.value, 0) })}
                className={`w-full rounded-xl border px-3 py-3 text-base font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-300 transition-colors ${
                  d.weight > 0 ? "border-emerald-300/70 bg-emerald-50/30" : "border-slate-200"
                }`}
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5">回数</div>
              <input
                type="number"
                inputMode="numeric"
                value={d.reps}
                onChange={(e) => setDraftAt(d.localId, { reps: normalizeNumber(e.target.value, 0) })}
                className={`w-full rounded-xl border px-3 py-3 text-base font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-300 transition-colors ${
                  d.reps > 0 ? "border-emerald-300/70 bg-emerald-50/30" : "border-slate-200"
                }`}
              />
            </div>
          </div>

          {/* Metrics: sets + rest */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5">セット数</div>
              <input
                type="number"
                inputMode="numeric"
                value={d.sets}
                onChange={(e) => setDraftAt(d.localId, { sets: normalizeNumber(e.target.value, 1) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-base font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-colors"
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5">休憩時間</div>
              <select
                value={d.rest}
                onChange={(e) => setDraftAt(d.localId, { rest: normalizeNumber(e.target.value, 90) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-base font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-colors"
              >
                {REST_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}秒</option>
                ))}
              </select>
            </div>
          </div>

          {/* PC: exercise change dropdown */}
          <div className="hidden lg:block">
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5">種目（変更）</div>
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
                    ? { weight: patch.weight, reps: patch.reps, allowsZeroWeight: patch.allowsZeroWeight, workoutKind: patch.workoutKind }
                    : base === "その他"
                      ? { allowsZeroWeight: undefined, workoutKind: undefined }
                      : {}),
                });
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
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
                    setDraftAt(d.localId, { ...applyMasterToDraftPatch(m), customExercise: v });
                  } else {
                    setDraftAt(d.localId, { customExercise: v, allowsZeroWeight: undefined, workoutKind: undefined });
                  }
                }}
                placeholder="例）ベンチプレス（フォーム改善）"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            )}
          </div>

          {/* Form rating */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5">動作評価</div>
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
                  className={`rounded-xl border py-3 text-sm font-semibold transition-colors ${
                    d.formRating === opt.key
                      ? "border-emerald-400/50 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form issues */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5">フォームの癖</div>
            <div className="grid grid-cols-2 gap-2">
              {FORM_ISSUES.map((issue) => {
                const checked = d.formIssues.includes(issue);
                return (
                  <button
                    key={issue}
                    type="button"
                    onClick={() =>
                      setDraftAt(d.localId, {
                        formIssues: checked
                          ? d.formIssues.filter((x) => x !== issue)
                          : [...d.formIssues, issue],
                      })
                    }
                    className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors ${
                      checked
                        ? "border-red-300/60 bg-red-50 text-red-700"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {issue}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Memo */}
          <div>
            <button
              type="button"
              onClick={() => setMemoOpen((prev) => ({ ...prev, [d.localId]: !prev[d.localId] }))}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <span>メモ（任意）</span>
              <span className="text-slate-300">{memoOpen[d.localId] ? "▲" : "▼"}</span>
              {d.note.trim() && <span className="text-emerald-600 font-semibold">· 入力あり</span>}
            </button>
            {memoOpen[d.localId] && (
              <input
                value={d.note}
                onChange={(e) => setDraftAt(d.localId, { note: e.target.value })}
                placeholder="例）次回はフォーム意識"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const hasLastSession =
    !!lastSessionForSelectedMember &&
    (lastSessionForSelectedMember.records.length > 0 ||
      !!(lastSessionForSelectedMember.supplementalExerciseText?.trim()));

  const saveButtons = (
    <>
      {hasLastSession && (
        <button
          type="button"
          onClick={handleSaveSameAsLast}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-3.5 text-sm font-bold text-slate-800 mb-3 transition-colors"
        >
          前回と同じで保存
        </button>
      )}
      <button
        type="button"
        onClick={handleSave}
        className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-4 text-sm font-bold transition-colors shadow-sm"
      >
        保存
      </button>
    </>
  );

  const canAddMore = !draft1 || !draft2;

  // 補足メモセクション（左カラムPC表示用・右カラムモバイル表示用で共用）
  const supplementalSection = (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-slate-50">
        <h2 className="text-sm font-semibold text-slate-800">補足メモ</h2>
        <p className="text-xs text-slate-400 mt-0.5">マスタにない種目・補助メモ・特別対応など</p>
      </div>
      <div className="p-4">
        <textarea
          value={supplementalExerciseText}
          onChange={(e) => setSupplementalExerciseText(e.target.value)}
          placeholder="マスタにない種目・補助メモ・特別対応など"
          rows={3}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        />
      </div>
    </section>
  );

  return (
    <div className="w-full min-w-0 max-w-full bg-slate-50 min-h-full">
      {/* ページタイトル */}
      <div className="px-4 pt-5 pb-3 sm:px-6 lg:px-8 lg:pt-8">
        <h1 className="text-xl font-bold text-slate-900">セッション入力</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          今日の記録を入力 · {todayYmd().replace(/-/g, "/")}
        </p>
      </div>

      {/* メインコンテンツ: モバイル1カラム / PC 2カラムグリッド */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-48 lg:pb-40">
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">

          {/* ── 左カラム: 会員・トレーナー・会話内容・補足メモ ── */}
          <div className="space-y-3">

            {/* 会員 */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-slate-50">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">会員</h2>
              </div>
              <div className="p-4">
                <select
                  value={selectedMemberId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedMemberId(v);
                    if (v !== MANUAL_MEMBER_ID) setManualMemberName("");
                  }}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                >
                  {assignedMembers.length === 0 ? (
                    <option value="" disabled>担当会員がいません</option>
                  ) : (
                    assignedMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))
                  )}
                  <option value={MANUAL_MEMBER_ID}>その他 / 手入力</option>
                </select>

                {selectedMemberId === MANUAL_MEMBER_ID && (
                  <input
                    type="text"
                    value={manualMemberName}
                    onChange={(e) => setManualMemberName(e.target.value)}
                    placeholder="氏名を入力"
                    autoComplete="name"
                    className="mt-2 w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                  />
                )}

                {selectedMember && (
                  <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-50">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-white text-lg font-bold select-none">
                        {selectedMember.name.slice(0, 1)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-base">{selectedMember.name}</span>
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          在籍中
                        </span>
                      </div>
                      {selectedMember.plan && (
                        <div className="text-xs text-slate-500 mt-0.5">{selectedMember.plan}</div>
                      )}
                      {lastSessionForSelectedMember && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          前回: {lastSessionForSelectedMember.sessionDate}
                          {lastSessionForSelectedMember.records[0]?.exercise
                            ? ` · ${lastSessionForSelectedMember.records[0].exercise}`
                            : ""}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 担当トレーナー */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-slate-50">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">担当トレーナー</h2>
              </div>
              <div className="p-4">
                <select
                  value={trainerSelectValue === SESSION_TRAINER_CUSTOM ? SESSION_TRAINER_CUSTOM : trainerSelectValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTrainerSelectValue(v);
                    if (v !== SESSION_TRAINER_CUSTOM) setTrainerCustomInput("");
                  }}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                >
                  {presetOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value={SESSION_TRAINER_CUSTOM}>その他（手入力）</option>
                </select>
                {trainerSelectValue === SESSION_TRAINER_CUSTOM && (
                  <input
                    type="text"
                    value={trainerCustomInput}
                    onChange={(e) => setTrainerCustomInput(e.target.value)}
                    placeholder="氏名（他店舗ヘルプ・ゲストなど）"
                    autoComplete="name"
                    className="mt-2 w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                  />
                )}
              </div>
            </section>

            {/* 会話内容 */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-slate-50">
                <h2 className="text-sm font-semibold text-slate-800">会話内容</h2>
                <p className="text-xs text-slate-400 mt-0.5">雑談・仕事・生活の変化・悩み・次回の話題など</p>
              </div>
              <div className="p-4">
                <textarea
                  value={conversationNotes}
                  onChange={(e) => setConversationNotes(e.target.value)}
                  placeholder="会話した内容、最近の変化、気になったことを記録"
                  rows={5}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                />
              </div>
            </section>

            {/* 補足メモ: PCのみ左カラム下部に表示 */}
            <div className="hidden lg:block">{supplementalSection}</div>
          </div>

          {/* ── 右カラム: トレーニングメニュー ── */}
          <div className="space-y-3 mt-3 lg:mt-0">

            {/* トレーニングメニュー */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-50">
                <h2 className="text-sm font-semibold text-slate-800">トレーニングメニュー</h2>
                <button
                  type="button"
                  onClick={() => setHistoryOpen((v) => !v)}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  {historyOpen ? "閉じる" : "履歴から作成"}
                </button>
              </div>

              {/* 履歴パネル */}
              {historyOpen && (
                <div className="border-b border-slate-100">
                  <div className="flex gap-2 flex-wrap px-4 py-3 border-b border-slate-50">
                    {HISTORY_FILTERS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setHistoryFilter(f)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          historyFilter === f
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                    {filteredHistory.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-6">該当する履歴がありません</p>
                    ) : (
                      filteredHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs text-slate-400">{item.date}</span>
                              <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {item.bodyPart}
                              </span>
                              {item.category === "ピラティス" && (
                                <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-600">
                                  ピラティス
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{item.exerciseName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {item.weight > 0 ? `${item.weight}kg × ` : ""}
                              {item.reps}回 × {item.sets}セット
                            </p>
                            {item.note && (
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.note}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddFromHistory(item)}
                            className="shrink-0 self-start sm:self-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
                          >
                            追加
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 種目カード */}
              {(draft1 || draft2) && (
                <div className="p-4 space-y-3">
                  {draft1 && exerciseDraftCard(draft1, "first")}
                  {draft2 && exerciseDraftCard(draft2, "second")}
                </div>
              )}

              {/* スマホ: 種目を追加ボタン・ピッカー */}
              {canAddMore && (
                <div className="lg:hidden px-4 pb-4">
                  {pickerOpen ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <MobileExercisePicker
                        heading={!draft1 ? "種目を選ぶ" : "2つ目の種目を選ぶ"}
                        onPick={handleMobilePick}
                      />
                      <button
                        type="button"
                        onClick={() => setPickerOpen(false)}
                        className="mt-3 w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/40 transition-all"
                    >
                      + 種目を追加
                    </button>
                  )}
                </div>
              )}

              {/* PC: 種目検索フィールド */}
              {canAddMore && (
                <div className="hidden lg:block px-4 pb-4">
                  <ExerciseSearchField onPick={handleDesktopExercisePick} />
                </div>
              )}

              {/* 前回コピー */}
              {lastSessionForSelectedMember && (
                <div className="px-4 pb-4">
                  <button
                    type="button"
                    onClick={handleCopyLast}
                    className="w-full py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    前回コピー
                  </button>
                </div>
              )}
            </section>

            {/* 補足メモ: スマホのみ右カラム下部に表示 */}
            <div className="lg:hidden">{supplementalSection}</div>
          </div>

        </div>
      </div>

      {/* ── スマホ固定保存バー（タブバーの上） ── */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white/96 backdrop-blur-sm border-t border-slate-100 px-4 pt-3 pb-2 shadow-[0_-4px_16px_rgba(15,23,42,0.07)]">
        {status ? (
          <div className="text-xs text-center text-slate-700 mb-2 font-medium">{status}</div>
        ) : (
          <div className="text-center text-[11px] text-slate-400 mb-1.5">ローカル保存</div>
        )}
        {saveButtons}
      </div>

      {/* ── PC固定保存バー（サイドバー右・画面最下部） ── */}
      <div className="hidden lg:flex fixed bottom-0 left-64 right-0 z-30 items-center justify-between gap-4 bg-white/96 backdrop-blur-sm border-t border-slate-200 px-8 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.07)]">
        <div className="min-w-0">
          {status ? (
            <p className="text-sm font-medium text-slate-700 truncate">{status}</p>
          ) : (
            <p className="text-xs text-slate-400">保存はローカルのみ（ローカル完結）</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasLastSession && (
            <button
              type="button"
              onClick={handleSaveSameAsLast}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors whitespace-nowrap"
            >
              前回と同じで保存
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-8 py-2.5 text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
