# LINE 槓桿分析推播與訊息查詢設定教學

本文件說明如何設定 **LINE Messaging API**，讓 RebalanceAlert 支援：

1. **每日定時推播** — 固定時間自動傳送 `/api/v1/leverage-analysis` 摘要
2. **訊息查詢** — 傳 LINE 訊息即可即時查詢目前槓桿狀況

> 相關文件：[環境設定教學](./setup-guide-node-express-tsx.md) · [Render 部署指南](./deploy-render.md) · [技術規格](./technical-spec-express-typescript.md)

---

## 1. 功能概述

| 項目 | 說明 |
| :--- | :--- |
| 定時推播 | LINE Messaging API **Push Message**（伺服器主動推播） |
| 訊息查詢 | LINE **Webhook** + **Reply Message**（使用者傳訊息，機器人即時回覆） |
| 資料來源 | 與 `GET /api/v1/leverage-analysis` 相同（`current.summary`、`atPurchase.leverage`、`rebalance.summary`） |
| 排程方式 | `node-cron`，伺服器啟動後自動註冊 |
| 手動測試推播 | `npm run line:notify` |
| Webhook 端點 | `POST /webhooks/line` |

推播訊息範例：

```
📊 0050 + 00631L 槓桿分析日報
資料日期：2026-06-05

【現況摘要】
總市值：$271,550 元
總曝險：$366,850 元
整體槓桿：1.350 倍
...

【買入時槓桿】1.280 倍

【再平衡建議】
目前槓桿符合目標，無需調整
```

---

## 2. 訊息查詢指令

加好友後，在 LINE 聊天室傳送以下關鍵字即可查詢：

| 指令類型 | 可傳送的文字範例 |
| :--- | :--- |
| 查詢槓桿 | `槓桿`、`分析`、`報告`、`現況`、`leverage` |
| 顯示說明 | `說明`、`help` |

機器人會回覆與定時推播相同格式的槓桿分析摘要。

> 若設定了 `LINE_NOTIFY_USER_IDS`，只有名單內的 User ID 可以查詢；未設定時，所有已加好友的使用者皆可查詢。

---

## 3. 整體流程

你需要準備三個關鍵值：

1. **Channel Access Token** — 程式呼叫 LINE API 的通行證
2. **Channel Secret** — Webhook 簽章驗證用（訊息查詢必填）
3. **User ID** — 指定推播接收者與授權查詢者（以 `U` 開頭的 33 字元字串）

```
建立官方帳號 → 啟用 Messaging API → 取得 Token 與 Secret
      ↓
加機器人為好友 → 取得 User ID → 設定 Webhook URL
      ↓
寫入 .env → npm run line:notify 測試推播 → 傳「槓桿」測試查詢
```

---

## 4. 建立 LINE 官方帳號

