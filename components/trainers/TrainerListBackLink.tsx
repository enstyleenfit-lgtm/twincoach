"use client";

import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import { trainersListHref } from "@/lib/routeContext";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function TrainerListBackLink({ className, children }: Props) {
  const seg = useAppRouteSegment();
  return (
    <Link href={trainersListHref(seg)} className={className}>
      {children}
    </Link>
  );
}
