import { AppRouteProvider } from "@/components/navigation/AppRouteContext";

export default function StoresRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppRouteProvider segment="store">{children}</AppRouteProvider>;
}
