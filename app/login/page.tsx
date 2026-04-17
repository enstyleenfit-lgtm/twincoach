"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { persistPreferredAppRole, type AppShellRole } from "@/components/sidebar/useResolvedAppRole";
import {
  DEMO_ROLE_COOKIE_NAME,
  isDemoRole,
  roleHomePath,
  type DemoAppRole,
} from "@/lib/authz/demoSession";

const DEMO_ACCOUNTS: Array<{
  email: string;
  role: DemoAppRole;
  roleLabel: string;
  destination: string;
}> = [
  { email: "hq@example.com", role: "hq", roleLabel: "本部", destination: "/hq" },
  { email: "owner@example.com", role: "owner", roleLabel: "オーナー", destination: "/owner" },
  { email: "store@example.com", role: "store", roleLabel: "店舗", destination: "/trainer" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<DemoAppRole>("store");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const resolveRoleByEmail = (rawEmail: string): DemoAppRole | null => {
    const normalized = rawEmail.trim().toLowerCase();
    const found = DEMO_ACCOUNTS.find((a) => a.email === normalized);
    return found?.role ?? null;
  };

  const persistDemoSession = (role: DemoAppRole) => {
    const secure = typeof window !== "undefined" && window.location.protocol === "https:";
    document.cookie = `${DEMO_ROLE_COOKIE_NAME}=${role}; Path=/; Max-Age=86400; SameSite=Lax${
      secure ? "; Secure" : ""
    }`;
    persistPreferredAppRole(role as AppShellRole);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // バリデーション
    if (!email.trim()) {
      setError("メールアドレスを入力してください");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("パスワードを入力してください");
      setLoading(false);
      return;
    }

    // デモ用: role を選択可能 + メール一致時はメール優先で role を決定
    const emailRole = resolveRoleByEmail(email);
    const role = isDemoRole(emailRole) ? emailRole : selectedRole;
    persistDemoSession(role);
    router.push(roleHomePath(role));
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10 items-center">
          <section className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              TwinCoach Platform
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">TwinCoach</h1>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              継続率改善と収益改善を支えるジム運営プラットフォーム。現場の記録を、次の対応と経営判断につなげます。
            </p>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">デモ用アカウント</p>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {DEMO_ACCOUNTS.map((acc) => (
                  <li key={acc.email} className="flex items-center justify-between gap-3">
                    <span>{acc.email}</span>
                    <span className="text-xs text-slate-500">
                      {acc.roleLabel} → {acc.destination}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-slate-500">
                ※ メールが一致しない場合は、下の権限選択でログインします。
              </p>
            </div>
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-md shadow-slate-900/10">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-1">TwinCoachへログイン</h2>
              <p className="text-slate-500 text-xs">
                デモ用ログイン（権限別画面確認用）
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-slate-600 text-xs mb-2">メールアドレス</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs mb-2">パスワード</label>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs mb-2">権限（メール未一致時）</label>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const active = selectedRole === acc.role;
                    return (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => setSelectedRole(acc.role)}
                        className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                          active
                            ? "border-blue-500/40 bg-blue-500/10 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                        aria-pressed={active}
                      >
                        {acc.roleLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 px-4 py-2.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "ログイン中..." : "ログイン"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}



