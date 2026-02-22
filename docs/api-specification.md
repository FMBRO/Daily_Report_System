# 営業日報システム API仕様書

## 1. 文書情報

| 項目       | 内容                       |
| ---------- | -------------------------- |
| 文書名     | 営業日報システム API仕様書 |
| バージョン | 1.0                        |
| 作成日     | 2026-02-15                 |
| 最終更新日 | 2026-02-15                 |

---

## 2. API概要

### 2.1 基本情報

| 項目       | 内容                         |
| ---------- | ---------------------------- |
| ベースURL  | `https://api.example.com/v1` |
| プロトコル | HTTPS                        |
| データ形式 | JSON                         |
| 文字コード | UTF-8                        |

### 2.2 認証方式

Bearer Token認証（JWT）を使用

```
Authorization: Bearer <access_token>
```

### 2.3 共通レスポンス形式

#### 成功時

```json
{
  "success": true,
  "data": { ... }
}
```

#### エラー時

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### 2.4 共通HTTPステータスコード

| コード | 説明                 |
| ------ | -------------------- |
| 200    | 成功                 |
| 201    | 作成成功             |
| 400    | リクエスト不正       |
| 401    | 認証エラー           |
| 403    | 権限エラー           |
| 404    | リソース未検出       |
| 422    | バリデーションエラー |
| 500    | サーバーエラー       |

### 2.5 ページネーション

リスト取得APIは以下のクエリパラメータでページネーション可能

| パラメータ | 型      | デフォルト | 説明                           |
| ---------- | ------- | ---------- | ------------------------------ |
| page       | integer | 1          | ページ番号                     |
| per_page   | integer | 20         | 1ページあたりの件数（最大100） |

レスポンスにページネーション情報を含む：

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 5,
    "total_count": 100
  }
}
```

---

## 3. API エンドポイント一覧

| カテゴリ | メソッド | エンドポイント                | 説明                   |
| -------- | -------- | ----------------------------- | ---------------------- |
| 認証     | POST     | /auth/login                   | ログイン               |
| 認証     | POST     | /auth/logout                  | ログアウト             |
| 認証     | GET      | /auth/me                      | 現在のユーザー情報取得 |
| 日報     | GET      | /reports                      | 日報一覧取得           |
| 日報     | POST     | /reports                      | 日報作成               |
| 日報     | GET      | /reports/{id}                 | 日報詳細取得           |
| 日報     | PUT      | /reports/{id}                 | 日報更新               |
| 日報     | DELETE   | /reports/{id}                 | 日報削除               |
| 日報     | PATCH    | /reports/{id}/submit          | 日報提出               |
| 訪問     | GET      | /reports/{report_id}/visits   | 訪問一覧取得           |
| 訪問     | POST     | /reports/{report_id}/visits   | 訪問登録               |
| 訪問     | PUT      | /visits/{id}                  | 訪問更新               |
| 訪問     | DELETE   | /visits/{id}                  | 訪問削除               |
| Problem  | GET      | /reports/{report_id}/problems | Problem一覧取得        |
| Problem  | POST     | /reports/{report_id}/problems | Problem登録            |
| Problem  | PUT      | /problems/{id}                | Problem更新            |
| Problem  | DELETE   | /problems/{id}                | Problem削除            |
| Plan     | GET      | /reports/{report_id}/plans    | Plan一覧取得           |
| Plan     | POST     | /reports/{report_id}/plans    | Plan登録               |
| Plan     | PUT      | /plans/{id}                   | Plan更新               |
| Plan     | DELETE   | /plans/{id}                   | Plan削除               |
| コメント | GET      | /problems/{id}/comments       | Problemコメント取得    |
| コメント | POST     | /problems/{id}/comments       | Problemコメント投稿    |
| コメント | GET      | /plans/{id}/comments          | Planコメント取得       |
| コメント | POST     | /plans/{id}/comments          | Planコメント投稿       |
| コメント | DELETE   | /comments/{id}                | コメント削除           |
| 顧客     | GET      | /customers                    | 顧客一覧取得           |
| 顧客     | POST     | /customers                    | 顧客登録               |
| 顧客     | GET      | /customers/{id}               | 顧客詳細取得           |
| 顧客     | PUT      | /customers/{id}               | 顧客更新               |
| 顧客     | DELETE   | /customers/{id}               | 顧客削除               |
| 営業     | GET      | /salespersons                 | 営業一覧取得           |
| 営業     | POST     | /salespersons                 | 営業登録               |
| 営業     | GET      | /salespersons/{id}            | 営業詳細取得           |
| 営業     | PUT      | /salespersons/{id}            | 営業更新               |
| 営業     | DELETE   | /salespersons/{id}            | 営業削除               |

---

## 4. 認証 API

### 4.1 ログイン

ユーザー認証を行い、アクセストークンを取得する。

```
POST /auth/login
```

#### リクエスト

```json
{
  "email": "tanaka@example.com",
  "password": "password123"
}
```

| パラメータ | 型     | 必須 | 説明           |
| ---------- | ------ | ---- | -------------- |
| email      | string | Yes  | メールアドレス |
| password   | string | Yes  | パスワード     |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "salesperson_id": 1,
      "name": "田中 太郎",
      "email": "tanaka@example.com",
      "role": "sales"
    }
  }
}
```

