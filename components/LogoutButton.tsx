"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PREFERRED_APP_ROLE_STORAGE_KEY } from "@/components/sidebar/useResolvedAppRole";
import { DEMO_ROLE_COOKIE_NAME } from "@/lib/authz/demoSession";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const clearSessionAndGoLogin = () => {
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
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
          await supabase.auth.signOut();
        } catch (e) {
          console.error("Supabase signOut failed:", e);
        }
      }
      clearSessionAndGoLogin();
    } catch (error) {
      console.error("Logout error:", error);
      clearSessionAndGoLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg px-4 py-2 text-sm font-semibold text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
