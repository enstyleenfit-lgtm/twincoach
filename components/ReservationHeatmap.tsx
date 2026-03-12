"use client";

import { HeatmapCell } from "@/lib/reservationHeatmap";

interface ReservationHeatmapProps {
  cells: HeatmapCell[][];
  maxPressure: number;
}

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

/**
 * 圧力スコアから色の濃さを計算
 */
function getPressureColor(pressureScore: number, maxPressure: number): string {
  if (maxPressure === 0) {
    return "bg-zinc-800";
  }

  const ratio = pressureScore / maxPressure;

  if (ratio >= 0.7) {
    return "bg-red-600"; // 最も詰まっている
  } else if (ratio >= 0.5) {
    return "bg-red-500";
  } else if (ratio >= 0.3) {
    return "bg-orange-500";
  } else if (ratio >= 0.15) {
    return "bg-yellow-500";
  } else if (ratio > 0) {
    return "bg-yellow-400";
  } else {
    return "bg-zinc-800"; // 予約なし
  }
}

/**
 * 予約詰まり時間帯ヒートマップコンポーネント
 */
export function ReservationHeatmap({
  cells,
  maxPressure,
}: ReservationHeatmapProps) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-2 text-xs font-semibold text-zinc-400 border border-zinc-800 bg-zinc-900">
                時間帯
              </th>
              {WEEKDAYS.map((weekday) => (
                <th
                  key={weekday}
                  className="px-2 py-2 text-xs font-semibold text-zinc-400 border border-zinc-800 bg-zinc-900"
                >
                  {weekday}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cells.map((row, hourIndex) => {
              const hour = row[0].hour;
              return (
                <tr key={hour}>
                  <td className="px-2 py-2 text-xs font-semibold text-zinc-400 border border-zinc-800 bg-zinc-900">
                    {hour}時
                  </td>
                  {row.map((cell, weekdayIndex) => {
                    const bgColor = getPressureColor(cell.pressureScore, maxPressure);
                    return (
                      <td
                        key={`${hour}-${cell.weekday}`}
                        className={`px-2 py-2 text-center border border-zinc-800 ${bgColor} relative group`}
                        title={`${hour}時 ${cell.weekday}曜日: ${cell.count}人, 圧力スコア ${cell.pressureScore}`}
                      >
                        {cell.count > 0 && (
                          <span className="text-xs font-semibold text-white">
                            {cell.count}
                          </span>
                        )}
                        {/* ツールチップ風の表示 */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 border border-zinc-700">
                          {hour}時 {cell.weekday}曜日
                          <br />
                          予約希望: {cell.count}人
                          <br />
                          圧力スコア: {cell.pressureScore}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* 凡例 */}
        <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400">
          <span>凡例:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-zinc-800 border border-zinc-700"></div>
            <span>予約なし</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400"></div>
            <span>低</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500"></div>
            <span>中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500"></div>
            <span>高</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500"></div>
            <span>非常に高</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600"></div>
            <span>最高</span>
          </div>
        </div>
      </div>
    </div>
  );
}

