"use client";

import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import { trainerDetailHref } from "@/lib/routeContext";

type Props = {
  trainerName: string;
  className?: string;
  children: React.ReactNode;
};

export function ContextualTrainerLink({ trainerName, className, children }: Props) {
  const seg = useAppRouteSegment();
  return (
    <Link href={trainerDetailHref(seg, trainerName)} className={className}>
      {children}
    </Link>
  );
}
