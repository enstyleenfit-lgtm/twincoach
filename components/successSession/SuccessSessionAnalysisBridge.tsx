"use client";

import { useEffect, useState } from "react";
import { analyzeSuccessfulSessions } from "@/lib/successSessionAI";
import { loadImportedMembers, loadImportedSessions, mergeBaseAndImported } from "@/lib/importStore";
import type { Member, SuccessSessionAnalysis } from "@/types";
import { SuccessSessionAnalysisPanel } from "./SuccessSessionAnalysisPanel";

type Props = {
  serverAnalysis: SuccessSessionAnalysis;
  /** 指定時は担当トレーナー名が一致する会員のみで再計算 */
  trainerName?: string;
  embedInCard?: boolean;
  patternsHeading?: string;
  traitsHeading?: string;
  actionsHeading?: string;
};

export function SuccessSessionAnalysisBridge({
  serverAnalysis,
  trainerName,
  embedInCard,
  patternsHeading,
  traitsHeading,
  actionsHeading,
}: Props) {
  const [analysis, setAnalysis] = useState<SuccessSessionAnalysis>(serverAnalysis);
  const [sessionEnhanced, setSessionEnhanced] = useState(false);

  useEffect(() => {
    const sessions = loadImportedSessions();
    if (sessions.length === 0) {
      setSessionEnhanced(false);
      setAnalysis(serverAnalysis);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/members", { cache: "no-store" });
        const base: Member[] = res.ok ? await res.json() : [];
        let merged: Member[] = mergeBaseAndImported(base, loadImportedMembers());
        if (trainerName) {
          const t = trainerName.trim();
          merged = merged.filter((m) => (m.assignedTrainer || "").trim() === t);
        }
        if (merged.length === 0) {
          if (!cancelled) {
            setSessionEnhanced(false);
            setAnalysis(serverAnalysis);
          }
          return;
        }
        const next = analyzeSuccessfulSessions(merged, sessions);
        if (!cancelled) {
          setSessionEnhanced(true);
          setAnalysis(next);
        }
      } catch {
        if (!cancelled) {
          setSessionEnhanced(false);
          setAnalysis(serverAnalysis);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serverAnalysis, trainerName]);

  return (
    <SuccessSessionAnalysisPanel
      analysis={analysis}
      sessionEnhanced={sessionEnhanced}
      embedInCard={embedInCard}
      patternsHeading={patternsHeading}
      traitsHeading={traitsHeading}
      actionsHeading={actionsHeading}
    />
  );
}
