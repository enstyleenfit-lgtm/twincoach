import { Member } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";
import { getInterventionSuggestion } from "@/lib/interventionSuggestion";

export interface TimeSlotPressure {
  timeSlot: string;
  count: number;
  difficultyLevel: "easy" | "medium" | "difficult";
}

export interface StoreReservationPressure {
  storeName: string;
  totalMembers: number;
  difficultReservationMembers: number;
  reservationRiskMembers: number;
  highRiskDueToReservation: number;
  pressureScore: number; // 0-100, 高いほど詰まっている
}

export interface ReservationAnalysis {
  busyTimeSlots: TimeSlotPressure[];
  difficultReservationMembers: Member[];
  reservationRiskMembers: Member[];
  storePressures: StoreReservationPressure[];
}

/**
 * 時間帯別の予約集中度を分析
 */
function analyzeTimeSlotPressure(members: Member[]): TimeSlotPressure[] {
  const timeSlotMap = new Map<string, { count: number; difficulties: string[] }>();

  for (const member of members) {
    if (member.preferredTimeSlot) {
      const slot = member.preferredTimeSlot;
      if (!timeSlotMap.has(slot)) {
        timeSlotMap.set(slot, { count: 0, difficulties: [] });
      }
      const data = timeSlotMap.get(slot)!;
      data.count += 1;
      if (member.reservationDifficultyLevel) {
        data.difficulties.push(member.reservationDifficultyLevel);
      }
    }
  }

  return Array.from(timeSlotMap.entries())
    .map(([timeSlot, data]) => {
      // 難易度の平均を計算
      const difficultyCounts = {
        difficult: data.difficulties.filter((d) => d === "difficult").length,
        medium: data.difficulties.filter((d) => d === "medium").length,
        easy: data.difficulties.filter((d) => d === "easy").length,
      };

      let difficultyLevel: "easy" | "medium" | "difficult" = "easy";
      if (difficultyCounts.difficult > 0 || difficultyCounts.medium > data.count * 0.5) {
        difficultyLevel = "difficult";
      } else if (difficultyCounts.medium > 0) {
        difficultyLevel = "medium";
      }

      return {
        timeSlot,
        count: data.count,
        difficultyLevel,
      };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * 予約が困難な会員を抽出
 */
function getDifficultReservationMembers(members: Member[]): Member[] {
  return members.filter(
    (member) =>
      member.reservationDifficultyLevel === "difficult" ||
      (member.preferredTimeSlot && !member.bookedTimeSlot) ||
      member.hasCancellationHistory
  );
}

/**
 * 予約問題リスク会員を抽出
 */
function getReservationRiskMembers(members: Member[]): Member[] {
  return members.filter((member) => {
    const suggestion = getInterventionSuggestion(member);
    return suggestion.type === "reservation";
  });
}

/**
 * 予約問題による高リスク会員を抽出
 */
function getHighRiskDueToReservation(members: Member[]): Member[] {
  return members.filter((member) => {
    const riskResult = calculateRiskScore(member);
    const suggestion = getInterventionSuggestion(member);
    return riskResult.level === "high" && suggestion.type === "reservation";
  });
}

/**
 * 店舗別の予約プレッシャーを分析
 */
function analyzeStorePressure(members: Member[]): StoreReservationPressure[] {
  const storeMap = new Map<string, StoreReservationPressure>();

  for (const member of members) {
    const storeName = member.storeName || "店舗未設定";
    if (!storeMap.has(storeName)) {
      storeMap.set(storeName, {
        storeName,
        totalMembers: 0,
        difficultReservationMembers: 0,
        reservationRiskMembers: 0,
        highRiskDueToReservation: 0,
        pressureScore: 0,
      });
    }

    const store = storeMap.get(storeName)!;
    store.totalMembers += 1;

    // 予約困難会員
    if (
      member.reservationDifficultyLevel === "difficult" ||
      (member.preferredTimeSlot && !member.bookedTimeSlot) ||
      member.hasCancellationHistory
    ) {
      store.difficultReservationMembers += 1;
    }

    // 予約問題リスク会員
    const suggestion = getInterventionSuggestion(member);
    if (suggestion.type === "reservation") {
      store.reservationRiskMembers += 1;
    }

    // 予約問題による高リスク会員
    const riskResult = calculateRiskScore(member);
    if (riskResult.level === "high" && suggestion.type === "reservation") {
      store.highRiskDueToReservation += 1;
    }
  }

  // プレッシャースコアを計算（0-100）
  for (const store of storeMap.values()) {
    if (store.totalMembers > 0) {
      const difficultRatio = store.difficultReservationMembers / store.totalMembers;
      const riskRatio = store.reservationRiskMembers / store.totalMembers;
      const highRiskRatio = store.highRiskDueToReservation / store.totalMembers;
      store.pressureScore = Math.round(
        (difficultRatio * 0.4 + riskRatio * 0.4 + highRiskRatio * 0.2) * 100
      );
    }
  }

  return Array.from(storeMap.values()).sort((a, b) => b.pressureScore - a.pressureScore);
}

/**
 * 予約詰まり分析を実行
 */
export function getReservationAnalysis(members: Member[]): ReservationAnalysis {
  return {
    busyTimeSlots: analyzeTimeSlotPressure(members),
    difficultReservationMembers: getDifficultReservationMembers(members),
    reservationRiskMembers: getReservationRiskMembers(members),
    storePressures: analyzeStorePressure(members),
  };
}

/**
 * 店舗別の予約分析を取得
 */
export function getReservationAnalysisByStore(
  members: Member[],
  storeName: string
): ReservationAnalysis {
  const storeMembers = members.filter((m) => m.storeName === storeName);
  return getReservationAnalysis(storeMembers);
}







