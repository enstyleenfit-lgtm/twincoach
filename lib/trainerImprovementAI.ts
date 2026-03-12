import { Member } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";
import { getInterventionSuggestion } from "@/lib/interventionSuggestion";
import { getFirst90DaysRiskSummary } from "@/lib/first90Days";
import { getRevenueRiskForecast } from "@/lib/revenueForecast";
import { getRevenueAtRisk } from "@/lib/revenueRisk";

export interface TrainerImprovementSuggestion {
  trainerName: string;
  topIssue: string;
  priorityLabel: "high" | "medium" | "low";
  suggestionTitle: string;
  suggestionBody: string;
  actionItems: string[];
  expectedImpact: string;
}

function clampActionItems(items: string[]): string[] {
  return items.filter(Boolean).slice(0, 5);
}

export function getTrainerImprovementSuggestion(
  members: Member[],
  trainerName: string
): TrainerImprovementSuggestion {
  const trainerMembers = members.filter(
    (m) => m.assignedTrainer === trainerName
  );

  if (trainerMembers.length === 0) {
    return {
      trainerName,
      topIssue: "担当会員データがありません",
      priorityLabel: "low",
      suggestionTitle: "まずは担当会員の割り当てを確認",
      suggestionBody:
        "担当会員が0名のため、改善提案を生成できません。担当割り当てが正しいか確認してください。",
      actionItems: ["担当会員の割り当て状況を確認する"],
      expectedImpact: "データ不足のため試算できません",
    };
  }

  const totalMembers = trainerMembers.length;
  const highRiskMembers = trainerMembers.filter(
    (m) => calculateRiskScore(m).level === "high"
  );
  const highRiskRatio = highRiskMembers.length / totalMembers;

  const suggestions = trainerMembers.map((m) => getInterventionSuggestion(m));
  const reservationCount = suggestions.filter((s) => s.type === "reservation")
    .length;
  const motivationCount = suggestions.filter((s) => s.type === "motivation")
    .length;

  const first90Days = getFirst90DaysRiskSummary(trainerMembers);
  const first90DaysHighRiskCount = first90Days.highRiskFirst90DaysMembers.length;

  const revenueLoss30Days = trainerMembers.reduce((sum, m) => {
    const forecast = getRevenueRiskForecast(m);
    return sum + forecast.expectedLoss30Days;
  }, 0);

  const topLossMembers = trainerMembers
    .map((m) => ({
      member: m,
      forecast: getRevenueRiskForecast(m),
      revenue: getRevenueAtRisk(m),
      risk: calculateRiskScore(m),
      suggestion: getInterventionSuggestion(m),
    }))
    .sort((a, b) => b.forecast.expectedLoss30Days - a.forecast.expectedLoss30Days)
    .slice(0, 3);

  // 判定（優先順位）
  // 1) 収益リスクが高い
  if (revenueLoss30Days >= 300000) {
    const items = clampActionItems([
      `高損失予測の担当会員 上位3名に本日連絡（合計¥${Math.round(
        topLossMembers.reduce((s, x) => s + x.forecast.expectedLoss30Days, 0)
      ).toLocaleString()}の防衛余地）`,
      "次回予約の確定（日時をその場で仮押さえ）を最優先で実施",
      "高LTV会員（売上が大きい会員）から順に、継続の障害（予約・動機・生活）を特定して解消",
      "今週中に短時間の進捗レビュー（5〜10分）をセットし、離脱の兆候を早期に潰す",
    ]);

    return {
      trainerName,
      topIssue: "高LTV会員の収益リスク",
      priorityLabel: "high",
      suggestionTitle: "高損失予測の会員から優先介入して、売上を守りましょう",
      suggestionBody:
        "担当会員の期待損失（30日）が大きい状態です。売上インパクトが大きい会員から順に、次回予約の確保と障害解消を短期間で回すのが効果的です。",
      actionItems: items,
      expectedImpact: `来月の期待損失¥${Math.round(
        revenueLoss30Days
      ).toLocaleString()}の一部を防衛できる可能性があります`,
    };
  }

  // 2) 予約型が多い
  if (reservationCount / totalMembers >= 0.25) {
    const items = clampActionItems([
      `予約型リスク会員${reservationCount}名に、代替枠（時間帯/曜日）を提案`,
      "混雑時間帯の分散（午前/平日/別店舗など）をテンプレで案内して成約率を上げる",
      "キャンセル履歴のある会員は、予約確定までのフォロー（前日確認）を徹底",
      "来店間隔が15日以上の会員を優先して次回予約を確定",
    ]);

    return {
      trainerName,
      topIssue: "予約サポート不足（予約型リスク）",
      priorityLabel: "high",
      suggestionTitle: "予約の障害を取り除いて、離脱を先回りしましょう",
      suggestionBody:
        "予約が取れない/キャンセルが増えると、継続率が急落しやすいです。まずは予約型リスク会員に対して代替枠提案と予約確定プロセスを強化しましょう。",
      actionItems: items,
      expectedImpact: "予約起因の離脱を減らし、継続率と稼働を安定化できます",
    };
  }

  // 3) モチベーション型が多い
  if (motivationCount / totalMembers >= 0.3) {
    const items = clampActionItems([
      `モチベーション型会員${motivationCount}名の目標を今週中に再設定（小さな成功を設計）`,
      "成果の可視化（測定・比較・写真など）を次回セッションの標準フローに組み込む",
      "来店間隔が8〜14日の会員には、短期成果メニューを提案して定着を促進",
      "フィードバック頻度を上げる（週1の短文チェックイン）",
    ]);

    return {
      trainerName,
      topIssue: "成果実感の不足（モチベーション型）",
      priorityLabel: "medium",
      suggestionTitle: "成果の可視化と目標再設定で、定着を強化しましょう",
      suggestionBody:
        "モチベーション型の離脱は『成果が見えない』が引き金になりやすいです。目標の再定義と短期成果の設計を先に入れると、継続率が改善しやすいです。",
      actionItems: items,
      expectedImpact: "短期成果の体験により、来店頻度と継続率の改善が期待できます",
    };
  }

  // 4) 90日以内の高リスクが多い（新規定着）
  if (first90DaysHighRiskCount >= Math.max(3, Math.ceil(totalMembers * 0.15))) {
    const items = clampActionItems([
      `入会後90日以内の高リスク会員${first90DaysHighRiskCount}名に本日フォロー連絡`,
      "入会後30日以内は、次回予約の確定＋1回の進捗面談をセット化",
      "初期会員には『何が不安か』のヒアリング項目を固定し、早期に障害を除去",
      "初期の来店間隔が伸びた会員を優先キュー化して毎日確認",
    ]);

    return {
      trainerName,
      topIssue: "初期定着の弱さ（入会後90日）",
      priorityLabel: "high",
      suggestionTitle: "入会後90日の定着フォローを強化しましょう",
      suggestionBody:
        "入会初期は離脱しやすい重要期間です。初期会員の不安要因を短期間で解消し、次回予約の確定と小さな成功体験をセットで提供するのが効果的です。",
      actionItems: items,
      expectedImpact: "初期離脱を減らし、長期継続と紹介につながりやすくなります",
    };
  }

  // 5) 高リスク比率が高い（全体）
  if (highRiskRatio >= 0.25) {
    const items = clampActionItems([
      `高リスク会員${highRiskMembers.length}名のうち上位3名へ本日連絡`,
      "退会確率（30日）が高い会員から順に、障害（予約/動機/生活）に合わせて介入",
      "来店が14日以上空いている会員に短期スケジュール提案",
      "介入結果をメモし、次週の改善サイクルに反映",
    ]);

    return {
      trainerName,
      topIssue: "高リスク会員の集中",
      priorityLabel: "high",
      suggestionTitle: "高リスク会員の早期介入を強化しましょう",
      suggestionBody:
        "高リスク会員が一定数いる状態です。上位から短期間で介入し、離脱の引き金になる要因を先に取り除くと改善が早いです。",
      actionItems: items,
      expectedImpact: "離脱を先回りして、担当継続率と売上の下振れを抑えられます",
    };
  }

  return {
    trainerName,
    topIssue: "改善優先度は中（安定運用）",
    priorityLabel: "low",
    suggestionTitle: "安定運用を維持しつつ、予防的フォローを継続しましょう",
    suggestionBody:
      "大きな偏りは見られません。中リスク会員の予防的フォローと、予約・成果可視化の標準化で、継続率を底上げできます。",
    actionItems: clampActionItems([
      "中リスク会員に週1回の短文チェックインを実施",
      "次回予約の確定率を上げる（セッション終盤で必ず次回を押さえる）",
      "小さな成果指標を毎回記録し、会員にフィードバックする",
    ]),
    expectedImpact: "継続率の維持と、リスクの芽の早期発見につながります",
  };
}


