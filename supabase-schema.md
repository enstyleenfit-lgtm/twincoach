# TwinCoach Supabase データベース設計書

このドキュメントは、TwinCoachアプリケーションで使用するSupabaseデータベースのテーブル設計を定義します。

## テーブル一覧

1. [members](#members) - 会員情報
2. [visits](#visits) - 訪問履歴
3. [interventions](#interventions) - 介入履歴
4. [tasks](#tasks) - タスク

---

## members

会員情報を格納するテーブル

### カラム定義

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | uuid | NOT NULL | gen_random_uuid() | 主キー |
| name | text | NOT NULL | - | 会員名 |
| plan | text | NOT NULL | - | プラン名（例: "Premium", "Standard", "デュアル月8"） |
| join_date | date | NOT NULL | - | 入会日 |
| last_visit_date | date | NOT NULL | - | 最終来店日 |
| visit_interval | text | NOT NULL | - | 来店間隔（例: "3 days"） |
| has_cancellation_history | boolean | NULL | false | キャンセル履歴の有無 |
| monthly_revenue | integer | NULL | - | 月額売上（円） |
| store_name | text | NOT NULL | - | 店舗名 |
| assigned_trainer | text | NULL | - | 担当トレーナー名 |
| notes | text | NULL | - | メモ・備考 |
| created_at | timestamptz | NOT NULL | now() | 作成日時 |
| updated_at | timestamptz | NOT NULL | now() | 更新日時 |

### インデックス

- `idx_members_store_name` ON `members` (`store_name`)
- `idx_members_assigned_trainer` ON `members` (`assigned_trainer`)
- `idx_members_last_visit_date` ON `members` (`last_visit_date`)

### リレーション

- `visits.member_id` → `members.id` (外部キー)
- `interventions.member_id` → `members.id` (外部キー)
- `tasks.member_id` → `members.id` (外部キー)

### SQL作成例

```sql
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan text NOT NULL,
  join_date date NOT NULL,
  last_visit_date date NOT NULL,
  visit_interval text NOT NULL,
  has_cancellation_history boolean DEFAULT false,
  monthly_revenue integer,
  store_name text NOT NULL,
  assigned_trainer text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_members_store_name ON members(store_name);
CREATE INDEX idx_members_assigned_trainer ON members(assigned_trainer);
CREATE INDEX idx_members_last_visit_date ON members(last_visit_date);
```

---

## visits

訪問履歴を格納するテーブル

### カラム定義

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | uuid | NOT NULL | gen_random_uuid() | 主キー |
| member_id | uuid | NOT NULL | - | 会員ID（外部キー） |
| visit_date | date | NOT NULL | - | 訪問日 |
| created_at | timestamptz | NOT NULL | now() | 作成日時 |

### インデックス

- `idx_visits_member_id` ON `visits` (`member_id`)
- `idx_visits_visit_date` ON `visits` (`visit_date`)

### リレーション

- `visits.member_id` → `members.id` (外部キー、ON DELETE CASCADE推奨)

### SQL作成例

```sql
CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_visits_member_id ON visits(member_id);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);
```

---

## interventions

介入履歴を格納するテーブル

### カラム定義

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | uuid | NOT NULL | gen_random_uuid() | 主キー |
| member_id | uuid | NOT NULL | - | 会員ID（外部キー） |
| type | text | NOT NULL | - | 介入タイプ（例: "reservation", "motivation", "lifestyle"） |
| title | text | NOT NULL | - | 介入タイトル |
| action | text | NULL | - | 実行アクション内容 |
| priority | text | NOT NULL | - | 優先度（"low", "medium", "high"） |
| status | text | NOT NULL | - | ステータス（"pending", "in progress", "completed"） |
| trainer | text | NULL | - | 実行トレーナー名 |
| created_at | timestamptz | NOT NULL | now() | 作成日時 |
| updated_at | timestamptz | NOT NULL | now() | 更新日時 |

### インデックス

- `idx_interventions_member_id` ON `interventions` (`member_id`)
- `idx_interventions_status` ON `interventions` (`status`)
- `idx_interventions_created_at` ON `interventions` (`created_at`)

### リレーション

- `interventions.member_id` → `members.id` (外部キー、ON DELETE CASCADE推奨)

### SQL作成例

```sql
CREATE TABLE interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  action text,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL CHECK (status IN ('pending', 'in progress', 'completed')),
  trainer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_interventions_member_id ON interventions(member_id);
CREATE INDEX idx_interventions_status ON interventions(status);
CREATE INDEX idx_interventions_created_at ON interventions(created_at);
```

---

## tasks

タスクを格納するテーブル

### カラム定義

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | uuid | NOT NULL | gen_random_uuid() | 主キー |
| member_id | uuid | NOT NULL | - | 会員ID（外部キー） |
| member_name | text | NOT NULL | - | 会員名（検索用、非正規化） |
| action | text | NOT NULL | - | アクション内容 |
| status | text | NOT NULL | - | ステータス（"pending", "in progress", "done"） |
| assigned_trainer | text | NOT NULL | - | 担当トレーナー名 |
| due_date | date | NOT NULL | - | 期限日 |
| created_at | timestamptz | NOT NULL | now() | 作成日時 |
| updated_at | timestamptz | NOT NULL | now() | 更新日時 |

### インデックス

- `idx_tasks_member_id` ON `tasks` (`member_id`)
- `idx_tasks_status` ON `tasks` (`status`)
- `idx_tasks_assigned_trainer` ON `tasks` (`assigned_trainer`)
- `idx_tasks_due_date` ON `tasks` (`due_date`)

### リレーション

- `tasks.member_id` → `members.id` (外部キー、ON DELETE CASCADE推奨)

### SQL作成例

```sql
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_name text NOT NULL,
  action text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'in progress', 'done')),
  assigned_trainer text NOT NULL,
  due_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_member_id ON tasks(member_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_trainer ON tasks(assigned_trainer);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

---

## 補足事項

### 計算フィールドについて

以下のフィールドは、Supabaseでは保存せず、アプリケーション側で計算します：

- `riskScore`: `calculateRiskScore()` 関数で計算
- `interventionStatus`: `calculateRiskScore()` の結果から導出
- `recommendedIntervention`: `getInterventionSuggestion()` 関数で計算

### 拡張フィールドについて

以下のフィールドは、現在のモックデータには存在しますが、Supabaseテーブルには含めていません。
必要に応じて後から追加できます：

- `preferredTimeSlot`, `bookedTimeSlot`, `reservationDifficultyLevel` (予約分析用)
- `preferredWeekday`, `preferredHour` (予約分析用)
- `currentPlan`, `recommendedNextPlan`, `trainingFitScore`, `pilatesFitScore` (デュアル移行最適化用)
- `isPriceRevisionTarget`, `priceRevisionBeforeRevenue`, `priceRevisionAfterRevenue` (価格改定影響モニター用)

これらは必要に応じて別テーブルとして管理するか、JSONBカラムとして追加することを推奨します。

### Row Level Security (RLS)

本番環境では、Row Level Securityを有効にして適切なポリシーを設定してください。

```sql
-- 例: membersテーブルにRLSを有効化
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 例: 認証済みユーザーのみアクセス可能
CREATE POLICY "Authenticated users can view members"
  ON members FOR SELECT
  TO authenticated
  USING (true);
```

### マイグレーション手順

1. SupabaseダッシュボードでSQL Editorを開く
2. 上記のSQL作成例を順番に実行
3. インデックスを作成
4. RLSポリシーを設定（必要に応じて）
5. 環境変数 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
6. アプリケーションを再起動



