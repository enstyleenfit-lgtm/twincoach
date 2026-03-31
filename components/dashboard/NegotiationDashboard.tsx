import Link from "next/link";
import type { Member, HQActionPlan } from "@/types";
import type { ChurnPrediction } from "@/lib/churnPrediction";

export type PriorityTodayRow = {
  id: string;
  name: string;
  probability30Days: number;
  churnTags: string[];
  nextTitle: string;
  nextDescShort: string;
};

export type ChurnRankRow = {
  member: Member;
  prediction: ChurnPrediction;
  expectedLoss30Days: number;
};

export type PitchStoreRow = {
  storeName: string;
  estimatedRetentionRate: number;
  highRiskMembers: number;
  expectedLoss30Days: number;
};

type Props = {
  memberCount: number;
  estimatedRetentionRate: number;
  highRiskCount: number;
  nextMonthLoss: number;
  priorityToday: PriorityTodayRow[];
  churnRanking: ChurnRankRow[];
  revenueRisk: {
    loss30: number;
    loss60: number;
    annualDanger: number;
    membersToDefend: number;
  };
  topStores: PitchStoreRow[];
  hqPlan: HQActionPlan;
};

function formatYen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

function hqPriorityClass(label: HQActionPlan["priorityLabel"]): string {
  switch (label) {
    case "high":
      return "text-red-600 bg-red-500/10 border-red-500/30";
    case "medium":
      return "text-amber-300 bg-amber-500/10 border-amber-500/30";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function NegotiationDashboard({
  memberCount,
  estimatedRetentionRate,
  highRiskCount,
  nextMonthLoss,
  priorityToday,
  churnRanking,
  revenueRisk,
  topStores,
  hqPlan,
}: Props) {
  return (
    <div className="space-y-20 pb-8">
      {/* 1. Hero + KPI */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-zinc-900/90 to-zinc-950 px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-red-500/5 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_minmax(0,1.1fr)] lg:items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              TwinCoach
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-700 sm:text-xl">
              継続率改善と収益防衛を支援するジム経営OS
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
              守るべき会員・売上・店舗課題を可視化します
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-5">
              <div className="text-xs font-medium text-slate-500">会員数</div>
              <div className="mt-2 text-3xl font-bold tabular-nums text-slate-900 sm:text-4xl">
                {memberCount}
              </div>
              <div className="mt-1 text-xs text-slate-600">名</div>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-4 py-5">
              <div className="text-xs font-medium text-emerald-700/90">推定継続率</div>
              <div className="mt-2 text-3xl font-bold tabular-nums text-emerald-700 sm:text-4xl">
                {estimatedRetentionRate}
                <span className="text-lg font-semibold">%</span>
              </div>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-5">
              <div className="text-xs font-medium text-red-700/90">高リスク会員</div>
              <div className="mt-2 text-3xl font-bold tabular-nums text-red-600 sm:text-4xl">
                {highRiskCount}
              </div>
              <div className="mt-1 text-xs text-red-600/50">名</div>
            </div>
            <div className="rounded-xl border border-red-500/35 bg-red-950/25 px-4 py-5">
              <div className="text-xs font-medium text-red-200/80">来月失う可能性のある売上</div>
              <div className="mt-2 text-2xl font-bold tabular-nums leading-tight text-red-600 sm:text-3xl">
                {formatYen(nextMonthLoss)}
              </div>
              <div className="mt-1 text-[11px] text-red-600/50">30日期待損失の合計</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 最重要KPI（大） */}
      <section aria-label="最重要KPI">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">最重要KPI</h2>
          <p className="text-sm text-slate-500">経営判断用の主要指標</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-100/90 px-6 py-8">
            <p className="text-sm font-medium text-slate-500">会員数</p>
            <p className="mt-3 text-5xl font-bold tabular-nums tracking-tight text-slate-900">
              {memberCount}
            </p>
            <p className="mt-2 text-xs text-slate-600">登録会員の総数</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 px-6 py-8">
            <p className="text-sm font-medium text-emerald-700/90">推定継続率</p>
            <p className="mt-3 text-5xl font-bold tabular-nums tracking-tight text-emerald-700">
              {estimatedRetentionRate}
              <span className="text-2xl font-bold">%</span>
            </p>
            <p className="mt-2 text-xs text-emerald-500/50">低・中リスク会員の割合</p>
          </div>
          <div className="rounded-2xl border border-red-500/25 bg-red-950/20 px-6 py-8">
            <p className="text-sm font-medium text-red-700">高リスク会員数</p>
            <p className="mt-3 text-5xl font-bold tabular-nums tracking-tight text-red-600">
              {highRiskCount}
            </p>
            <p className="mt-2 text-xs text-red-600/45">即時フォローが必要な層</p>
          </div>
          <div className="rounded-2xl border border-red-500/30 bg-red-950/25 px-6 py-8">
            <p className="text-sm font-medium text-red-200">来月失う可能性のある売上</p>
            <p className="mt-3 text-4xl font-bold tabular-nums leading-none text-red-600 sm:text-5xl">
              {formatYen(nextMonthLoss)}
            </p>
            <p className="mt-2 text-xs text-red-600/45">30日期待損失・合算</p>
          </div>
        </div>
      </section>

      {/* 3. 今日の優先対応 */}
      <section className="rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-950/25 to-zinc-950 p-6 sm:p-10">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">今日の優先対応</h2>
          <p className="mt-2 text-sm text-slate-600">
            現場が今日使える優先5名。退会確率・理由タグ・次回提案の要点を一目で。
          </p>
        </div>
        {priorityToday.length === 0 ? (
          <p className="text-slate-500">対象会員はいません</p>
        ) : (
          <ul className="space-y-4">
            {priorityToday.map((row, i) => (
              <li
                key={row.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-5 sm:flex-row sm:items-stretch sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-lg font-bold text-red-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/members/${row.id}`}
                      className="text-lg font-semibold text-slate-900 hover:text-blue-700"
                    >
                      {row.name}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500">30日退会確率</span>
                      <span
                        className={`text-xl font-bold tabular-nums ${
                          row.probability30Days >= 60 ? "text-red-600" : "text-slate-800"
                        }`}
                      >
                        {row.probability30Days}%
                      </span>
                    </div>
                    {row.churnTags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {row.churnTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between border-t border-slate-200 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      次回提案AI
                    </p>
                    <p className="mt-1 font-medium text-slate-900">{row.nextTitle}</p>
                    {row.nextDescShort ? (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{row.nextDescShort}</p>
                    ) : null}
                  </div>
                  <Link
                    href={`/members/${row.id}`}
                    className="mt-4 inline-flex w-fit items-center text-sm font-medium text-blue-700 hover:text-blue-800"
                  >
                    詳細を見る →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. 退会予測ランキング */}
      <section>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">退会予測ランキング</h2>
          <p className="mt-2 text-sm text-slate-500">30日・60日確率と想定損失が高い順（上位5名）</p>
        </div>
        {churnRanking.length === 0 ? (
          <p className="text-slate-500">データがありません</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-1">
            {churnRanking.map(({ member, prediction, expectedLoss30Days }, i) => (
              <div
                key={member.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/40 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-slate-600">#{i + 1}</span>
                  <div>
                    <Link
                      href={`/members/${member.id}`}
                      className="text-lg font-semibold text-slate-900 hover:text-blue-700"
                    >
                      {member.name}
                    </Link>
                    <p className="text-sm text-slate-500">{member.plan}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 sm:gap-10">
                  <div>
                    <p className="text-xs text-slate-500">30日</p>
                    <p className="text-xl font-bold tabular-nums text-red-600">
                      {prediction.probability30Days}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">60日</p>
                    <p className="text-xl font-bold tabular-nums text-orange-700/90">
                      {prediction.probability60Days}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">想定損失額（目安）</p>
                    <p className="text-xl font-bold tabular-nums text-red-700">
                      {formatYen(expectedLoss30Days)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/members/${member.id}`}
                  className="shrink-0 text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  詳細を見る →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. 収益リスクAI */}
      <section>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">収益リスクAI</h2>
          <p className="mt-2 text-sm text-slate-500">退会確率ベースの損失試算と、守るべき会員規模</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 px-6 py-8">
            <p className="text-sm text-red-200/90">来月失う可能性のある売上</p>
            <p className="mt-3 text-4xl font-bold tabular-nums text-red-600">
              {formatYen(revenueRisk.loss30)}
            </p>
          </div>
          <div className="rounded-2xl border border-red-500/25 bg-red-950/15 px-6 py-8">
            <p className="text-sm text-red-200/80">60日損失予測</p>
            <p className="mt-3 text-4xl font-bold tabular-nums text-red-600">
              {formatYen(revenueRisk.loss60)}
            </p>
          </div>
          <div className="rounded-2xl border border-red-500/20 bg-white px-6 py-8">
            <p className="text-sm text-slate-600">年間危険売上</p>
            <p className="mt-3 text-4xl font-bold tabular-nums text-red-600">
              {formatYen(revenueRisk.annualDanger)}
            </p>
            <p className="mt-1 text-xs text-slate-600">高リスク会員の年間売上合算</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8">
            <p className="text-sm text-slate-600">守るべき会員数</p>
            <p className="mt-3 text-4xl font-bold tabular-nums text-slate-900">
              {revenueRisk.membersToDefend}
            </p>
            <p className="mt-1 text-xs text-slate-600">中・高リスク（介入推奨層）</p>
          </div>
        </div>
      </section>

      {/* 6. 店舗別サマリー */}
      <section>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">店舗別サマリー</h2>
          <p className="mt-2 text-sm text-slate-500">損失見込みが大きい店舗から上位5店舗</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topStores.map((s) => (
            <Link
              key={s.storeName}
              href={`/store/${encodeURIComponent(s.storeName)}`}
              className="group rounded-2xl border border-slate-200 bg-slate-100/90 p-6 transition-colors hover:border-slate-300"
            >
              <p className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">
                {s.storeName}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">推定継続率</p>
                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    {Math.round(s.estimatedRetentionRate)}%
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">高リスク</p>
                  <p className="mt-1 text-xl font-bold text-red-600">{s.highRiskMembers}名</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">来月損失予測</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">
                    {formatYen(s.expectedLoss30Days)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. 本部向け改善提案AI */}
      <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 to-zinc-950 px-6 py-10 sm:px-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">本部向け改善提案AI</h2>
          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${hqPriorityClass(
              hqPlan.priorityLabel
            )}`}
          >
            優先度 {hqPlan.priorityLabel === "high" ? "高" : hqPlan.priorityLabel === "medium" ? "中" : "低"}
          </span>
        </div>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-400/90">
              最重要課題
            </p>
            <p className="mt-2 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
              {hqPlan.topIssue}
            </p>
            {hqPlan.summary ? (
              <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-600">
                {hqPlan.summary}
              </p>
            ) : null}
          </div>
          <div className="space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                今月やるべきこと
              </p>
              <ul className="mt-3 space-y-2">
                {hqPlan.actions.slice(0, 3).map((a, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-800">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-500/20 text-xs font-bold text-violet-300">
                      {i + 1}
                    </span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                優先対応店舗
              </p>
              {hqPlan.priorityStores.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">該当なし</p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {hqPlan.priorityStores.slice(0, 3).map((name) => (
                    <li key={name}>
                      <Link
                        href={`/store/${encodeURIComponent(name)}`}
                        className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 hover:border-violet-500/40 hover:text-violet-300"
                      >
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-200 pt-6">
          <Link
            href="/hq"
            className="text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            本部ダッシュボードで全文を見る →
          </Link>
        </div>
      </section>
    </div>
  );
}