#### エラーレスポンス（401 Unauthorized）

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "メールアドレスまたはパスワードが正しくありません"
  }
}
```

---

### 4.2 ログアウト

現在のセッションを終了する。

```
POST /auth/logout
```

#### ヘッダー

```
Authorization: Bearer <access_token>
```

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "message": "ログアウトしました"
  }
}
```

---

### 4.3 現在のユーザー情報取得

認証済みユーザーの情報を取得する。

```
GET /auth/me
```

#### ヘッダー

```
Authorization: Bearer <access_token>
```

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "salesperson_id": 1,
    "name": "田中 太郎",
    "email": "tanaka@example.com",
    "role": "sales",
    "manager": {
      "salesperson_id": 10,
      "name": "鈴木 部長"
    }
  }
}
```

---

## 5. 日報 API

### 5.1 日報一覧取得

日報の一覧を取得する。

```
GET /reports
```

#### クエリパラメータ

| パラメータ     | 型            | 必須 | 説明                          |
| -------------- | ------------- | ---- | ----------------------------- |
| salesperson_id | integer       | No   | 営業IDでフィルタ              |
| date_from      | string (date) | No   | 開始日（YYYY-MM-DD）          |
| date_to        | string (date) | No   | 終了日（YYYY-MM-DD）          |
| status         | string        | No   | ステータス（draft/submitted） |
| page           | integer       | No   | ページ番号                    |
| per_page       | integer       | No   | 1ページあたりの件数           |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": [
    {
      "report_id": 1,
      "salesperson": {
        "salesperson_id": 1,
        "name": "田中 太郎"
      },
      "report_date": "2026-02-15",
      "status": "submitted",
      "visit_count": 3,
      "problem_count": 1,
      "plan_count": 2,
      "created_at": "2026-02-15T09:00:00+09:00",
      "updated_at": "2026-02-15T18:00:00+09:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 5,
    "total_count": 100
  }
}
```

---

### 5.2 日報作成

新しい日報を作成する。

```
POST /reports
```

#### リクエスト

```json
{
  "report_date": "2026-02-15",
  "visits": [
    {
      "customer_id": 1,
      "visit_time": "10:00",
      "visit_purpose": "定期訪問",
      "visit_content": "新製品の提案を行った。担当者は興味を示している。",
      "result": "次回見積提出予定"
    }
  ],
  "problems": [
    {
      "content": "競合他社が価格攻勢をかけてきている",
      "priority": "high"
    }
  ],
  "plans": [
    {
      "content": "A社に見積書を提出する"
    }
  ]
}
```

| パラメータ  | 型            | 必須 | 説明                 |
| ----------- | ------------- | ---- | -------------------- |
| report_date | string (date) | Yes  | 報告日（YYYY-MM-DD） |
| visits      | array         | No   | 訪問記録の配列       |
| problems    | array         | No   | Problemの配列        |
| plans       | array         | No   | Planの配列           |

