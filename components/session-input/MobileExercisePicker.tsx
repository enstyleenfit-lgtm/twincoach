"use client";

import { useMemo, useState } from "react";
import {
  EXERCISE_MASTERS,
  PILATES_EQUIPMENT_ORDER,
  TRAINING_BODY_PARTS_UI,
  TRAINING_EQUIPMENT_ORDER,
  matchesTrainingBodyPart,
  type ExerciseMaster,
} from "@/lib/exerciseMaster";

type FlowRoot = null | "TR" | "PL";

type Props = {
  onPick: (master: ExerciseMaster, append: boolean) => void;
};

function trainingEquipmentsForPart(part: string): string[] {
  const set = new Set<string>();
  for (const m of EXERCISE_MASTERS) {
    if (m.category !== "トレーニング") continue;
    if (!matchesTrainingBodyPart(m.bodyPart, part)) continue;
    set.add(m.equipment);
  }
  return TRAINING_EQUIPMENT_ORDER.filter((eq) => set.has(eq));
}

function trainingExercises(part: string, equipment: string): ExerciseMaster[] {
  return EXERCISE_MASTERS.filter(
    (m) =>
      m.category === "トレーニング" &&
      m.equipment === equipment &&
      matchesTrainingBodyPart(m.bodyPart, part)
  ).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

function pilatesExercises(equipment: string): ExerciseMaster[] {
  return EXERCISE_MASTERS.filter(
    (m) => m.category === "ピラティス" && m.equipment === equipment
  ).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

function chipButtonClass(active?: boolean): string {
  return [
    "min-h-[48px] rounded-xl border px-3 py-3 text-sm font-semibold text-center transition-colors",
    active
      ? "border-blue-500/50 bg-blue-500/15 text-blue-900"
      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100 active:scale-[0.99]",
  ].join(" ");
}

export function MobileExercisePicker({ onPick }: Props) {
  const [root, setRoot] = useState<FlowRoot>(null);
  const [trPart, setTrPart] = useState<string | null>(null);
  const [trEq, setTrEq] = useState<string | null>(null);
  const [plEq, setPlEq] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");

  const trEquipments = useMemo(
    () => (trPart ? trainingEquipmentsForPart(trPart) : []),
    [trPart]
  );

  const trList = useMemo(
    () => (trPart && trEq ? trainingExercises(trPart, trEq) : []),
    [trPart, trEq]
  );

  const plList = useMemo(() => (plEq ? pilatesExercises(plEq) : []), [plEq]);

  const resetFlow = () => {
    setRoot(null);
    setTrPart(null);
    setTrEq(null);
    setPlEq(null);
    setCustomOpen(false);
    setCustomName("");
  };

  const breadcrumb = useMemo(() => {
    const parts: string[] = ["種目を選ぶ"];
    if (root === "TR") {
      parts.push("TR");
      if (trPart) parts.push(trPart);
      if (trEq) parts.push(trEq);
    } else if (root === "PL") {
      parts.push("PL");
      if (plEq) parts.push(plEq);
    }
    if (customOpen) parts.push("その他");
    return parts.join(" › ");
  }, [root, trPart, trEq, plEq, customOpen]);

  const pickCustom = (append: boolean) => {
    const name = customName.trim();
    if (!name) return;
    const synthetic: ExerciseMaster = {
      id: `custom_${name}`,
      name,
      category: "トレーニング",
      equipment: "その他",
      bodyPart: "",
      searchKeywords: [],
      sortOrder: 9999,
      defaultWeightKg: 20,
      defaultReps: 10,
      allowsZeroWeight: false,
    };
    onPick(synthetic, append);
    resetFlow();
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-slate-500 text-xs mb-1">種目（選択式）</div>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{breadcrumb}</p>
      </div>

      {customOpen ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-3">
          <div className="text-sm font-semibold text-slate-900">その他（手入力）</div>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="種目名を入力"
            className="w-full min-h-[48px] rounded-lg border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={chipButtonClass()} onClick={() => pickCustom(false)}>
              1種目へ
            </button>
            <button type="button" className={chipButtonClass()} onClick={() => pickCustom(true)}>
              ＋追加
            </button>
          </div>
          <button
            type="button"
            className="w-full min-h-[44px] text-sm text-slate-600 underline"
            onClick={() => {
              setCustomOpen(false);
              setCustomName("");
            }}
          >
            キャンセル
          </button>
        </div>
      ) : root === null ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={chipButtonClass()}
              onClick={() => {
                setRoot("TR");
                setTrPart(null);
                setTrEq(null);
              }}
            >
              TR
              <span className="block text-[11px] font-normal text-slate-500">トレーニング</span>
            </button>
            <button
              type="button"
              className={chipButtonClass()}
              onClick={() => {
                setRoot("PL");
                setPlEq(null);
              }}
            >
              PL
              <span className="block text-[11px] font-normal text-slate-500">ピラティス</span>
            </button>
          </div>
          <button
            type="button"
            className={`w-full ${chipButtonClass()}`}
            onClick={() => {
              setCustomOpen(true);
            }}
          >
            その他（手入力）
          </button>
        </div>
      ) : root === "TR" && !trPart ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {TRAINING_BODY_PARTS_UI.map((p) => (
              <button
                key={p}
                type="button"
                className={chipButtonClass()}
                onClick={() => setTrPart(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button type="button" className="w-full min-h-[44px] text-sm text-slate-600" onClick={resetFlow}>
            ← カテゴリに戻る
          </button>
        </div>
      ) : root === "TR" && trPart && !trEq ? (
        <div className="space-y-3">
          {trEquipments.length === 0 ? (
            <p className="text-sm text-slate-600">この部位の登録種目がありません。「その他」から入力してください。</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {trEquipments.map((eq) => (
                <button key={eq} type="button" className={chipButtonClass()} onClick={() => setTrEq(eq)}>
                  {eq}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="w-full min-h-[44px] text-sm text-slate-600"
            onClick={() => {
              setTrEq(null);
              setTrPart(null);
            }}
          >
            ← 部位に戻る
          </button>
        </div>
      ) : root === "TR" && trPart && trEq ? (
        <div className="space-y-3">
          <div className="max-h-[min(52vh,420px)] overflow-y-auto space-y-2 pr-1">
            {trList.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col gap-2"
              >
                <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={chipButtonClass()}
                    onClick={() => {
                      onPick(m, false);
                      resetFlow();
                    }}
                  >
                    1種目へ
                  </button>
                  <button
                    type="button"
                    className={chipButtonClass()}
                    onClick={() => {
                      onPick(m, true);
                      resetFlow();
                    }}
                  >
                    ＋追加
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="w-full min-h-[44px] text-sm text-slate-600"
            onClick={() => setTrEq(null)}
          >
            ← 器具に戻る
          </button>
        </div>
      ) : root === "PL" && !plEq ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {PILATES_EQUIPMENT_ORDER.map((eq) => (
              <button key={eq} type="button" className={chipButtonClass()} onClick={() => setPlEq(eq)}>
                {eq}
              </button>
            ))}
          </div>
          <button type="button" className="w-full min-h-[44px] text-sm text-slate-600" onClick={resetFlow}>
            ← カテゴリに戻る
          </button>
        </div>
      ) : root === "PL" && plEq ? (
        <div className="space-y-3">
          <div className="max-h-[min(52vh,420px)] overflow-y-auto space-y-2 pr-1">
            {plList.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col gap-2"
              >
                <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={chipButtonClass()}
                    onClick={() => {
                      onPick(m, false);
                      resetFlow();
                    }}
                  >
                    1種目へ
                  </button>
                  <button
                    type="button"
                    className={chipButtonClass()}
                    onClick={() => {
                      onPick(m, true);
                      resetFlow();
                    }}
                  >
                    ＋追加
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="w-full min-h-[44px] text-sm text-slate-600"
            onClick={() => setPlEq(null)}
          >
            ← 器具に戻る
          </button>
        </div>
      ) : null}
    </div>
  );
}
