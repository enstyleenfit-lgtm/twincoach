"use client";

import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import { storesListHref } from "@/lib/routeContext";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function StoresListBackLink({ className, children }: Props) {
  const seg = useAppRouteSegment();
  return (
    <Link href={storesListHref(seg)} className={className}>
      {children}
    </Link>
  );
}
