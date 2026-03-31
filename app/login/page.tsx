"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

    try {
      const supabase = createClientSupabase();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError("メールアドレスまたはパスワードが正しくありません");
        setLoading(false);
        return;
      }

      if (data.user) {
        // ログイン成功
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("ログインに失敗しました。もう一度お試しください");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">TwinCoach</h1>
          <p className="text-slate-600 text-sm">継続率改善と経営判断を支援するジム管理OS</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-md shadow-slate-900/10">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">TwinCoachへログイン</h2>
            <p className="text-slate-500 text-xs">
              本部、店舗責任者、トレーナーの方は、こちらからログインしてください。
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-600 text-xs mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-slate-600 text-xs mb-2">
                パスワード
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-4 py-2.5 text-sm font-medium rounded-md bg-blue-500 text-slate-900 hover:bg-blue-400 transition-colors border border-blue-400/70 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}



