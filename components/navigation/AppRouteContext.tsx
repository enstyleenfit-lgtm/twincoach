"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { AppRouteSegment } from "@/lib/routeContext";
import { segmentFromPathname } from "@/lib/routeContext";

const AppRouteContext = createContext<AppRouteSegment | null>(null);

type ProviderProps = {
  segment: AppRouteSegment;
  children: ReactNode;
};

export function AppRouteProvider({ segment, children }: ProviderProps) {
  return <AppRouteContext.Provider value={segment}>{children}</AppRouteContext.Provider>;
}

/**
 * レイアウトで segment が渡されていればそれを優先し、なければ pathname から推測する。
 */
export function useAppRouteSegment(): AppRouteSegment {
  const explicit = useContext(AppRouteContext);
  const pathname = usePathname();
  if (explicit !== null) return explicit;
  return segmentFromPathname(pathname);
}