#### レスポンス（201 Created）

```json
{
  "success": true,
  "data": {
    "report_id": 1,
    "salesperson_id": 1,
    "report_date": "2026-02-15",
    "status": "draft",
    "created_at": "2026-02-15T09:00:00+09:00",
    "updated_at": "2026-02-15T09:00:00+09:00"
  }
}
```

#### エラーレスポンス（422 Unprocessable Entity）

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": {
      "report_date": ["この日付の日報は既に存在します"]
    }
  }
}
```

---

### 5.3 日報詳細取得

指定した日報の詳細を取得する。

```
GET /reports/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| id         | integer | 日報ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "report_id": 1,
    "salesperson": {
      "salesperson_id": 1,
      "name": "田中 太郎",
      "email": "tanaka@example.com"
    },
    "report_date": "2026-02-15",
    "status": "submitted",
    "visits": [
      {
        "visit_id": 1,
        "customer": {
          "customer_id": 1,
          "customer_name": "株式会社ABC"
        },
        "visit_time": "10:00",
        "visit_purpose": "定期訪問",
        "visit_content": "新製品の提案を行った。担当者は興味を示している。",
        "result": "次回見積提出予定"
      }
    ],
    "problems": [
      {
        "problem_id": 1,
        "content": "競合他社が価格攻勢をかけてきている",
        "priority": "high",
        "comments": [
          {
            "comment_id": 1,
            "commenter": {
              "salesperson_id": 10,
              "name": "鈴木 部長"
            },
            "content": "来週のミーティングで対策を検討しましょう",
            "created_at": "2026-02-15T19:00:00+09:00"
          }
        ]
      }
    ],
    "plans": [
      {
        "plan_id": 1,
        "content": "A社に見積書を提出する",
        "comments": []
      }
    ],
    "created_at": "2026-02-15T09:00:00+09:00",
    "updated_at": "2026-02-15T18:00:00+09:00"
  }
}
```

---

### 5.4 日報更新

指定した日報を更新する。

```
PUT /reports/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| id         | integer | 日報ID |

#### リクエスト

```json
{
  "report_date": "2026-02-15"
}
```

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "report_id": 1,
    "salesperson_id": 1,
    "report_date": "2026-02-15",
    "status": "draft",
    "updated_at": "2026-02-15T18:00:00+09:00"
  }
}
```

---

### 5.5 日報削除

指定した日報を削除する。

```
DELETE /reports/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| id         | integer | 日報ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "message": "日報を削除しました"
  }
}
```

---

### 5.6 日報提出

日報のステータスを「提出済み」に変更する。

```
PATCH /reports/{id}/submit
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| id         | integer | 日報ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "report_id": 1,
    "status": "submitted",
    "submitted_at": "2026-02-15T18:00:00+09:00"
  }
}
```

---

## 6. 訪問記録 API

### 6.1 訪問一覧取得

指定した日報の訪問記録一覧を取得する。

```
GET /reports/{report_id}/visits
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| report_id  | integer | 日報ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": [
    {
      "visit_id": 1,
      "customer": {
        "customer_id": 1,
        "customer_name": "株式会社ABC"
      },
      "visit_time": "10:00",
      "visit_purpose": "定期訪問",
      "visit_content": "新製品の提案を行った。",
      "result": "次回見積提出予定",
      "created_at": "2026-02-15T09:00:00+09:00"
    }
  ]
}
```

---

### 6.2 訪問登録

日報に訪問記録を追加する。

```
POST /reports/{report_id}/visits
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| report_id  | integer | 日報ID |

#### リクエスト

```json
{
  "customer_id": 1,
  "visit_time": "10:00",
  "visit_purpose": "定期訪問",
  "visit_content": "新製品の提案を行った。担当者は興味を示している。",
  "result": "次回見積提出予定"
}
```

