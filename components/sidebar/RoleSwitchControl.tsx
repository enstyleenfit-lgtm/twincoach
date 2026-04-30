"use client";

import { useResolvedAppRole } from "@/components/sidebar/useResolvedAppRole";

const ROLE_LABEL: Record<string, string> = {
  hq: "本部",
  owner: "オーナー",
  store: "店舗",
  trainer: "トレーナー",
};

export function RoleSwitchControl() {
  const currentRole = useResolvedAppRole();
  const label = ROLE_LABEL[currentRole] ?? currentRole;

  return (
    <div className="mb-4">
      <span className="inline-block rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
        {label}
      </span>
    </div>
  );
}
