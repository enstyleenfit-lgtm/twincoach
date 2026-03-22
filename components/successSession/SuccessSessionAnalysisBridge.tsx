"use client";

import { useEffect, useState } from "react";
import { analyzeSuccessfulSessions } from "@/lib/successSessionAI";
import { loadImportedMembers, loadImportedSessions, mergeBaseAndImported } from "@/lib/importStore";
import type { Member, SuccessSessionAnalysis } from "@/types";
import { SuccessSessionAnalysisPanel } from "./SuccessSessionAnalysisPanel";

type Props = {
  serverAnalysis: SuccessSessionAnalysis;
  /** サーバーで取得した全会員（指定時は /api への fetch を行わない） */
  baseMembersFromServer?: Member[];
  /** 指定時は担当トレーナー名が一致する会員のみで再計算 */
  trainerName?: string;
  embedInCard?: boolean;
  patternsHeading?: string;
  traitsHeading?: string;
  actionsHeading?: string;
};

export function SuccessSessionAnalysisBridge({
  serverAnalysis,
  baseMembersFromServer,
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

    try {
      let merged: Member[] =
        baseMembersFromServer != null
          ? mergeBaseAndImported(baseMembersFromServer, loadImportedMembers())
          : loadImportedMembers();
      if (trainerName) {
        const t = trainerName.trim();
        merged = merged.filter((m) => (m.assignedTrainer || "").trim() === t);
      }
      if (merged.length === 0) {
        setSessionEnhanced(false);
        setAnalysis(serverAnalysis);
        return;
      }
      setSessionEnhanced(true);
      setAnalysis(analyzeSuccessfulSessions(merged, sessions));
    } catch {
      setSessionEnhanced(false);
      setAnalysis(serverAnalysis);
    }
  }, [serverAnalysis, trainerName, baseMembersFromServer]);

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