| パラメータ    | 型            | 必須 | 説明              |
| ------------- | ------------- | ---- | ----------------- |
| customer_id   | integer       | Yes  | 顧客ID            |
| visit_time    | string (time) | No   | 訪問時刻（HH:mm） |
| visit_purpose | string        | No   | 訪問目的          |
| visit_content | string        | Yes  | 訪問内容          |
| result        | string        | No   | 結果              |

#### レスポンス（201 Created）

```json
{
  "success": true,
  "data": {
    "visit_id": 1,
    "report_id": 1,
    "customer_id": 1,
    "visit_time": "10:00",
    "visit_purpose": "定期訪問",
    "visit_content": "新製品の提案を行った。担当者は興味を示している。",
    "result": "次回見積提出予定",
    "created_at": "2026-02-15T09:00:00+09:00"
  }
}
```

---

### 6.3 訪問更新

訪問記録を更新する。

```
PUT /visits/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| id         | integer | 訪問ID |

#### リクエスト

```json
{
  "customer_id": 1,
  "visit_time": "10:30",
  "visit_purpose": "定期訪問",
  "visit_content": "新製品の提案を行った。担当者は興味を示している。",
  "result": "見積提出完了"
}
```

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "visit_id": 1,
    "report_id": 1,
    "customer_id": 1,
    "visit_time": "10:30",
    "visit_purpose": "定期訪問",
    "visit_content": "新製品の提案を行った。担当者は興味を示している。",
    "result": "見積提出完了",
    "updated_at": "2026-02-15T18:00:00+09:00"
  }
}
```

---

### 6.4 訪問削除

訪問記録を削除する。

```
DELETE /visits/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| id         | integer | 訪問ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "message": "訪問記録を削除しました"
  }
}
```

---

## 7. Problem API

### 7.1 Problem一覧取得

指定した日報のProblem一覧を取得する。

```
GET /reports/{report_id}/problems
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| report_id  | integer | 日報ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": [
    {
      "problem_id": 1,
      "content": "競合他社が価格攻勢をかけてきている",
      "priority": "high",
      "comment_count": 2,
      "created_at": "2026-02-15T09:00:00+09:00"
    }
  ]
}
```

---

### 7.2 Problem登録

日報にProblemを追加する。

```
POST /reports/{report_id}/problems
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| report_id  | integer | 日報ID |

#### リクエスト

```json
{
  "content": "競合他社が価格攻勢をかけてきている",
  "priority": "high"
}
```

| パラメータ | 型     | 必須 | 説明                      |
| ---------- | ------ | ---- | ------------------------- |
| content    | string | Yes  | 課題・相談内容            |
| priority   | string | Yes  | 優先度（high/medium/low） |

#### レスポンス（201 Created）

```json
{
  "success": true,
  "data": {
    "problem_id": 1,
    "report_id": 1,
    "content": "競合他社が価格攻勢をかけてきている",
    "priority": "high",
    "created_at": "2026-02-15T09:00:00+09:00"
  }
}
```

---

### 7.3 Problem更新

Problemを更新する。

```
PUT /problems/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明       |
| ---------- | ------- | ---------- |
| id         | integer | Problem ID |

#### リクエスト

```json
{
  "content": "競合他社が価格攻勢をかけてきている。対策が必要。",
  "priority": "high"
}
```

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "problem_id": 1,
    "content": "競合他社が価格攻勢をかけてきている。対策が必要。",
    "priority": "high",
    "updated_at": "2026-02-15T18:00:00+09:00"
  }
}
```

---

### 7.4 Problem削除

Problemを削除する。

```
DELETE /problems/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明       |
| ---------- | ------- | ---------- |
| id         | integer | Problem ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "message": "Problemを削除しました"
  }
}
```

---

## 8. Plan API

### 8.1 Plan一覧取得

指定した日報のPlan一覧を取得する。

```
GET /reports/{report_id}/plans
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| report_id  | integer | 日報ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": [
    {
      "plan_id": 1,
      "content": "A社に見積書を提出する",
      "comment_count": 0,
      "created_at": "2026-02-15T09:00:00+09:00"
    }
  ]
}
```

---

### 8.2 Plan登録

日報にPlanを追加する。

```
POST /reports/{report_id}/plans
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| report_id  | integer | 日報ID |

