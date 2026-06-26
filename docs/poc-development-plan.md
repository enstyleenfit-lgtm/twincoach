# TwinCoach PoC 開発設計ドキュメント

> バージョン：2026-06-26  
> 作成目的：MOC版をベースにPoC版レイヤーを追加するための開発タスクと設計方針の整理  
> 前提：アプリの全面作り直しはしない。MOC画面を壊さず、PoC用機能を最小限追加する。

---

## 1. 現在のMOC版の位置づけ

### MOC版とは何か

現在のTwinCoachは「見せるためのMOC（モックアップ）」として完成している。

| 項目 | 現状 |
|---|---|
| データ | `lib/mockData.ts` 等の静的モックデータ |
| 保存 | `localStorage` のみ（リロードすると消える） |
| 認証 | NextAuth + Credentials（ロール切り替え可能なデモ） |
| 権限制御 | ロール別ルーティングはある。データスコープの実装は部分的 |
| CSV取り込み | 実装済み（会員CSV、hacomono想定CSV、セッションCSV） |
| DB連携 | Supabase接続コードは存在するが未確定部分あり |

### MOC版でできていること

- HQ / Owner / Store のロール別画面遷移
- 会員一覧・詳細・リスクスコア・LTV（フロント計算）
- セッション入力（スマホ対応済み）
- 在庫申請フォーム（Store / Owner）
- 応援掲示板募集フォーム（HQ）
- 通知・設定・ログアウト

### MOC版でできていないこと

- 入力データの永続保存（リロードで消える）
- CSV取り込みデータのDB保存（会員CSVは対応済みだが他は未確定）
- 本番個人情報の安全な取り扱い
- 利用状況ログの収集
- poc mode / demo mode の切り替え制御

---

## 2. PoC版で必要な機能

PoC版は「実際に少人数の店舗で数週間使える」状態を目指す。全機能の本番化ではなく、価値検証に必要な最小限の機能を安定させることが目的。

### PoC版で必ず必要な機能

| 機能 | 現状 | 対応内容 |
|---|---|---|
| 会員CSVの取り込みと永続化 | 実装済み（Supabase対応） | CSV形式の確定・テスト |
| 来店履歴CSVの取り込みと保存 | プレビューのみ | DB保存処理の実装 |
| セッション入力の永続保存 | localStorage のみ | Supabase保存処理 |
| リスクスコア・LTVの表示 | フロント計算済み | 精度確認・CSV反映 |
| ロール別データスコープの強化 | 部分的 | storeロールで自店舗データのみ取得確認 |
| poc mode の識別 | なし | モード変数・表示ラベルの追加 |
| 利用状況ログ | なし | PoC期間中の操作記録 |

### PoC版で補助的に必要な機能

| 機能 | 優先度 | 備考 |
|---|---|---|
| 在庫申請の永続保存 | 中 | PoC店舗の要望次第 |
| 応援掲示板の永続保存 | 中 | FC機能の価値検証用 |
| CSV取り込み履歴の記録 | 高 | 誰がいつ取り込んだかを追跡するため |

### PoC版では不要な機能

- hacomono API連携（PoC後に検討）
- 操作監査ログ（本導入前に設計）
- 全テーブルの本番DB化
- リアルタイム同期
- FC精算・チャット機能

---

## 3. demo mode / poc mode の考え方

### モード定義

| モード | 説明 | データ | 対象 |
|---|---|---|---|
| `demo` | MOC用。ダミーデータで画面を見せる | `lib/mockData.ts` の静的データ | 提案・デモ・社内確認 |
| `poc` | PoC用。実CSV/限定データで運用する | CSV取り込みデータ / Supabase | PoC参加店舗 |

### モード切り替えの設計方針

**環境変数で制御する（推奨）**

```
# .env.local
NEXT_PUBLIC_APP_MODE=demo   # または poc
```

- `demo` モード：`lib/mockData.ts` から読み込む
- `poc` モード：SupabaseまたはCSV取り込みデータから読み込む

**切り替えの影響範囲**

```
src/lib/dataMode.ts （新規作成）
  ↓ APP_MODE を読み取り
  ↓ getMembersForStore() などのデータ取得関数に渡す
  ↓ demo → mockData を返す / poc → Supabase/CSV データを返す
```

### PoC期間中の運用イメージ