1. 前往 [LINE Official Account Manager](https://manager.line.biz/)
2. 使用 LINE 帳號登入
3. 點擊 **建立官方帳號**
4. 填寫名稱（例如 `RebalanceAlert`）並完成建立

---

## 5. 啟用 Messaging API

1. 在官方帳號管理後台，進入剛建立的帳號
2. 右上角 **設定** → 左側 **Messaging API**
3. 點擊 **啟用 Messaging API**
4. 若尚未有 Provider，系統會要求建立 **Provider**（例如 `RebalanceAlert`）
5. 同意條款後完成啟用

---

## 6. 取得 Channel Access Token

1. 在 Messaging API 設定頁，點擊 **LINE Developers Console 進行其他設定**  
   或直接前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇你的 **Provider** → 點進該 **Messaging API Channel**
3. 上方分頁選 **Messaging API**
4. 往下找到 **Channel access token (long-lived)**
5. 點擊 **Issue** → 複製產生的 Token

Token 格式類似（約 170+ 字元）：

```
AbCdEf1234567890abcdefghijklmnopqrstuvwxyz...
```

> **安全提醒：** Token 等同密碼，不可 commit 到 Git、不可公開分享。若外洩，請到 Console 點 **Reissue** 重新發行。

---

## 7. 取得 Channel Secret

1. LINE Developers Console → 你的 Channel
2. 分頁選 **Basic settings**
3. 找到 **Channel secret** → 點擊顯示並複製

寫入 `.env`：

```env
LINE_CHANNEL_SECRET=你的_channel_secret
```

> Channel Secret 用於驗證 Webhook 請求來自 LINE 官方，同樣不可外洩。

---

## 8. 加機器人為好友

Push 訊息只能送給 **已加官方帳號為好友** 的使用者。

1. LINE Developers Console → 你的 Channel → **Messaging API** 分頁
2. 找到 **QR code**，用手機 LINE 掃描
3. 點擊 **加入好友**

若未加好友，推播會失敗，常見錯誤為 `The user hasn't added the bot as a friend`。

---

## 9. 設定 Webhook URL（訊息查詢必填）

1. LINE Developers Console → 你的 Channel → **Messaging API** 分頁
2. 找到 **Webhook settings**
3. **Webhook URL** 填入你的伺服器網址：

```
https://你的網域/webhooks/line
```

本機開發可用 [ngrok](https://ngrok.com/) 建立臨時 HTTPS 網址，例如：

```
https://abc123.ngrok-free.app/webhooks/line
```

4. 啟用 **Use webhook**（開啟）
5. 點擊 **Verify** 確認連線成功（伺服器需正在運行）

> Render 部署後 Webhook URL 為 `https://你的服務.onrender.com/webhooks/line`

---

## 10. 取得 User ID

### 10.1 方法一：從 Developers Console 直接取得（推薦）

若你是 Channel 的 Admin：

1. LINE Developers Console → 你的 Channel
2. 分頁選 **Basic settings**
3. 往下找到 **Your user ID**
4. 複製以 `U` 開頭的 ID，例如：

```
U8189cf6745fc0d808977bdb0b9f22995
```

### 10.2 方法二：透過 Webhook 取得

若 Console 看不到 Your user ID，可先設定 Webhook，加好友或傳訊息後，從伺服器 log 或 Webhook 事件中的 `source.userId` 取得。

---

## 11. 環境變數設定

在專案根目錄的 `.env` 加入以下變數（可參考 `.env.example`）：

```env
# LINE Messaging API（推播 + 訊息查詢）
LINE_CHANNEL_ACCESS_TOKEN=你的_channel_access_token
LINE_CHANNEL_SECRET=你的_channel_secret
LINE_NOTIFY_USER_IDS=Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_NOTIFY_CRON=0 9 * * *
LINE_NOTIFY_TIMEZONE=Asia/Taipei
```

### 11.1 變數說明

| 變數 | 必填 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `LINE_CHANNEL_ACCESS_TOKEN` | **是** | — | Messaging API Channel Access Token |
| `LINE_CHANNEL_SECRET` | 查詢時必填 | — | Webhook 簽章驗證用 |
| `LINE_NOTIFY_USER_IDS` | 推播時必填 | — | 推播對象；亦作為查詢授權名單（未設定時允許所有好友查詢） |
| `LINE_NOTIFY_CRON` | 否 | `0 9 * * *` | Cron 表達式（每天 09:00） |
| `LINE_NOTIFY_TIMEZONE` | 否 | `Asia/Taipei` | 排程時區 |

### 11.2 啟用條件

| 功能 | 啟用條件 |
| :--- | :--- |
| 定時推播 | `LINE_CHANNEL_ACCESS_TOKEN` + `LINE_NOTIFY_USER_IDS` |
| 訊息查詢 | `LINE_CHANNEL_ACCESS_TOKEN` + `LINE_CHANNEL_SECRET` + Webhook URL 已設定 |

### 11.3 Cron 格式

```
分 時 日 月 星期
```

| 需求 | Cron 值 |
| :--- | :--- |
| 每天 09:00 | `0 9 * * *` |
| 每天 20:30 | `30 20 * * *` |
| 週一到週五 08:00 | `0 8 * * 1-5` |
| 每天 08:00 和 20:00 | `0 8,20 * * *` |

星期對照：`0` 或 `7` = 日，`1` = 一，…，`6` = 六。

### 11.4 多人推播

```env
LINE_NOTIFY_USER_IDS=Uaaaa...,Ubbbb...,Ucccc...
```

---

## 12. 測試與啟動

### 12.1 手動推播（建議先做）

不必等到排程時間，可立即測試：

```powershell
npm run line:notify
```

成功時終端機顯示：

```
LINE 槓桿分析推播已送出
```

手機 LINE 應收到槓桿分析日報。

### 12.2 測試訊息查詢

1. 完成 [§13 關閉 LINE 自動回應](#13-關閉-line-自動回應重要)（必做，否則可能收到官方預設訊息而非槓桿分析）
2. 確認 `.env`（或 Render 環境變數）已設定 `LINE_CHANNEL_SECRET`
3. 啟動伺服器：`npm run dev`（或確認 Render 服務已部署）
4. 確認 Webhook URL 已指向你的伺服器且 **Verify** 成功
5. 在 LINE 聊天室傳送：`槓桿`
6. 應收到即時槓桿分析回覆

### 12.3 啟動伺服器（啟用每日排程）

```powershell
npm run dev
```

啟動成功且 LINE 已設定時，會看到：

```
Server running on port 3000
LINE 槓桿分析推播已排程：0 9 * * *（Asia/Taipei）
LINE Webhook 已啟用：POST /webhooks/line
```

---

## 13. 關閉 LINE 自動回應（重要）

若傳「槓桿」後收到 **「本帳號無法個別回復用戶訊息」**，代表 LINE 官方帳號的**自動回應**攔截了訊息，而非本專案的 Webhook 回覆。Webhook Verify 成功也仍可能發生此問題，**必須關閉自動回應**。

本專案正常回覆時，應顯示槓桿分析摘要；若 User ID 未授權，則顯示「此帳號未授權使用查詢功能。」

### 13.1 LINE Official Account Manager

1. 前往 [LINE Official Account Manager](https://manager.line.biz/)
2. 進入你的官方帳號 → 右上角 **設定** → 左側 **回應設定**
3. 依下表設定：

| 設定項 | 應設為 | 說明 |
| :--- | :--- | :--- |
| 回應模式 | **聊天機器人** | 才能將訊息轉給 Messaging API Webhook |
| Webhook | **啟用** | 與 Developers Console 的 Use webhook 連動 |
| 自動回應訊息 | **關閉** | 避免與本專案 Reply 衝突 |

> 若同時啟用「自動回應訊息」與 Webhook，且兩者設了相同關鍵字，使用者可能收到**兩則**回覆。本專案只需 Webhook，請關閉自動回應。

### 13.2 LINE Developers Console

1. 前往 [LINE Developers Console](https://developers.line.biz/console/) → 你的 Messaging API Channel
2. 分頁選 **Messaging API**
3. 依下表設定：

| 設定項 | 應設為 | 說明 |
| :--- | :--- | :--- |
| Use webhook | **Enabled（開啟）** | 訊息查詢必填 |
| Greeting message | **Disabled（關閉）** | 本專案會在加好友時透過 Webhook 回覆歡迎訊息 |
| Auto-reply messages | **Disabled（關閉）** | 避免觸發「本帳號無法個別回復用戶訊息」等預設回覆 |

Greeting message / Auto-reply messages 旁若有 **Edit** 按鈕，點擊後會跳轉到 Official Account Manager，請在該處將功能設為關閉。

### 13.3 設定完成後驗證

1. 確認 Webhook URL 已 Verify 成功（例如 `https://rebalance-alert.onrender.com/webhooks/line`）
2. 在 LINE 傳送 `槓桿`
3. 預期收到槓桿分析摘要（含總市值、整體槓桿、再平衡建議）
4. 若部署在 Render，可在 **Logs** 確認是否出現 `LINE Webhook 收到 1 個事件`

---

## 14. 程式架構

```
src/
├── line/
│   ├── buildLeverageAnalysisMessage.ts  # 共用：取得並格式化分析摘要
│   ├── formatLeverageSummaryMessage.ts  # 將 API 摘要格式化為 LINE 文字
│   ├── lineWebhookHandler.ts            # 處理 Webhook 事件與指令
│   ├── messageCommands.ts               # 辨識使用者傳入的關鍵字
│   ├── leverageAnalysisNotifier.ts      # 定時推播
│   ├── scheduler.ts                     # node-cron 每日排程
│   └── main.ts                          # npm run line:notify 入口
├── routes/webhooks/line.ts              # POST /webhooks/line
└── services/
    ├── leverageAnalysisService.ts       # 與 API 共用的分析邏輯
    └── lineMessagingService.ts          # LINE Push / Reply API 封裝
```

---

## 15. 部署到 Render / 雲端

若部署到 [Render](./deploy-render.md) 或其他平台：

1. 在平台的 **Environment Variables** 設定上述 LINE 變數（不要只寫在本機 `.env`）
2. 服務需 **24 小時持續運行**，排程才會每天觸發
3. Render 免費方案閒置後會休眠，可能錯過排程時間；可考慮：
   - 升級為付費方案保持常駐
   - 使用外部 Cron（如 GitHub Actions）定期執行 `npm run line:notify`

### Render 環境變數補充

| Key | 必填 | 說明 |
| :--- | :--- | :--- |
| `LINE_CHANNEL_ACCESS_TOKEN` | **是** | Channel Access Token |
| `LINE_CHANNEL_SECRET` | 查詢時必填 | Channel Secret |
| `LINE_NOTIFY_USER_IDS` | 推播時必填 | 接收者 User ID |
| `LINE_NOTIFY_CRON` | 否 | 預設 `0 9 * * *` |
| `LINE_NOTIFY_TIMEZONE` | 否 | 預設 `Asia/Taipei` |
| `MONGODB_URI` | **是** | 需有持股資料，否則回覆「尚未儲存持股」 |

部署後記得在 LINE Console 將 Webhook URL 設為 `https://你的服務.onrender.com/webhooks/line`。

---

## 16. 常見問題

| 錯誤訊息 / 現象 | 原因 | 解法 |
| :--- | :--- | :--- |
| `LINE_CHANNEL_ACCESS_TOKEN 未設定` | `.env` 未填或變數名稱錯誤 | 確認變數名稱與 Token 內容 |
| `LINE_NOTIFY_USER_IDS 未設定` | 未填 User ID | 從 Console Basic settings 複製 |
| `401 Unauthorized` | Token 無效或過期 | 到 Console 重新 Issue Token |
| `The user hasn't added the bot as a friend` | 未加好友 | 掃描 QR Code 加入官方帳號 |
| `400 Bad Request`（無效 userId） | User ID 格式錯誤 | 確認以 `U` 開頭、共 33 字元 |
| 推播成功但內容為「尚未儲存持股資料」 | MongoDB 無持股 | 先透過 API 或網頁儲存持股 |
| 排程沒有觸發 | 伺服器未持續運行 | 本機關閉終端機後排程停止；部署需常駐 |
| Cron 時間不對 | 時區設定錯誤 | 確認 `LINE_NOTIFY_TIMEZONE=Asia/Taipei` |
| `LINE_NOTIFY_CRON 格式無效` | Cron 語法錯誤 | 參考 §11.3 修正表達式 |
| 傳訊息沒反應 | Webhook 未啟用或 URL 錯誤 | 確認 Use webhook 開啟、URL 正確、Verify 成功 |
| `LINE 簽章驗證失敗` | Channel Secret 錯誤 | 確認 `LINE_CHANNEL_SECRET` 與 Console 一致 |
| `此帳號未授權使用查詢功能` | User ID 不在名單 | 將 User ID 加入 `LINE_NOTIFY_USER_IDS` |
| Webhook Verify 失敗 | 伺服器未啟動或非 HTTPS | 本機需用 ngrok；確認 `/webhooks/line` 可連線 |
| **本帳號無法個別回復用戶訊息** | 自動回應未關閉，或回應模式非聊天機器人 | 依 [§13](#13-關閉-line-自動回應重要) 關閉自動回應並啟用 Webhook |
| Verify 成功但傳訊息仍無槓桿分析 | Render 冷啟動或環境變數未設 | 多等 30–60 秒再試；確認 Render 已設 LINE 環境變數 |

---

## 17. 快速檢查清單

- [ ] 已建立 LINE 官方帳號
- [ ] 已啟用 Messaging API
- [ ] 已取得 Channel Access Token 並寫入 `.env`
- [ ] 已取得 Channel Secret 並寫入 `.env`（訊息查詢）
- [ ] 已用手機加官方帳號為好友
- [ ] 已取得 User ID 並寫入 `LINE_NOTIFY_USER_IDS`
- [ ] 已設定 Webhook URL 並 Verify 成功
- [ ] 已關閉自動回應（Official Account Manager + Developers Console，見 §13）
- [ ] 回應模式設為「聊天機器人」、Webhook 已啟用
- [ ] 已設定 `LINE_NOTIFY_CRON` 與時區
- [ ] MongoDB 已有持股資料（`MONGODB_URI` 已設定）
- [ ] `npm run line:notify` 測試推播成功
- [ ] 傳送「槓桿」測試訊息查詢成功

---

## 18. 快速指令對照表

| 我想… | 指令 / 操作 |
| :--- | :--- |
| 立即測試 LINE 推播 | `npm run line:notify` |
| 啟動伺服器與每日排程 | `npm run dev` |
| 測試訊息查詢 | LINE 傳送「槓桿」或「分析」 |
| 正式環境啟動 | `npm run build` → `npm start` |
| 檢查 API 是否正常 | 瀏覽器開 `http://localhost:3000/api/v1/leverage-analysis` |

---

## 相關文件

- [Node + Express + tsx 環境設定教學](./setup-guide-node-express-tsx.md)
- [Render 部署指南](./deploy-render.md)
- [Express + TypeScript 技術規格](./technical-spec-express-typescript.md)
