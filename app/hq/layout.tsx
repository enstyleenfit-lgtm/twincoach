import { AppRouteProvider } from "@/components/navigation/AppRouteContext";

export default function HQLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppRouteProvider segment="hq">{children}</AppRouteProvider>;
}