- デモ環境（Vercel production）は `demo` モードのまま維持
- PoC環境は別 Vercel プロジェクトまたは preview URL で `poc` モードを使う
- 同じコードベースで両モードが共存する

---

## 4. 必要なCSVフォーマット

### 4-1. 会員情報CSV（最小構成）

既存の `csvParser.ts` / `hacomonoCsvMapper.ts` で対応済み。  
PoCでは以下の項目に絞る。

**TwinCoach標準CSV形式**

```csv
name,plan,lastVisit,visitInterval,storeName,assignedTrainer,hasCancellationHistory,monthlyRevenue,joinDate
田中太郎,スタンダード,2026-06-20,7,渋谷店,山田,false,15000,2024-04-01
```

| カラム | 型 | 必須 | 備考 |
|---|---|---|---|
| `name` | string | ◎ | 氏名（PoCではイニシャル可） |
| `plan` | string | ◎ | プラン名 |
| `lastVisit` | YYYY-MM-DD | ◎ | 最終来店日（リスク計算の入力値） |
| `visitInterval` | number | ◎ | 平均来店間隔（日数） |
| `storeName` | string | ◎ | 店舗名（スコープ制御に使用） |
| `assignedTrainer` | string | 任意 | 担当トレーナー名 |
| `hasCancellationHistory` | boolean | 任意 | 過去解約歴（`true`/`false`） |
| `monthlyRevenue` | number | 任意 | 月額売上（円） |
| `joinDate` | YYYY-MM-DD | 任意 | 入会日 |

**含めないもの（PoC初期）**

- 電話番号・住所・メールアドレス
- 決済情報・支払い明細
- チャット内容・会話記録

---

### 4-2. 来店履歴CSV

```csv
memberId,visitDate
member_001,2026-06-20
member_001,2026-06-13
```

| カラム | 型 | 必須 | 備考 |
|---|---|---|---|
| `memberId` | string | ◎ | 会員CSVの名前またはID |
| `visitDate` | YYYY-MM-DD | ◎ | 来店日 |

- 直近3〜6ヶ月分に絞る
- `memberName` での紐付けも許容（ID未設定の場合）

---

### 4-3. セッション履歴CSV（過去記録の取り込み用）

```csv
memberName,sessionDate,menuSummary,conversationSummary,nextAction,trainerName,storeName
田中太郎,2026-06-20,ベンチプレス 3x10 80kg,フォームを改善中,次回は90kgに挑戦,山田,渋谷店
```

| カラム | 型 | 必須 | 備考 |
|---|---|---|---|
| `memberName` | string | ◎ | 会員名 |
| `sessionDate` | YYYY-MM-DD | ◎ | セッション日 |
| `menuSummary` | string | ◎ | トレーニングメニュー概要 |
| `conversationSummary` | string | 任意 | 会話サマリー |
| `nextAction` | string | 任意 | 次回アクション |
| `trainerName` | string | 任意 | 担当トレーナー名 |
| `storeName` | string | 任意 | 店舗名 |

---

## 5. 必要なデータ型

PoCで実際に保存・取得するデータの TypeScript 型定義（設計たたき台）。

```typescript
// PoC会員（最小構成）
type PocMember = {
  id: string;
  name: string;
  plan: string;
  lastVisitDate: string; // YYYY-MM-DD
  visitInterval: number;
  storeId: string;
  storeName: string;
  assignedTrainer?: string;
  hasCancellationHistory?: boolean;
  monthlyRevenue?: number;
  joinDate?: string;
  importedAt: string; // CSVインポート日時
};

// 来店履歴
type PocVisit = {
  id: string;
  memberId: string;
  visitDate: string; // YYYY-MM-DD
  storeId: string;
  importedAt: string;
};

// セッション記録（保存対象）
type PocSessionRecord = {
  id: string;
  memberId: string;
  memberName: string;
  storeId: string;
  storeName: string;
  trainerName: string;
  sessionDate: string; // YYYY-MM-DD
  menuSummary: string;
  conversationSummary?: string;
  nextAction?: string;
  tags?: string[];
  savedAt: string; // 保存日時
  savedBy: string; // ユーザーID or トレーナー名
};

// 在庫申請（保存対象）
type PocInventoryRequest = {
  id: string;
  storeId: string;
  storeName: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  requestedBy: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

// 応援掲示板（保存対象）
type PocHelpRequest = {
  id: string;
  storeId: string;
  storeName: string;
  title: string;
  description: string;
  requiredDate?: string;
  status: 'open' | 'filled' | 'closed';
  createdAt: string;
  createdBy: string;
};

// 利用状況ログ
type PocActivityLog = {
  id: string;
  userId: string;
  role: 'hq' | 'owner' | 'store';
  storeId?: string;
  action: PocActionType;
  screen: string;
  detail?: string;
  occurredAt: string;
};

type PocActionType =
  | 'login'
  | 'logout'
  | 'view_dashboard'
  | 'view_member_list'
  | 'view_member_detail'
  | 'submit_session'
  | 'submit_inventory_request'
  | 'submit_help_request'
  | 'import_csv'
  | 'view_task_list'
  | 'complete_task';
```

