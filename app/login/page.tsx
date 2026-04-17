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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10 items-center">
          <section className="space-y-4 motion-fade-up">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 motion-fade-up-title">
              TwinCoach
            </h1>
            <p className="text-sm md:text-base font-medium tracking-wide text-slate-700 motion-fade-up-subtitle">
              Retention &amp; Revenue OS
            </p>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed motion-fade-up-description">
              現場の記録を、
              <br />
              次の対応と経営判断につなげる
            </p>
            <div className="rounded-xl border border-slate-200 bg-white p-4 motion-fade-up-chip">
              <p className="text-xs font-semibold text-slate-500 mb-2">デモ用ログイン</p>
              <ul className="space-y-2">
                {DEMO_LOGIN_RULES.map((rule) => (
                  <li
                    key={rule.password}
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition-all duration-200 hover:border-slate-300 hover:bg-white"
                  >
                    <span className="text-sm text-slate-700">{rule.roleLabel}</span>
                    <span className="inline-flex items-center rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-700 transition-all duration-200 group-hover:scale-[1.02]">
                      {rule.password}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-slate-500">
                パスワード 1 / 2 / 3 で権限別画面に遷移します
              </p>
            </div>
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-md shadow-slate-900/10 motion-login-card">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-1">TwinCoachへログイン</h2>
              <p className="text-slate-500 text-xs">デモ版ログイン（権限分岐確認用）</p>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/45 focus:border-blue-500/50 focus:bg-white focus:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="demo@twincoach.local"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/45 focus:border-blue-500/50 focus:bg-white focus:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="1 / 2 / 3"
                />
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  本部: <span className="font-semibold text-slate-800">1</span> / オーナー: <span className="font-semibold text-slate-800">2</span> / 店舗: <span className="font-semibold text-slate-800">3</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 px-4 py-2.5 text-sm font-medium rounded-md bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.995] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "ログイン中..." : "ログイン"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @media (prefers-reduced-motion: no-preference) {
          .motion-login-card {
            animation: tc-login-card-enter 460ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .motion-fade-up {
            animation: tc-fade-up 420ms ease-out both;
          }
          .motion-fade-up-title {
            animation: tc-fade-up 380ms ease-out both;
          }
          .motion-fade-up-subtitle {
            animation: tc-fade-up 430ms ease-out both;
            animation-delay: 40ms;
          }
          .motion-fade-up-description {
            animation: tc-fade-up 460ms ease-out both;
            animation-delay: 80ms;
          }
          .motion-fade-up-chip {
            animation: tc-fade-up 500ms ease-out both;
            animation-delay: 120ms;
          }
        }
        @keyframes tc-login-card-enter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes tc-fade-up {
          from {
            opacity: 0;
            transform: translateY(8px);
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
