"use client";

import Link from "next/link";

export default function SessionInputPage() {
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">セッション入力</h1>
      <p className="text-zinc-400 mb-6">
        新しい「爆速UI」はこちらです。操作性を優先して画面を更新しました。
      </p>
      <Link
        href="/session-input"
        className="inline-flex items-center px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
      >
        新UIへ移動 →
      </Link>
    </div>
  );
}





