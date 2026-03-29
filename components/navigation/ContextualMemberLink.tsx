"use client";

import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import { memberDetailHref } from "@/lib/routeContext";

type Props = {
  memberId: string;
  className?: string;
  children: React.ReactNode;
};

export function ContextualMemberLink({ memberId, className, children }: Props) {
  const seg = useAppRouteSegment();
  return (
    <Link href={memberDetailHref(seg, memberId)} className={className}>
      {children}
    </Link>
  );
}
