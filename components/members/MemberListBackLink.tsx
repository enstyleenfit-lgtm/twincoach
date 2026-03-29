"use client";

import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import { membersListHref } from "@/lib/routeContext";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function MemberListBackLink({ className, children }: Props) {
  const seg = useAppRouteSegment();
  return (
    <Link href={membersListHref(seg)} className={className}>
      {children}
    </Link>
  );
}