#### リクエスト

```json
{
  "content": "A社に見積書を提出する"
}
```

| パラメータ | 型     | 必須 | 説明         |
| ---------- | ------ | ---- | ------------ |
| content    | string | Yes  | 明日やること |

#### レスポンス（201 Created）

```json
{
  "success": true,
  "data": {
    "plan_id": 1,
    "report_id": 1,
    "content": "A社に見積書を提出する",
    "created_at": "2026-02-15T09:00:00+09:00"
  }
}
```

---

### 8.3 Plan更新

Planを更新する。

```
PUT /plans/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明    |
| ---------- | ------- | ------- |
| id         | integer | Plan ID |

#### リクエスト

```json
{
  "content": "A社に見積書を提出し、フォロー電話をする"
}
```

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "plan_id": 1,
    "content": "A社に見積書を提出し、フォロー電話をする",
    "updated_at": "2026-02-15T18:00:00+09:00"
  }
}
```

---

### 8.4 Plan削除

Planを削除する。

```
DELETE /plans/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明    |
| ---------- | ------- | ------- |
| id         | integer | Plan ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "message": "Planを削除しました"
  }
}
```

---

## 9. コメント API

### 9.1 Problemコメント取得

指定したProblemのコメント一覧を取得する。

```
GET /problems/{id}/comments
```

#### パスパラメータ

| パラメータ | 型      | 説明       |
| ---------- | ------- | ---------- |
| id         | integer | Problem ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": [
    {
      "comment_id": 1,
      "commenter": {
        "salesperson_id": 10,
        "name": "鈴木 部長"
      },
      "content": "来週のミーティングで対策を検討しましょう",
      "created_at": "2026-02-15T19:00:00+09:00"
    }
  ]
}
```

---

### 9.2 Problemコメント投稿

Problemにコメントを投稿する。

```
POST /problems/{id}/comments
```

#### パスパラメータ

| パラメータ | 型      | 説明       |
| ---------- | ------- | ---------- |
| id         | integer | Problem ID |

#### リクエスト

```json
{
  "content": "来週のミーティングで対策を検討しましょう"
}
```

| パラメータ | 型     | 必須 | 説明         |
| ---------- | ------ | ---- | ------------ |
| content    | string | Yes  | コメント内容 |

#### レスポンス（201 Created）

```json
{
  "success": true,
  "data": {
    "comment_id": 1,
    "target_type": "problem",
    "target_id": 1,
    "commenter_id": 10,
    "content": "来週のミーティングで対策を検討しましょう",
    "created_at": "2026-02-15T19:00:00+09:00"
  }
}
```

---

### 9.3 Planコメント取得

指定したPlanのコメント一覧を取得する。

```
GET /plans/{id}/comments
```

#### パスパラメータ

| パラメータ | 型      | 説明    |
| ---------- | ------- | ------- |
| id         | integer | Plan ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": [
    {
      "comment_id": 2,
      "commenter": {
        "salesperson_id": 10,
        "name": "鈴木 部長"
      },
      "content": "見積書の金額は私に確認してから提出してください",
      "created_at": "2026-02-15T19:30:00+09:00"
    }
  ]
}
```

---

### 9.4 Planコメント投稿

Planにコメントを投稿する。

```
POST /plans/{id}/comments
```

#### パスパラメータ

| パラメータ | 型      | 説明    |
| ---------- | ------- | ------- |
| id         | integer | Plan ID |

#### リクエスト

```json
{
  "content": "見積書の金額は私に確認してから提出してください"
}
```

| パラメータ | 型     | 必須 | 説明         |
| ---------- | ------ | ---- | ------------ |
| content    | string | Yes  | コメント内容 |

#### レスポンス（201 Created）

```json
{
  "success": true,
  "data": {
    "comment_id": 2,
    "target_type": "plan",
    "target_id": 1,
    "commenter_id": 10,
    "content": "見積書の金額は私に確認してから提出してください",
    "created_at": "2026-02-15T19:30:00+09:00"
  }
}
```

