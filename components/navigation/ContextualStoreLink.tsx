"use client";

import Link from "next/link";
import { useAppRouteSegment } from "@/components/navigation/AppRouteContext";
import { storeDetailHref } from "@/lib/routeContext";

type Props = {
  storeName: string;
  className?: string;
  children: React.ReactNode;
};

export function ContextualStoreLink({ storeName, className, children }: Props) {
  const seg = useAppRouteSegment();
  return (
    <Link href={storeDetailHref(seg, storeName)} className={className}>
      {children}
    </Link>
  );
}
