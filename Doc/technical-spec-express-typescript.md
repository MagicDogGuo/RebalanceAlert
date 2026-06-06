# 0050 + 00631L 動態槓桿計算器 — Express + TypeScript 技術開發文件

本文件為 [產品需求規劃文件 (PRD)](./gemini-code-1780632844359.md) 的技術補充，定義以 **Node.js + Express + TypeScript** 實作後端服務的架構、目錄結構、API 契約與開發流程。

> **環境設定：** 若尚未安裝 Node / npm 或不知如何啟動專案，請先閱讀 [Node + Express + tsx 環境設定教學](./setup-guide-node-express-tsx.md)。

---

## 1. 技術選型

| 項目 | 選擇 | 說明 |
| :--- | :--- | :--- |
| 執行環境 | Node.js ≥ 18 LTS | 與 PRD 非功能需求相容 |
| 語言 | TypeScript 5.x | 型別安全、便於維護計算邏輯 |
| Web 框架 | Express 4.x | 輕量、成熟，適合 REST API |
| HTTP 客戶端 | axios | 串接 FinMind 等外部財經 API |
| 開發工具 | tsx / ts-node-dev | 開發時熱重載 |
| 測試 | Vitest 或 Jest | 核心 Model 純函數單元測試 |
| 程式碼品質 | ESLint + Prettier | 統一風格 |

---

## 2. 專案目錄結構（建議）

```
RebalanceAlert/
├── Doc/                          # 產品與技術文件
├── src/
│   ├── config/                   # 環境變數、預設股價 (Fallback)
│   │   └── index.ts
│   ├── models/                   # 純函數：槓桿、曝險、損益計算 (FR-01)
│   │   └── portfolio.ts
│   ├── services/                 # 外部 API 串接 (FR-02)
│   │   └── stockPriceService.ts
│   ├── routes/                   # Express 路由
│   │   └── v1/
│   │       └── calculate.ts
│   ├── controllers/              # 請求驗證、呼叫 Service/Model、回應格式化
│   │   └── calculateController.ts
│   ├── middleware/               # 錯誤處理、請求日誌
│   │   └── errorHandler.ts
│   ├── types/                    # 共用 TypeScript 型別
│   │   └── portfolio.ts
│   ├── utils/                    # 千分位、百分比格式化 (FR-03)
│   │   └── format.ts
│   ├── app.ts                    # Express 應用組裝
│   └── server.ts                 # 啟動入口
├── tests/
│   └── models/
│       └── portfolio.test.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

### 2.1 關注點分離 (SoC)

對應 PRD §4.3：

- **Model** (`src/models/`)：不依賴網路，僅接收股價與持股資料並輸出計算結果。
- **Service** (`src/services/`)：負責 FinMind HTTP 請求、時間序列防禦、Fallback 股價。
- **Interface** (`src/routes/`, `src/controllers/`, CLI 若保留則放 `src/cli/`)：處理輸入輸出，不含財務公式。

---

## 3. API 設計（階段二）

### 3.1 `POST /api/v1/calculate-leverage`

計算投資組合動態槓桿與損益摘要。

**Request Body**

```json
{
  "holdings": {
    "0050": { "shares": 1000, "costPerShare": 150.5 },
    "00631L": { "shares": 500, "costPerShare": 200.0 }
  }
}
```

**Response 200**

```json
{
  "prices": {
    "0050": { "close": 162.3, "date": "2026-06-04", "source": "finmind" },
    "00631L": { "close": 218.5, "date": "2026-06-04", "source": "finmind" }
  },
  "summary": {
    "totalMarketValue": 271550,
    "totalExposure": 489800,
    "leverage": 1.804,
    "totalCost": 250750,
    "unrealizedPnL": 20800,
    "roiPercent": 8.29
  },
  "breakdown": [
    {
      "symbol": "0050",
      "shares": 1000,
      "marketValue": 162300,
      "weightPercent": 59.77,
      "exposureMultiplier": 1,
      "exposure": 162300
    },
    {
      "symbol": "00631L",
      "shares": 500,
      "marketValue": 109250,
      "weightPercent": 40.23,
      "exposureMultiplier": 2,
      "exposure": 218500
    }
  ],
  "warnings": []
}
```

當 API 觸發 Fallback 時，`prices.*.source` 為 `"fallback"`，且 `warnings` 陣列包含說明訊息。

**Response 400** — 請求驗證失敗（股數非正整數、成本為負等）。

**Response 500** — 非預期伺服器錯誤。

### 3.2 `GET /api/v1/health`

健康檢查，供部署與監控使用。

```json
{ "status": "ok", "timestamp": "2026-06-05T08:00:00.000Z" }
```

---

## 4. 核心型別定義（TypeScript）

```typescript
export interface HoldingInput {
  shares: number;
  costPerShare: number;
}

