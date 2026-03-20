"use client";

import { useState } from "react";

export default function SessionInputPage() {
  const [memberName, setMemberName] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">セッション入力</h1>
      <p className="text-zinc-400 mb-8">
        ここは暫定の入力画面です（将来的に予約/会員データと連携予定）
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-sm text-zinc-400 mb-2">会員名</label>
          <input
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="例）田中 太郎"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-2">メモ</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="実施内容、次回の宿題、注意点など"
            rows={6}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setMemberName("");
              setNotes("");
            }}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            クリア
          </button>
          <button
            type="button"
            onClick={() => {
              // 将来的にAPI連携（保存）に置き換える
              alert("保存しました（モック）");
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}





