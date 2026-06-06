export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Rebalance Alert API',
    version: '0.1.0',
    description: '0050 + 00631L 投資組合動態槓桿計算與再平衡建議 API',
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  tags: [
    { name: 'Health', description: '健康檢查' },
    { name: 'Calculate', description: '槓桿計算' },
    { name: 'Holdings', description: '持股持久化' },
    { name: 'Analysis', description: '槓桿分析與再平衡' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: '健康檢查',
        description: '供部署與監控使用的存活探測端點',
        responses: {
          '200': {
            description: '服務正常',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/calculate-leverage': {
      post: {
        tags: ['Calculate'],
        summary: '計算投資組合動態槓桿',
        description: '依目前股價計算槓桿、曝險與損益，並將持股寫入持久化儲存',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HoldingsRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: '計算成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CalculateLeverageResponse' },
              },
            },
          },
          '400': {
            description: '請求驗證失敗',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: '伺服器內部錯誤',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/holdings': {
      get: {
        tags: ['Holdings'],
        summary: '取得已儲存持股',
        description: '讀取 MongoDB 中儲存的持股資料；若尚未儲存則 holdings 為 null',
        responses: {
          '200': {
            description: '查詢成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GetHoldingsResponse' },
              },
            },
          },
          '500': {
            description: '伺服器內部錯誤',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Holdings'],
        summary: '儲存持股',
        description: '將持股資料寫入 MongoDB',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HoldingsRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: '儲存成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GetHoldingsResponse' },
              },
            },
          },
          '400': {
            description: '請求驗證失敗',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: '伺服器內部錯誤',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/leverage-analysis': {
      get: {
        tags: ['Analysis'],
        summary: '槓桿分析與再平衡建議',
        description: '依已儲存持股，比較現況與買入時槓桿，並產生再平衡建議',
        responses: {
          '200': {
            description: '分析成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LeverageAnalysisResponse' },
              },
            },
          },
          '404': {
            description: '尚未儲存持股資料',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '500': {
            description: '伺服器內部錯誤',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Symbol: {
        type: 'string',
        enum: ['0050', '00631L'],
      },
      HoldingInput: {
        type: 'object',
        required: ['shares', 'costPerShare'],
        properties: {
          shares: { type: 'integer', minimum: 1, example: 1000 },
          costPerShare: { type: 'number', minimum: 0, example: 150.5 },
        },
      },
      Holdings: {
        type: 'object',
        required: ['0050', '00631L'],
        properties: {
          '0050': { $ref: '#/components/schemas/HoldingInput' },
          '00631L': { $ref: '#/components/schemas/HoldingInput' },
        },
      },
      HoldingsRequest: {
        type: 'object',
        required: ['holdings'],
        properties: {
          holdings: { $ref: '#/components/schemas/Holdings' },
        },
      },
      HealthResponse: {
        type: 'object',
        required: ['status', 'timestamp'],
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string', example: '缺少 holdings 欄位' },
        },
      },
      PriceQuote: {
        type: 'object',
        required: ['close', 'date', 'source'],
        properties: {
          close: { type: 'number', example: 162.3 },
          date: { type: 'string', format: 'date', example: '2026-06-05' },
          source: { type: 'string', enum: ['finmind', 'fallback'] },
        },
      },
      Prices: {
        type: 'object',
        required: ['0050', '00631L'],
        properties: {
          '0050': { $ref: '#/components/schemas/PriceQuote' },
          '00631L': { $ref: '#/components/schemas/PriceQuote' },
        },
      },
      PortfolioSummary: {
        type: 'object',
        required: [
          'totalMarketValue',
          'totalExposure',
          'leverage',
          'totalCost',
          'unrealizedPnL',
          'roiPercent',
        ],
        properties: {
          totalMarketValue: { type: 'number', example: 271550 },
          totalExposure: { type: 'number', example: 489800 },
          leverage: { type: 'number', example: 1.804 },
          totalCost: { type: 'number', example: 250750 },
          unrealizedPnL: { type: 'number', example: 20800 },
          roiPercent: { type: 'number', example: 8.29 },
        },
      },
      BreakdownItem: {
        type: 'object',
        required: [
          'symbol',
          'shares',
          'marketValue',
          'weightPercent',
          'exposureMultiplier',
          'exposure',
        ],
        properties: {
          symbol: { $ref: '#/components/schemas/Symbol' },
          shares: { type: 'integer', example: 1000 },
          marketValue: { type: 'number', example: 162300 },
          weightPercent: { type: 'number', example: 59.77 },
          exposureMultiplier: { type: 'number', example: 1 },
          exposure: { type: 'number', example: 162300 },
        },
      },
      CalculateLeverageResponse: {
        type: 'object',
        required: ['prices', 'summary', 'breakdown', 'warnings'],
        properties: {
          prices: { $ref: '#/components/schemas/Prices' },
          summary: { $ref: '#/components/schemas/PortfolioSummary' },
          breakdown: {
            type: 'array',
            items: { $ref: '#/components/schemas/BreakdownItem' },
          },
          warnings: {
            type: 'array',
            items: { type: 'string' },
            example: [],
          },
        },
      },
      GetHoldingsResponse: {
        type: 'object',
        required: ['holdings'],
        properties: {
          holdings: {
            oneOf: [{ $ref: '#/components/schemas/Holdings' }, { type: 'null' }],
          },
        },
      },
      RebalanceTrade: {
        type: 'object',
        required: ['symbol', 'side', 'shares', 'estimatedAmount'],
        properties: {
          symbol: { $ref: '#/components/schemas/Symbol' },
          side: { type: 'string', enum: ['buy', 'sell'] },
          shares: { type: 'integer', example: 100 },
          estimatedAmount: { type: 'number', example: 16230 },
        },
      },
      RebalanceAdvice: {
        type: 'object',
        required: [
          'targetLeverage',
          'currentLeverage',
          'leverageDrift',
          'action',
          'summary',
          'trades',
          'estimatedLeverageAfterRebalance',
        ],
        properties: {
          targetLeverage: { type: 'number', example: 1.8 },
          currentLeverage: { type: 'number', example: 1.85 },
          leverageDrift: { type: 'number', example: 0.05 },
          action: {
            type: 'string',
            enum: ['none', 'reduce_leverage', 'increase_leverage'],
          },
          summary: { type: 'string', example: '槓桿偏離目標，建議減槓' },
          trades: {
            type: 'array',
            items: { $ref: '#/components/schemas/RebalanceTrade' },
          },
          estimatedLeverageAfterRebalance: {
            oneOf: [{ type: 'number' }, { type: 'null' }],
            example: 1.8,
          },
        },
      },
      AnalysisSection: {
        type: 'object',
        required: ['leverage', 'summary', 'breakdown'],
        properties: {
          leverage: { type: 'number', example: 1.804 },
          summary: { $ref: '#/components/schemas/PortfolioSummary' },
          breakdown: {
            type: 'array',
            items: { $ref: '#/components/schemas/BreakdownItem' },
          },
        },
      },
      LeverageAnalysisResponse: {
        type: 'object',
        required: ['holdings', 'prices', 'current', 'atPurchase', 'rebalance', 'warnings'],
        properties: {
          holdings: { $ref: '#/components/schemas/Holdings' },
          prices: { $ref: '#/components/schemas/Prices' },
          current: { $ref: '#/components/schemas/AnalysisSection' },
          atPurchase: { $ref: '#/components/schemas/AnalysisSection' },
          rebalance: { $ref: '#/components/schemas/RebalanceAdvice' },
          warnings: {
            type: 'array',
            items: { type: 'string' },
            example: [],
          },
        },
      },
    },
  },
} as const;