---

## 6. セッション入力保存の方針

### 現状

`localStorage` に保存。リロード後も一覧に表示されるが、他デバイス・他ブラウザでは見えない。

### PoC版の方針

- Supabase の `session_records` テーブルに保存する
- 保存前に `storeId`・`savedBy`（ログインユーザー）を自動セット
- `poc` モードのみ Supabase 保存。`demo` モードは `localStorage` を継続

### 実装時の注意

- セッション入力画面は現在スマホ最適化済み。UIは変更しない
- 保存ボタン押下時に Supabase INSERT を実行する処理を追加するのみ
- エラー時はトースト表示。データ消失しないよう `localStorage` にも一時保持する

### 保存対象フィールド

セッション入力フォームで入力できる全フィールドを保存する。  
`conversationNotes`（詳細メモ）はセンシティブ。PoCでは任意入力に留める。

---

## 7. 在庫申請保存の方針

### 現状

`localRequests`（`useState`）で管理。リロードで消える。

### PoC版の方針

- Supabase の `inventory_requests` テーブルに保存する
- `storeId`・`requestedBy` を自動セット
- Store ロールは自店舗の申請のみ表示（`getAllForStore()`）
- HQ / Owner ロールは管轄店舗の申請を一覧表示

### ステータス管理

```
pending → approved / rejected
```

- Store が申請 → `pending`
- HQ / Owner が承認 → `approved`
- HQ / Owner が差し戻し → `rejected`

HQ 側の承認UIはPoC初期では簡易実装（ステータス変更ボタンのみ）で可。

---

## 8. 応援掲示板保存の方針

### 現状

`localRequests`（`useState`）で管理。HQ側フォームで即時追加するが保存されない。

### PoC版の方針

- Supabase の `help_requests` テーブルに保存する
- `createdBy`（HQ ユーザー）を自動セット
- Store ロールは閲覧のみ（応募ボタン押下記録はPoC後に検討）
- HQ は全掲示板を管理（作成・クローズ）

### PoC初期の最小実装

- HQ が募集を作成 → Supabase に保存
- Store が掲示板一覧を閲覧 → Supabase から取得
- 応募処理はPoC期間中はモックで可（「応募する」ボタン押下ログを記録する程度）

---

## 9. ロール別権限強化の方針

### 現状の課題

- Storeロールで `getAll()` による全件取得が残っている箇所がある
- ロール判定はルーティングレベルで実装済みだが、データ取得レベルの制御が不完全

### PoC版で確認・強化する項目

| チェック項目 | 対応方針 |
|---|---|
| Store ロールの会員一覧 | `storeId` でフィルタした `getAllForStore()` のみ |
| Store ロールのセッション履歴 | 自店舗のセッションのみ返す |
| Store ロールのタスク一覧 | 自店舗タスクのみ返す |
| Store ロールのCSV取り込み | 自店舗の会員CSVのみ取り込み可能 |
| Owner ロールの管轄店舗外データ | 管轄店舗以外のデータを返さない |
| HQ ロールの全店舗データ | 全取得は HQ のみ許可 |

### 実装方針

```typescript
// データ取得の入口で必ずロールチェックを行う
function getMembers(session: Session): Member[] {
  if (session.user.role === 'store') {
    return getMembersForStore(session.user.storeId);
  }
  if (session.user.role === 'owner') {
    return getMembersForOwner(session.user.ownerId);
  }
  return getAllMembers(); // HQ のみ
}
```

---

## 10. PoC利用状況ログの方針

### 目的

PoCの「使われているか」を可視化し、PoC結果レポートの根拠データにする。

### 記録対象アクション

