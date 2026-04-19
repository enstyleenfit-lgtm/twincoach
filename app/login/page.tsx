"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { persistPreferredAppRole, type AppShellRole } from "@/components/sidebar/useResolvedAppRole";
import {
  DEMO_ROLE_COOKIE_NAME,
  roleHomePath,
  type DemoAppRole,
} from "@/lib/authz/demoSession";

const DEMO_LOGIN_RULES: Array<{
  password: "1" | "2" | "3";
  role: DemoAppRole;
  roleLabel: string;
  destination: string;
}> = [
  { password: "1", role: "hq", roleLabel: "本部", destination: "/hq" },
  { password: "2", role: "owner", roleLabel: "オーナー", destination: "/owner" },
  { password: "3", role: "store", roleLabel: "店舗", destination: "/stores" },
];

const DEPLOY_SHA =
  typeof process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA === "string" &&
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.length > 0
    ? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)
    : "local";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.info(
      `[TwinCoach login] app/login/page.tsx | deploy=${DEPLOY_SHA} | NODE_ENV=${process.env.NODE_ENV}`,
    );
  }, []);

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

    const matched = DEMO_LOGIN_RULES.find((rule) => rule.password === password.trim());
    if (!matched) {
      setError("デモ用パスワードは 1 / 2 / 3 のいずれかを入力してください");
      setLoading(false);
      return;
    }

    persistDemoSession(matched.role);
    router.push(roleHomePath(matched.role));
    router.refresh();
    setLoading(false);
  };

  return (
    <div
      className="tc-login-page relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-br from-cyan-200 via-sky-100 to-indigo-200 text-slate-900 ring-8 ring-indigo-800 ring-inset"
      data-tc-renderer="app/login/page.tsx"
    >
      {/* 一時的・誰が見ても別画面だと分かる識別バー（本番デプロイ照合用 SHA 付き） */}
      <div
        className="relative z-[50] flex flex-none flex-col items-center justify-center gap-1 border-b-4 border-indigo-950 bg-amber-300 px-4 py-3 text-center shadow-md"
        data-tc-login-banner="new-login-v1"
      >
        <p className="text-lg font-black tracking-wide text-indigo-950 md:text-xl">
          NEW LOGIN（識別用・後で削除可）
        </p>
        <p className="text-xs font-semibold text-indigo-900 md:text-sm">
          <span data-tc-deploy-sha={DEPLOY_SHA}>{DEPLOY_SHA}</span>
          <span className="mx-2 text-indigo-950/50">|</span>
          <span className="font-mono text-[11px] md:text-xs">data-tc-renderer=&quot;app/login/page.tsx&quot;</span>
        </p>
      </div>

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-90"
        aria-hidden
      >
        <div className="absolute -left-[15%] top-[20%] h-64 w-64 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute -right-[10%] bottom-[15%] h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
      </div>

      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto w-full max-w-xl space-y-10 text-center">
          <header className="tc-login-motion-brand space-y-5 md:space-y-6">
            <h1 className="tc-login-motion-title text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
              TwinCoach
            </h1>
            <p className="tc-login-motion-subtitle text-lg font-semibold text-slate-700 md:text-2xl">
              Retention &amp; Revenue OS
            </p>
            <p className="tc-login-motion-body mx-auto max-w-md text-base leading-relaxed text-slate-600 md:text-lg">
              現場の記録を、
              <br />
              次の対応と経営判断につなげる
            </p>
          </header>

          <div className="tc-login-motion-card w-full">
            <div className="rounded-[1.75rem] border-4 border-indigo-800 bg-white p-8 shadow-[0_32px_64px_-24px_rgba(30,27,75,0.45)] md:p-12">
              <div className="mb-8 border-b-2 border-indigo-100 pb-6 text-left">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">
                  Sign in
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
                  ログイン
                </h2>
                <p className="mt-2 text-sm text-slate-600 md:text-base">
                  デモ環境です。メールは任意の形式で入力できます。
                </p>
              </div>

              {error ? (
                <div
                  className="mb-6 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <div className="space-y-2">
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    メールアドレス
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                    className="tc-login-input w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(99,102,241,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="name@company.jp"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    パスワード
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    className="tc-login-input w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-4 text-base text-slate-900 outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(99,102,241,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="1 / 2 / 3"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="tc-login-submit w-full rounded-xl border-2 border-indigo-900 bg-indigo-700 px-4 py-4 text-base font-bold text-white shadow-lg outline-none transition-[transform,background-color,box-shadow] duration-200 hover:bg-indigo-800 hover:shadow-xl active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "ログイン中…" : "ログイン"}
                </button>
              </form>

              <div className="tc-login-motion-hint mt-10 rounded-2xl border-2 border-indigo-200 bg-indigo-50/80 p-5 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Demo
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  パスワード{" "}
                  <span className="font-bold text-indigo-900">1</span> /{" "}
                  <span className="font-bold text-indigo-900">2</span> /{" "}
                  <span className="font-bold text-indigo-900">3</span>
                  で本部・オーナー・店舗へ分岐します。
                </p>
                <ul className="mt-4 space-y-2">
                  {DEMO_LOGIN_RULES.map((rule) => (
                    <li
                      key={rule.password}
                      className="group flex items-center justify-between gap-4 rounded-xl border-2 border-white bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md"
                    >
                      <span className="text-sm font-semibold text-slate-800">
                        {rule.roleLabel}
                      </span>
                      <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border-2 border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-bold tabular-nums text-indigo-900 transition-transform duration-200 group-hover:scale-105">
                        {rule.password}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