---

### 9.5 コメント削除

コメントを削除する。

```
DELETE /comments/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明       |
| ---------- | ------- | ---------- |
| id         | integer | コメントID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "message": "コメントを削除しました"
  }
}
```

---

## 10. 顧客マスタ API

### 10.1 顧客一覧取得

顧客の一覧を取得する。

```
GET /customers
```

#### クエリパラメータ

| パラメータ | 型      | 必須 | 説明                 |
| ---------- | ------- | ---- | -------------------- |
| keyword    | string  | No   | 顧客名で検索         |
| industry   | string  | No   | 業種でフィルタ       |
| is_active  | boolean | No   | 有効フラグでフィルタ |
| page       | integer | No   | ページ番号           |
| per_page   | integer | No   | 1ページあたりの件数  |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": [
    {
      "customer_id": 1,
      "customer_name": "株式会社ABC",
      "address": "東京都千代田区丸の内1-1-1",
      "phone": "03-1234-5678",
      "industry": "製造業",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00+09:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 3,
    "total_count": 50
  }
}
```

---

### 10.2 顧客登録

新しい顧客を登録する。

```
POST /customers
```

#### リクエスト

```json
{
  "customer_name": "株式会社ABC",
  "address": "東京都千代田区丸の内1-1-1",
  "phone": "03-1234-5678",
  "industry": "製造業"
}
```

| パラメータ    | 型     | 必須 | 説明     |
| ------------- | ------ | ---- | -------- |
| customer_name | string | Yes  | 顧客名   |
| address       | string | No   | 住所     |
| phone         | string | No   | 電話番号 |
| industry      | string | No   | 業種     |

#### レスポンス（201 Created）

```json
{
  "success": true,
  "data": {
    "customer_id": 1,
    "customer_name": "株式会社ABC",
    "address": "東京都千代田区丸の内1-1-1",
    "phone": "03-1234-5678",
    "industry": "製造業",
    "is_active": true,
    "created_at": "2026-02-15T09:00:00+09:00"
  }
}
```

---

### 10.3 顧客詳細取得

指定した顧客の詳細を取得する。

```
GET /customers/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| id         | integer | 顧客ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "customer_id": 1,
    "customer_name": "株式会社ABC",
    "address": "東京都千代田区丸の内1-1-1",
    "phone": "03-1234-5678",
    "industry": "製造業",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00+09:00",
    "updated_at": "2026-02-15T09:00:00+09:00"
  }
}
```

---

### 10.4 顧客更新

顧客情報を更新する。

```
PUT /customers/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| id         | integer | 顧客ID |

#### リクエスト

```json
{
  "customer_name": "株式会社ABC",
  "address": "東京都千代田区丸の内2-2-2",
  "phone": "03-1234-5678",
  "industry": "製造業",
  "is_active": true
}
```

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "customer_id": 1,
    "customer_name": "株式会社ABC",
    "address": "東京都千代田区丸の内2-2-2",
    "phone": "03-1234-5678",
    "industry": "製造業",
    "is_active": true,
    "updated_at": "2026-02-15T18:00:00+09:00"
  }
}
```

---

### 10.5 顧客削除

顧客を削除する（論理削除：is_activeをfalseに更新）。

```
DELETE /customers/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| id         | integer | 顧客ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "message": "顧客を削除しました"
  }
}
```

---

## 11. 営業マスタ API

### 11.1 営業一覧取得

営業担当者の一覧を取得する。

```
GET /salespersons
```

#### クエリパラメータ

| パラメータ | 型      | 必須 | 説明                                  |
| ---------- | ------- | ---- | ------------------------------------- |
| keyword    | string  | No   | 氏名で検索                            |
| role       | string  | No   | 役割でフィルタ（sales/manager/admin） |
| manager_id | integer | No   | 上長IDでフィルタ                      |
| is_active  | boolean | No   | 有効フラグでフィルタ                  |
| page       | integer | No   | ページ番号                            |
| per_page   | integer | No   | 1ページあたりの件数                   |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": [
    {
      "salesperson_id": 1,
      "name": "田中 太郎",
      "email": "tanaka@example.com",
      "role": "sales",
      "manager": {
        "salesperson_id": 10,
        "name": "鈴木 部長"
      },
      "is_active": true,
      "created_at": "2026-01-01T00:00:00+09:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_pages": 2,
    "total_count": 30
  }
}
```