| アクション | 記録タイミング |
|---|---|
| `login` | ログイン成功時 |
| `view_dashboard` | ダッシュボード表示時 |
| `view_member_list` | 会員一覧表示時 |
| `view_member_detail` | 会員詳細表示時 |
| `submit_session` | セッション保存成功時 |
| `submit_inventory_request` | 在庫申請送信時 |
| `import_csv` | CSVインポート実行時 |
| `complete_task` | タスク完了ボタン押下時 |

### 実装方針

- Supabase の `poc_activity_logs` テーブルに記録
- 画面コンポーネントの `useEffect` または アクション完了後に `logActivity()` を呼び出す
- ユーザーID・ロール・店舗ID・アクション名・日時を必ず記録する
- 個人情報（会員名・会話内容など）はログに含めない

```typescript
// lib/pocLogger.ts（新規作成）
async function logActivity(action: PocActionType, detail?: string) {
  if (process.env.NEXT_PUBLIC_APP_MODE !== 'poc') return;
  // Supabase INSERT
}
```

---

## 11. PoC結果集計の方針

### 集計するデータ

| 指標 | 集計方法 |
|---|---|
| ログイン回数（ロール別） | `poc_activity_logs` を集計 |
| セッション入力件数（店舗別） | `session_records` を集計 |
| CSV取り込み回数 | `poc_activity_logs` の `import_csv` を集計 |
| タスク完了率 | `tasks` テーブルのステータス集計 |
| 会員閲覧数 | `view_member_detail` ログを集計 |
| ダッシュボード閲覧頻度 | `view_dashboard` ログを集計 |

### 集計画面の設計

- HQ ロールのみアクセスできる管理ページに簡易集計を表示する
- `/admin/poc-summary` などの URL（PoC中のみ有効）
- 棒グラフ or テーブル表示で十分。高度な可視化はPoC後に検討

### PoC結果レポートへの連携

→ `docs/twincoach-poc-result-report-template.md` を参照

---

## 12. セキュリティ/個人情報の扱い

### PoCで扱う個人情報の範囲

| 項目 | 扱う | 扱わない |
|---|---|---|
| 氏名（またはイニシャル） | ◎（最小限） | |
| プラン名 | ◎ | |
| 来店日 | ◎ | |
| 電話番号 | | ✕ |
| 住所 | | ✕ |
| メールアドレス | | ✕ |
| 決済情報 | | ✕ |
| チャット内容 | | ✕ |
| 会話メモ（詳細） | 任意のみ | |

### Supabase セキュリティ設定

- Row Level Security（RLS）を必ず有効にする
- `storeId` に基づいたアクセス制御ポリシーを設定する
- API キーは `.env.local` で管理し、リポジトリに含めない

### デモと本番の分離

| 環境 | APP_MODE | DB | 個人情報 |
|---|---|---|---|
| Vercel production | `demo` | mockData のみ | なし |
| PoC環境（別ブランチ/Vercel） | `poc` | Supabase（限定データ） | 最小限 |
| 開発環境（ローカル） | `demo` or `poc` | ローカルまたはテストDB | ダミーデータ |

---

## 13. 優先順位

### 高（PoC価値検証の核）

1. セッション入力の Supabase 永続化
2. 会員CSVと来店履歴CSVの保存確認
3. storeロールのデータスコープ確認・修正
4. `poc_activity_logs` の基本実装
5. `APP_MODE` 環境変数による demo/poc 切り替え

### 中（PoCをより良くする）

6. 在庫申請の Supabase 永続化
7. 応援掲示板の Supabase 永続化
8. CSV取り込み履歴の記録
9. PoC簡易集計ページ（`/admin/poc-summary`）

### 低（PoC後に検討）

10. hacomono API 連携
11. 操作監査ログ（本番用）
12. エラー監視・アラート
13. 全テーブルの本番DB化

---

## 14. 27日前（2026-06-27 MTG前）にやること

> 目的：MTGで「PoCに進む判断」と「開発計画の説明」ができる状態にする

### 開発タスク（なし）

27日前はアプリ変更をしない。

### 準備タスク

- [ ] 本ドキュメント（`docs/poc-development-plan.md`）の内容を確認・補足
- [ ] `docs/twincoach-20260627-poc-meeting-draft.md` の内容と整合を確認
- [ ] デモ画面（https://twincoach.vercel.app/）が正常に動作するか確認
- [ ] 以下のロールでのデモ動線を手動確認する
  - HQ：ダッシュボード → 店舗詳細 → 会員詳細
  - Store：セッション入力 → 在庫申請
  - Owner：管轄店舗ダッシュボード
