import type { ReactNode } from "react";

export function StoreLockedScreen(props: {
  storeName: string;
  contractStatus: string;
  children?: ReactNode;
}) {
  const { storeName, contractStatus, children } = props;
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-6">
        <div className="text-xs text-slate-500">現在の店舗</div>
        <div className="mt-1 text-2xl font-bold text-slate-900">{storeName}</div>
        <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1 text-xs text-slate-700">
          contract_status: <span className="ml-2 font-semibold">{contractStatus}</span>
        </div>

        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="text-amber-900 font-semibold">この店舗は現在未契約です</div>
          <div className="mt-2 text-sm text-amber-900/80 leading-relaxed">
            契約すると会員ログ、継続率分析、食事管理などの機能が利用できます。
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-xl border border-slate-200 bg-white/30 p-4">
            <div className="text-sm font-semibold text-slate-800">契約すると使える機能</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>・会員一覧/会員詳細（個人情報）</li>
              <li>・行動ログ/介入履歴/内部メモ</li>
              <li>・継続率の実データ/分析詳細</li>
              <li>・食事管理（写真など）</li>
            </ul>
          </div>
          {children ? (
            <div className="rounded-xl border border-slate-200 bg-white/20 p-4">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

