"use client";

import { useRouter } from "next/navigation";
import { createClientSupabase } from "@/lib/supabase/client";
import { useState } from "react";
import { PREFERRED_APP_ROLE_STORAGE_KEY } from "@/components/sidebar/useResolvedAppRole";
import { DEMO_ROLE_COOKIE_NAME } from "@/lib/authz/demoSession";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabase = createClientSupabase();
      await supabase.auth.signOut();
      try {
        window.localStorage.removeItem(PREFERRED_APP_ROLE_STORAGE_KEY);
      } catch {
        // noop
      }
      const secure = typeof window !== "undefined" && window.location.protocol === "https:";
      document.cookie = `${DEMO_ROLE_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${
        secure ? "; Secure" : ""
      }`;
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
