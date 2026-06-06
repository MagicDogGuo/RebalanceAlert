# Render 部署指南

## 部署前檢查清單

| 項目 | 狀態 | 說明 |
| :--- | :--- | :--- |
| `npm run build` | 必須通過 | TypeScript 編譯至 `dist/` |
| `npm start` | 必須通過 | 執行 `node dist/server.js` |
| `PORT` | Render 自動注入 | `server.ts` 已使用 `process.env.PORT` |
| 靜態前端 `public/` | 已就緒 | 編譯後從 `dist/../public` 提供服務 |
| 健康檢查 | `/api/v1/health` | 已在 `render.yaml` 設定 |

## 方式一：使用 render.yaml（推薦）

1. 將專案 push 到 GitHub
2. 登入 [Render Dashboard](https://dashboard.render.com/)
3. **New → Blueprint** → 選擇此 repo
4. Render 會依 `render.yaml` 自動建立 Web Service

## 方式二：手動建立 Web Service

| 設定項 | 值 |
| :--- | :--- |
| Runtime | Node |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/v1/health` |

### 環境變數（Render Dashboard → Environment）

| Key | 必填 | 說明 |
| :--- | :--- | :--- |
| `NODE_ENV` | 建議 | `production` |
| `FINMIND_API_URL` | 否 | 預設已有，可不設 |
| `FALLBACK_PRICE_0050` | 否 | 預設 `160.0` |
| `FALLBACK_PRICE_00631L` | 否 | 預設 `210.0` |
| `FINMIND_TOKEN` | 否 | 選用，提高 API 請求上限 |
| `MONGODB_URI` | **是** | MongoDB Atlas 連線字串（持股持久化） |
| `MONGODB_DB_NAME` | 否 | 預設 `rebalancealert` |
| `MONGODB_PROFILE_ID` | 否 | 預設 `default` |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE 功能必填 | LINE Messaging API Token，詳見 [LINE 設定](./setup-line-notify.md) |
| `LINE_CHANNEL_SECRET` | 訊息查詢必填 | Webhook 簽章驗證用 |
| `LINE_NOTIFY_USER_IDS` | 推播時必填 | 推播對象與查詢授權名單（多人以逗號分隔） |
| `LINE_NOTIFY_CRON` | 否 | 預設 `0 9 * * *`（每天 09:00） |
| `LINE_NOTIFY_TIMEZONE` | 否 | 預設 `Asia/Taipei` |

> **注意：** 不要在 Build 階段前將 `NODE_ENV=production` 設在會影響 `npm install` 的位置，否則 `typescript`（devDependency）不會安裝，build 會失敗。`render.yaml` 的 env 在 runtime 套用，build 不受影響。

### MongoDB Atlas 設定（Render 連線必做）

1. 登入 [MongoDB Atlas](https://cloud.mongodb.com/) → **Network Access**
2. 新增 **Allow Access from Anywhere**（`0.0.0.0/0`）  
   Render 免費方案沒有固定 IP，必須開放外網連線。
3. **Database Access** 確認 DB 使用者有讀寫權限。
4. 複製 **Connect → Drivers** 的 URI，貼到 Render 的 `MONGODB_URI`（密碼中的特殊字元需 URL encode）。

> **安全：** 不要把 `.env` 或含密碼的 URI commit 到 GitHub；只在 Render Dashboard → Environment 設定。

## 部署後驗證

1. 開啟 `https://你的服務.onrender.com/` → 應看到輸入表單
2. `GET /api/v1/health` → `{ "status": "ok", ... }`
3. 在網頁輸入持股並計算 → 應回傳槓桿結果

## 免費方案注意事項

- **冷啟動：** 閒置 15 分鐘後首次請求需等待約 30–60 秒
- **對外網路：** FinMind API 請求正常（Render 允許 outbound HTTPS）
- **資料持久化：** 持股資料已存 MongoDB Atlas，不受 Render 重部署影響；未設定 `MONGODB_URI` 時仍可計算，但不會記住輸入

## 常見問題

### Build 失敗：`moduleResolution=node10` is deprecated (TS5107)

TypeScript 6 已棄用 `"moduleResolution": "node"`。本專案 `tsconfig.json` 已改為 `"NodeNext"`。請 pull 最新程式碼後重新部署。

### Build 失敗：找不到 `process`、`console`、`@types/node`

**原因：** `NODE_ENV=production` 時 `npm install` 會跳過 `devDependencies`，導致 `typescript` 與型別定義未安裝。

**解法：**
1. Build Command 改為 `npm install --include=dev && npm run build`
2. 本專案已將 `typescript`、`@types/node`、`@types/express` 移至 `dependencies` 雙重保險

### Build 失敗：`tsc: command not found`

Build Command 改為：

```bash
npm install --include=dev && npm run build
```

### 網頁 404、API 正常

確認 repo 內有 `public/` 資料夾且已 commit。

### FinMind 請求失敗

檢查 Render Logs；若頻繁觸發 rate limit，請設定 `FINMIND_TOKEN`。

### LINE 推播未送達

請依 [LINE 推播設定教學](./setup-line-notify.md) 檢查 Token、User ID 與好友狀態。Render 免費方案休眠可能錯過排程，可改用手動執行 `npm run line:notify` 或外部 Cron。