---

### 11.2 営業登録

新しい営業担当者を登録する。

```
POST /salespersons
```

#### リクエスト

```json
{
  "name": "田中 太郎",
  "email": "tanaka@example.com",
  "password": "password123",
  "role": "sales",
  "manager_id": 10
}
```

| パラメータ | 型      | 必須 | 説明                        |
| ---------- | ------- | ---- | --------------------------- |
| name       | string  | Yes  | 氏名                        |
| email      | string  | Yes  | メールアドレス              |
| password   | string  | Yes  | パスワード（8文字以上）     |
| role       | string  | Yes  | 役割（sales/manager/admin） |
| manager_id | integer | No   | 上長ID                      |

#### レスポンス（201 Created）

```json
{
  "success": true,
  "data": {
    "salesperson_id": 1,
    "name": "田中 太郎",
    "email": "tanaka@example.com",
    "role": "sales",
    "manager_id": 10,
    "is_active": true,
    "created_at": "2026-02-15T09:00:00+09:00"
  }
}
```

---

### 11.3 営業詳細取得

指定した営業担当者の詳細を取得する。

```
GET /salespersons/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| id         | integer | 営業ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "salesperson_id": 1,
    "name": "田中 太郎",
    "email": "tanaka@example.com",
    "role": "sales",
    "manager": {
      "salesperson_id": 10,
      "name": "鈴木 部長"
    },
    "subordinates": [
      {
        "salesperson_id": 2,
        "name": "佐藤 花子"
      }
    ],
    "is_active": true,
    "created_at": "2026-01-01T00:00:00+09:00",
    "updated_at": "2026-02-15T09:00:00+09:00"
  }
}
```

---

### 11.4 営業更新

営業担当者情報を更新する。

```
PUT /salespersons/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| id         | integer | 営業ID |

#### リクエスト

```json
{
  "name": "田中 太郎",
  "email": "tanaka@example.com",
  "role": "sales",
  "manager_id": 10,
  "is_active": true
}
```

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "salesperson_id": 1,
    "name": "田中 太郎",
    "email": "tanaka@example.com",
    "role": "sales",
    "manager_id": 10,
    "is_active": true,
    "updated_at": "2026-02-15T18:00:00+09:00"
  }
}
```

---

### 11.5 営業削除

営業担当者を削除する（論理削除：is_activeをfalseに更新）。

```
DELETE /salespersons/{id}
```

#### パスパラメータ

| パラメータ | 型      | 説明   |
| ---------- | ------- | ------ |
| id         | integer | 営業ID |

#### レスポンス（200 OK）

```json
{
  "success": true,
  "data": {
    "message": "営業担当者を削除しました"
  }
}
```

---

## 12. エラーコード一覧

| コード              | HTTPステータス | 説明                   |
| ------------------- | -------------- | ---------------------- |
| INVALID_CREDENTIALS | 401            | 認証情報が正しくない   |
| TOKEN_EXPIRED       | 401            | トークンの有効期限切れ |
| UNAUTHORIZED        | 401            | 認証が必要             |
| FORBIDDEN           | 403            | アクセス権限がない     |
| NOT_FOUND           | 404            | リソースが見つからない |
| VALIDATION_ERROR    | 422            | 入力値が不正           |
| DUPLICATE_ENTRY     | 422            | 重複データ             |
| INTERNAL_ERROR      | 500            | サーバー内部エラー     |

---

## 改訂履歴

| バージョン | 日付       | 変更内容 | 担当者 |
| ---------- | ---------- | -------- | ------ |
| 1.0        | 2026-02-15 | 初版作成 | -      |
