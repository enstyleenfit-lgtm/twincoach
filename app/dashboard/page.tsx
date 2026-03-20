import { redirect } from "next/navigation";

export default function DashboardPage() {
  // ダッシュボードは / にあるので、リダイレクト
  redirect("/");
}