- [ ] MTGでCSV項目の確認が必要かどうかを先方に事前確認する

---

## 15. PoC決定後にやること

> 目的：実際のPoC運用ができる状態にする（1〜2週間の実装期間を想定）

### Step 1：環境設定

- [ ] `APP_MODE` 環境変数の追加（`demo` / `poc`）
- [ ] Supabase PoC用プロジェクトの作成（または既存プロジェクトのPoC環境）
- [ ] RLS ポリシーの設定
- [ ] PoC用 Vercel 環境の作成（または preview URL での運用）

### Step 2：データ基盤

- [ ] CSV項目の最終確認（対象店舗と合わせる）
- [ ] `members` テーブルのCSV取り込み動作確認
- [ ] `visits` テーブルの来店履歴CSV保存実装
- [ ] 初期データの投入（対象1〜2店舗、会員10〜30名）

### Step 3：入力保存

- [ ] セッション入力の Supabase 保存実装
- [ ] セッション一覧・会員詳細でのセッション履歴表示
- [ ] 在庫申請の Supabase 保存実装（任意）
- [ ] 応援掲示板の Supabase 保存実装（任意）

### Step 4：権限確認

- [ ] storeロールの全データスコープチェック（`getAllForStore()` 徹底）
- [ ] ownerロールの管轄店舗外データアクセス確認
- [ ] CSVインポートのロール別制限確認

### Step 5：ログ

- [ ] `poc_activity_logs` テーブル作成
- [ ] ログイン・セッション入力・ダッシュボード閲覧のログ記録実装

### Step 6：確認

- [ ] スマホ・PCで全ロールの主要操作を手動テスト
- [ ] PoC対象ユーザーへのアカウント発行・説明
- [ ] 運用ルールの共有（入力タイミング・フィードバック方法）

---

## 16. 本導入前にやること

> 目的：PoCの結果を踏まえて、本番サービスとして成立する状態にする

### データ設計

- [ ] 全テーブル定義の確定（型・制約・インデックス）
- [ ] hacomono API 連携設計（PoC後に必要性が確認されたデータから）
- [ ] CSV → API 移行計画の策定

### 権限・セキュリティ

- [ ] RLS ポリシーの本番設計
- [ ] 個人情報取り扱い方針の文書化
- [ ] 操作監査ログの実装
- [ ] エラー監視・アラート設定（Vercel / Supabase）

### 運用

- [ ] 操作マニュアルの作成（ロール別）
- [ ] バックアップ・復旧手順の確認
- [ ] 不具合報告・対応フローの整備

### 契約・法的

- [ ] 契約形態の確定（請負 / 準委任）
- [ ] 個人情報の取り扱い同意書
- [ ] SLA・保守範囲の定義

→ 詳細は `docs/twincoach-production-readiness-checklist.md` を参照

---

## 関連ドキュメント

| ドキュメント | 内容 |
|---|---|
| `docs/twincoach-design-documents-index.md` | 設計資料一覧・全体構成 |
| `docs/twincoach-crud-table-list.md` | テーブル定義・CRUD権限 |
| `docs/twincoach-csv-api-checklist.md` | CSVインポート仕様・API連携方針 |
| `docs/twincoach-poc-rollout-schedule.md` | PoC導入スケジュール |
| `docs/twincoach-poc-evaluation-metrics.md` | PoC評価指標 |
| `docs/twincoach-poc-result-report-template.md` | PoC結果レポートテンプレート |
| `docs/twincoach-production-readiness-checklist.md` | 本導入前チェックリスト |
| `docs/twincoach-permission-overview.md` | ロール別権限概要 |

---

## まとめ

TwinCoachのPoC化は「全面作り直し」ではなく「MOCに最小限のPoC層を追加する」アプローチで進める。

1. **環境変数（`APP_MODE`）でdemo/pocを分離**し、MOC画面を壊さない
2. **セッション入力・CSV取り込みの永続保存**から着手する
3. **storeロールのデータスコープ**を徹底確認してからPoC開始する
4. **利用状況ログ**を記録し、PoC結果を数値で説明できる状態にする
5. hacomono API連携・全テーブル本番化はPoC後に判断する
