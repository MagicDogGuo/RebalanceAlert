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

> **注意：** 不要在 Build 階段前將 `NODE_ENV=production` 設在會影響 `npm install` 的位置，否則 `typescript`（devDependency）不會安裝，build 會失敗。`render.yaml` 的 env 在 runtime 套用，build 不受影響。

## 部署後驗證

1. 開啟 `https://你的服務.onrender.com/` → 應看到輸入表單
2. `GET /api/v1/health` → `{ "status": "ok", ... }`
3. 在網頁輸入持股並計算 → 應回傳槓桿結果

## 免費方案注意事項

- **冷啟動：** 閒置 15 分鐘後首次請求需等待約 30–60 秒
- **對外網路：** FinMind API 請求正常（Render 允許 outbound HTTPS）
- **檔案儲存：** 若未來加入 `data.json` 持久化，Render 預設磁碟為暫時性，重部署後資料會消失；需使用 Render Disk 或外部資料庫

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
