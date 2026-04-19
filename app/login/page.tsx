"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { persistPreferredAppRole, type AppShellRole } from "@/components/sidebar/useResolvedAppRole";
import { DEMO_ROLE_COOKIE_NAME, roleHomePath, type DemoAppRole } from "@/lib/authz/demoSession";

const LOGIN_PROFILES: Array<{
  role: DemoAppRole;
  roleLabel: string;
  email: string;
  password: "1" | "2" | "3";
}> = [
  { role: "hq", roleLabel: "本部", email: "hq@example.com", password: "1" },
  { role: "owner", roleLabel: "オーナー", email: "owner@example.com", password: "2" },
  { role: "store", roleLabel: "店舗", email: "store@example.com", password: "3" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<DemoAppRole | null>(null);
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

  const applyProfile = (profile: (typeof LOGIN_PROFILES)[number]) => {
    setError(null);
    setSelectedRole(profile.role);
    setEmail(profile.email);
    setPassword(profile.password);
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

    const matched = LOGIN_PROFILES.find((p) => p.password === password.trim());
    if (!matched) {
      setError("メールアドレスまたはパスワードが正しくありません");
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
      className="tc-login-page relative min-h-dvh w-full overflow-x-hidden bg-[#f5f6f8] text-slate-900"
      data-tc-renderer="app/login/page.tsx"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-[20%] top-[-10%] h-[55vh] w-[70vw] max-w-[900px] rounded-full bg-slate-200/35 blur-3xl" />
        <div className="absolute -right-[15%] bottom-[-20%] h-[50vh] w-[60vw] max-w-[720px] rounded-full bg-slate-300/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col lg:flex-row lg:items-stretch">
        {/* 左：ブランド */}
        <aside className="tc-login-motion-brand flex flex-none flex-col justify-end px-8 pb-10 pt-16 sm:px-12 lg:flex-1 lg:justify-center lg:px-14 lg:pb-16 lg:pt-16 xl:px-20 xl:pl-24">
          <div className="max-w-xl lg:max-w-none">
            <p className="tc-login-motion-title text-[clamp(2.75rem,5vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-slate-900">
              TwinCoach
            </p>
            <p className="tc-login-motion-subtitle mt-5 text-[clamp(0.8125rem,1.1vw,0.9375rem)] font-medium uppercase tracking-[0.28em] text-slate-500">
              Retention &amp; Revenue OS
            </p>
            <p className="tc-login-motion-body mt-10 max-w-md text-[clamp(1rem,1.15vw,1.125rem)] leading-relaxed text-slate-600 lg:max-w-lg">
              現場の記録を、
              <br />
              次の対応と経営判断につなげる
            </p>
          </div>
        </aside>

        {/* 右：フォーム */}
        <section className="tc-login-motion-card flex flex-1 flex-col border-t border-slate-200/90 bg-white/90 px-8 pb-16 pt-10 backdrop-blur-[2px] sm:px-12 lg:border-l lg:border-t-0 lg:px-14 lg:py-16 xl:px-20">
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center lg:mx-0 lg:max-w-md xl:max-w-lg">
            <header className="tc-login-motion-form-head mb-10">
              <h2 className="text-lg font-medium tracking-tight text-slate-900">ログイン</h2>
            </header>

            {error ? (
              <div
                className="tc-login-motion-alert mb-8 border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="tc-login-motion-roles">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {LOGIN_PROFILES.map((profile) => {
                    const active = selectedRole === profile.role;
                    return (
                      <button
                        key={profile.role}
                        type="button"
                        aria-pressed={active}
                        onClick={() => applyProfile(profile)}
                        className={[
                          "relative min-h-[2.75rem] rounded-sm border px-2 py-2.5 text-center text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-200 sm:px-3",
                          active
                            ? "border-slate-900 bg-slate-900 text-white shadow-[0_1px_0_rgba(15,23,42,0.06)]"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                        ].join(" ")}
                      >
                        {profile.roleLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    メールアドレス
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSelectedRole(null);
                    }}
                    autoComplete="email"
                    disabled={loading}
                    className="tc-login-input w-full border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400/25 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    パスワード
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setSelectedRole(null);
                    }}
                    autoComplete="current-password"
                    disabled={loading}
                    className="tc-login-input w-full border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400/25 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder=""
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="tc-login-submit w-full border border-slate-900 bg-slate-900 px-4 py-3.5 text-sm font-medium tracking-wide text-white outline-none transition-[background-color,border-color,opacity] duration-200 hover:bg-slate-800 hover:border-slate-800 active:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "処理中…" : "ログイン"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
