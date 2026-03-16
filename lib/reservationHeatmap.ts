import { Member } from "@/types";
import { getInterventionSuggestion } from "./interventionSuggestion";

export interface HeatmapCell {
  hour: number;
  weekday: string;
  count: number;
  difficultyLevel: "easy" | "medium" | "difficult";
  pressureScore: number; // 0-100, 高いほど詰まっている
}

export interface ReservationHeatmapData {
  cells: HeatmapCell[][];
  maxPressure: number;
  reservationRiskMembersCount: number;
  busiestTimeSlot: string | null;
  needsDiversionTimeSlots: string[];
}

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

/**
 * 予約詰まり時間帯ヒートマップデータを生成
 * @param members 会員リスト
 * @returns ヒートマップデータ
 */
export function getReservationHeatmapData(
  members: Member[]
): ReservationHeatmapData {
  // 時間帯×曜日のマトリックスを作成
  const cellMap = new Map<string, HeatmapCell>();

  // 初期化
  for (const hour of HOURS) {
    for (const weekday of WEEKDAYS) {
      const key = `${hour}-${weekday}`;
      cellMap.set(key, {
        hour,
        weekday,
        count: 0,
        difficultyLevel: "easy",
        pressureScore: 0,
      });
    }
  }

  // 会員データから予約詰まり度を計算
  for (const member of members) {
    if (member.preferredHour !== undefined && member.preferredWeekday) {
      const key = `${member.preferredHour}-${member.preferredWeekday}`;
      const cell = cellMap.get(key);
      if (cell) {
        cell.count += 1;

        // 難易度を考慮
        if (member.reservationDifficultyLevel === "difficult") {
          cell.pressureScore += 30;
        } else if (member.reservationDifficultyLevel === "medium") {
          cell.pressureScore += 15;
        } else {
          cell.pressureScore += 5;
        }

        // 予約問題リスク会員かどうか
        const suggestion = getInterventionSuggestion(member);
        if (suggestion.type === "reservation") {
          cell.pressureScore += 20;
        }

        // 予約希望時間帯に予約できていない場合
        if (member.preferredTimeSlot && !member.bookedTimeSlot) {
          cell.pressureScore += 25;
        }

        // キャンセル履歴がある場合
        if (member.hasCancellationHistory) {
          cell.pressureScore += 15;
        }
      }
    }
  }

  // 難易度レベルを設定
  let maxPressure = 0;
  for (const cell of cellMap.values()) {
    maxPressure = Math.max(maxPressure, cell.pressureScore);
    
    if (cell.pressureScore >= 50) {
      cell.difficultyLevel = "difficult";
    } else if (cell.pressureScore >= 25) {
      cell.difficultyLevel = "medium";
    } else {
      cell.difficultyLevel = "easy";
    }
  }

  // 2次元配列に変換（時間帯×曜日）
  const cells: HeatmapCell[][] = HOURS.map((hour) =>
    WEEKDAYS.map((weekday) => {
      const key = `${hour}-${weekday}`;
      return cellMap.get(key)!;
    })
  );

  // 予約問題リスク会員数
  const reservationRiskMembers = members.filter((member) => {
    const suggestion = getInterventionSuggestion(member);
    return suggestion.type === "reservation";
  });

  // 最も詰まっている時間帯
  let busiestTimeSlot: string | null = null;
  let maxCellPressure = 0;
  for (const cell of cellMap.values()) {
    if (cell.pressureScore > maxCellPressure) {
      maxCellPressure = cell.pressureScore;
      busiestTimeSlot = `${cell.hour}時 ${cell.weekday}曜日`;
    }
  }

  // 分散提案が必要な時間帯（pressureScore >= 50）
  const needsDiversionTimeSlots: string[] = [];
  for (const cell of cellMap.values()) {
    if (cell.pressureScore >= 50 && cell.count > 0) {
      needsDiversionTimeSlots.push(`${cell.hour}時 ${cell.weekday}曜日`);
    }
  }

  return {
    cells,
    maxPressure,
    reservationRiskMembersCount: reservationRiskMembers.length,
    busiestTimeSlot,
    needsDiversionTimeSlots,
  };
}




