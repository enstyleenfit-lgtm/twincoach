"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export type PriceRevisionChartDatum = {
  name: string;
  value: number;
  color: string;
};

interface PriceRevisionChartProps {
  data: PriceRevisionChartDatum[];
  isPercentage?: boolean; // パーセンテージ表示かどうか
}

export function PriceRevisionChart({
  data,
  isPercentage = false,
}: PriceRevisionChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: "#a1a1aa" }} />
          <YAxis
            stroke="#a1a1aa"
            tick={{ fill: "#a1a1aa" }}
            tickFormatter={(value) =>
              isPercentage
                ? `${value}%`
                : `¥${(value / 10000).toFixed(0)}万`
            }
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              color: "#e4e4e7",
            }}
            labelStyle={{ color: "#e4e4e7" }}
            formatter={(value: unknown) => {
              const numValue = typeof value === "number" ? value : 0;
              return isPercentage ? `${numValue}%` : `¥${numValue.toLocaleString()}`;
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
