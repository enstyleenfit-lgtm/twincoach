"use client";

import { useState, FormEvent } from "react";
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    <div className="relative min-h-[calc(100dvh-0px)] overflow-hidden bg-gradient-to-br from-white via-slate-50/90 to-slate-100/50 text-slate-900">
      {/* ごく薄いぼかしオーブ（装飾のみ・pointer-events なし） */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-[20%] top-[10%] h-[min(28rem,55vw)] w-[min(28rem,55vw)] rounded-full bg-sky-100/25 blur-3xl" />
        <div className="absolute -right-[15%] top-[35%] h-[min(22rem,45vw)] w-[min(22rem,45vw)] rounded-full bg-slate-200/30 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[30%] h-[min(20rem,40vw)] w-[min(20rem,40vw)] rounded-full bg-blue-50/40 blur-3xl" />
      </div>

      <div className="relative z-[1] mx-auto flex min-h-[calc(100dvh-0px)] max-w-6xl flex-col justify-center px-6 py-16 md:px-10 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 xl:gap-24">
          {/* 左：ブランド */}
          <header className="flex flex-col gap-6 md:gap-8">
            <div className="motion-brand space-y-6 md:space-y-8">
              <h1 className="text-[2.75rem] font-semibold leading-[1.08] tracking-tight text-slate-900 md:text-6xl md:leading-[1.05] motion-brand-title">
                TwinCoach
              </h1>
              <p className="text-lg font-medium tracking-tight text-slate-600 md:text-xl motion-brand-subtitle">
                Retention &amp; Revenue OS
              </p>
              <p className="max-w-xl text-lg leading-[1.75] text-slate-500 md:text-xl md:leading-[1.8] motion-brand-body">
                現場の記録を、
                <br />
                次の対応と経営判断につなげる
              </p>
            </div>

            <div className="motion-brand-hint max-w-md rounded-2xl border border-slate-200/80 bg-white/60 px-5 py-4 backdrop-blur-sm md:px-6 md:py-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Demo
              </p>
              <p className="mt-2 text-sm text-slate-600">
                パスワード{" "}
                <span className="font-semibold text-slate-800">1</span> /{" "}
                <span className="font-semibold text-slate-800">2</span> /{" "}
                <span className="font-semibold text-slate-800">3</span>
                で本部・オーナー・店舗へ分岐します。
              </p>
              <ul className="mt-4 space-y-2">
                {DEMO_LOGIN_RULES.map((rule) => (
                  <li
                    key={rule.password}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 transition-all duration-200 hover:border-slate-300/90 hover:bg-white hover:shadow-sm"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {rule.roleLabel}
                    </span>
                    <span className="inline-flex min-w-[2rem] items-center justify-center rounded-lg border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700 transition-transform duration-200 group-hover:border-slate-300 group-hover:shadow-[0_1px_0_rgba(15,23,42,0.06)]">
                      {rule.password}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </header>

          {/* 右：フォームカード */}
          <div className="motion-login-card mx-auto w-full max-w-md lg:mx-0 lg:max-w-none lg:justify-self-end">
            <div className="rounded-3xl border border-slate-200/90 bg-white/85 p-8 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.12)] backdrop-blur-md md:p-10">
              <div className="mb-8 border-b border-slate-100 pb-6">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                  Sign in
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                  アカウントでログイン
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  デモ環境です。メールは任意の形式で入力できます。
                </p>
              </div>

              {error ? (
                <div
                  className="mb-6 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-medium uppercase tracking-wide text-slate-500"
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
                    className="tc-login-input w-full rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3.5 text-[15px] text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.04)] outline-none transition-[border-color,box-shadow,transform,background-color] duration-200 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_8px_24px_-12px_rgba(15,23,42,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="name@company.jp"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium uppercase tracking-wide text-slate-500"
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
                    className="tc-login-input w-full rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3.5 text-[15px] text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.04)] outline-none transition-[border-color,box-shadow,transform,background-color] duration-200 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12),0_8px_24px_-12px_rgba(15,23,42,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="1 / 2 / 3"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="tc-login-submit w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] outline-none transition-[transform,box-shadow,background-color,opacity] duration-200 hover:bg-slate-800 hover:shadow-[0_12px_28px_-16px_rgba(15,23,42,0.35)] active:translate-y-px active:shadow-[0_4px_12px_-8px_rgba(15,23,42,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "ログイン中…" : "ログイン"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (prefers-reduced-motion: no-preference) {
          .motion-brand {
            animation: tc-brand-wrap 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .motion-brand-title {
            animation: tc-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .motion-brand-subtitle {
            animation: tc-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
            animation-delay: 70ms;
          }
          .motion-brand-body {
            animation: tc-rise 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
            animation-delay: 130ms;
          }
          .motion-brand-hint {
            animation: tc-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) both;
            animation-delay: 200ms;
          }
          .motion-login-card {
            animation: tc-card-rise 640ms cubic-bezier(0.22, 1, 0.36, 1) both;
            animation-delay: 120ms;
          }
        }
        @keyframes tc-brand-wrap {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes tc-rise {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes tc-card-rise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
