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

export type RiskTrendDatum = {
  name: string;
  value: number;
  color: string;
};

export function RiskTrendChart({ data }: { data: RiskTrendDatum[] }) {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={256}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#64748b" }} />
          <YAxis stroke="#64748b" tick={{ fill: "#64748b" }} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              color: "#0f172a",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
            }}
            labelStyle={{ color: "#0f172a" }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