export interface HoldingsRequest {
  holdings: {
    '0050': HoldingInput;
    '00631L': HoldingInput;
  };
}

export interface StockPrice {
  symbol: '0050' | '00631L';
  close: number;
  date: string;
  source: 'finmind' | 'fallback';
}

export interface PortfolioSummary {
  totalMarketValue: number;
  totalExposure: number;
  leverage: number;
  totalCost: number;
  unrealizedPnL: number;
  roiPercent: number;
}
```

---

## 5. 財務計算公式（Model 層）

與 PRD FR-01 一致，實作為純函數 `calculatePortfolio()`：

1. **總淨值（市值）** = `0050現價 × 0050股數 + 00631L現價 × 00631L股數`
2. **總曝險** = `0050市值 × 1 + 00631L市值 × 2`
3. **整體槓桿** = `總曝險 / 總淨值`（輸出至小數點後三位）
4. **未實現損益** = `總淨值 - (0050成本×股數 + 00631L成本×股數)`
5. **ROI** = `未實現損益 / 總成本 × 100`（小數點後兩位）

---

## 6. 外部股價服務（Service 層）

### 6.1 FinMind 串接要點

- 使用 axios 請求 FinMind 開放 API。
- 查詢範圍涵蓋過去 7 個日曆日，取**最新一個有收盤價的交易日**（FR-02-2）。
- 逾時建議 5 秒；失敗時載入 `config` 中的 Fallback 價格並寫入 `warnings` 日誌（FR-02-3）。

### 6.2 環境變數 (`.env.example`)

```env
PORT=3000
NODE_ENV=development

# FinMind（若需 token 可於此設定）
FINMIND_API_URL=https://api.finmindtrade.com/api/v4/data

# Fallback 防禦股價
FALLBACK_PRICE_0050=160.0
FALLBACK_PRICE_00631L=210.0
```

---

## 7. 開發階段對照

| 階段 | 交付物 | 技術重點 |
| :--- | :--- | :--- |
| 一 | CLI + 核心 Model/Service | 可先以 `tsx src/cli/main.ts` 驗證公式與 API |
| 二 | Express REST API | `POST /api/v1/calculate-leverage`、錯誤中介層 |
| 三 | LINE 每日推播（已實作） | `src/line/` + `node-cron`，詳見 [LINE 推播設定](./setup-line-notify.md) |

建議實作順序：**Model 單元測試 → StockPrice Service → CLI 驗證 → Express API**。

---

## 8. 本地開發指令（規劃）

```bash
# 安裝依賴
npm install

# 開發模式（熱重載）
npm run dev

# 建置
npm run build

# 正式啟動
npm start

# 執行測試
npm test
```

`package.json` scripts 建議：

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run",
    "lint": "eslint src --ext .ts"
  }
}
```

---

## 9. 錯誤處理與日誌

- 使用 Express 全域錯誤中介層統一回傳 JSON 錯誤格式。
- Fallback 觸發時以 `console.warn` 或結構化 logger 記錄：`symbol`、`reason`、`fallbackPrice`。
- 不在對外 API 回應中暴露內部 stack trace（`NODE_ENV=production` 時）。

---

## 10. 後續擴充預留

- **CORS**：階段二網頁前端需啟用 `cors` 中介層。
- **Rate Limit**：對外開放 API 時可加 `express-rate-limit`。
- **OpenAPI**：可後續以 Swagger 產生 API 文件，與本文件 §3 契約保持一致。

---

## 相關文件

- [產品需求規劃文件 (PRD)](./gemini-code-1780632844359.md)
- [Node + Express + tsx 環境設定教學](./setup-guide-node-express-tsx.md)
- [LINE 每日槓桿分析推播設定](./setup-line-notify.md)
