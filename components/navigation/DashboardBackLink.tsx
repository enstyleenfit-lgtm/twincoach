"use client";

import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import { dashboardHref } from "@/lib/routeContext";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function DashboardBackLink({ className, children }: Props) {
  const seg = useAppRouteSegment();
  return (
    <Link href={dashboardHref(seg)} className={className}>
      {children}
    </Link>
  );
}
