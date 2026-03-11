export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">TwinCoach</h1>
          <p className="text-zinc-400 text-sm">継続率改善と経営判断を支援するジム管理OS</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-8 shadow-xl shadow-black/40">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">TwinCoachへログイン</h2>
            <p className="text-zinc-500 text-xs">
              本部、店舗責任者、トレーナーの方は、こちらからログインしてください。
            </p>
          </div>

          <form className="space-y-5">
            <div>
              <label className="block text-zinc-400 text-xs mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                className="w-full bg-black border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs mb-2">
                パスワード
              </label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className="w-full bg-black border border-zinc-800 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="button"
              className="w-full mt-2 px-4 py-2.5 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-400 transition-colors border border-blue-400/70"
            >
              ログイン
            </button>

            <p className="text-[11px] text-zinc-500 mt-3 text-center">
              ※ 現在はダミー画面です。将来的に Supabase Auth と連携して本認証を行います。
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}


