import {
  EXPOSURE_MULTIPLIERS,
  SYMBOLS,
  type AssetBreakdown,
  type HoldingInput,
  type PortfolioHoldings,
  type PortfolioPrices,
  type PortfolioResult,
  type Symbol,
} from '../types/portfolio';

export class PortfolioValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortfolioValidationError';
  }
}

export function validateHolding(symbol: Symbol, holding: HoldingInput): void {
  if (!Number.isFinite(holding.shares) || !Number.isInteger(holding.shares) || holding.shares <= 0) {
    throw new PortfolioValidationError(`${symbol} 股數必須為正整數`);
  }

  if (!Number.isFinite(holding.costPerShare) || holding.costPerShare < 0) {
    throw new PortfolioValidationError(`${symbol} 每股成本必須為大於等於 0 的數字`);
  }
}

export function validateHoldings(holdings: PortfolioHoldings): void {
  for (const symbol of SYMBOLS) {
    const holding = holdings[symbol];
    if (!holding) {
      throw new PortfolioValidationError(`缺少 ${symbol} 的持股資料`);
    }
    validateHolding(symbol, holding);
  }
}

export function validatePrices(prices: PortfolioPrices): void {
  for (const symbol of SYMBOLS) {
    const price = prices[symbol];
    if (!Number.isFinite(price) || price < 0) {
      throw new PortfolioValidationError(`${symbol} 現價必須為大於等於 0 的數字`);
    }
  }
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * FR-01 核心計算引擎（純函數，無網路依賴）
 *
 * - FR-01-2 總淨值（市值）
 * - FR-01-3 實質曝險
 * - FR-01-4 整體槓桿（小數點後三位）
 */
export function calculatePortfolio(
  holdings: PortfolioHoldings,
  prices: PortfolioPrices,
): PortfolioResult {
  validateHoldings(holdings);
  validatePrices(prices);

  const breakdown: AssetBreakdown[] = SYMBOLS.map((symbol) => {
    const { shares, costPerShare } = holdings[symbol];
    const currentPrice = prices[symbol];
    const exposureMultiplier = EXPOSURE_MULTIPLIERS[symbol];
    const marketValue = currentPrice * shares;
    const exposure = marketValue * exposureMultiplier;
    const costBasis = costPerShare * shares;

    return {
      symbol,
      shares,
      costPerShare,
      currentPrice,
      marketValue,
      weightPercent: 0,
      exposureMultiplier,
      exposure,
      costBasis,
      unrealizedPnL: marketValue - costBasis,
    };
  });

  const totalMarketValue = breakdown.reduce((sum, item) => sum + item.marketValue, 0);
  const totalExposure = breakdown.reduce((sum, item) => sum + item.exposure, 0);
  const totalCost = breakdown.reduce((sum, item) => sum + item.costBasis, 0);

  if (totalMarketValue === 0) {
    throw new PortfolioValidationError('總市值不可為 0，無法計算槓桿倍數');
  }

  const leverage = roundTo(totalExposure / totalMarketValue, 3);
  const unrealizedPnL = totalMarketValue - totalCost;
  const roiPercent = totalCost === 0 ? 0 : roundTo((unrealizedPnL / totalCost) * 100, 2);

  for (const item of breakdown) {
    item.weightPercent = roundTo((item.marketValue / totalMarketValue) * 100, 2);
  }

  return {
    summary: {
      totalMarketValue,
      totalExposure,
      leverage,
      totalCost,
      unrealizedPnL,
      roiPercent,
    },
    breakdown,
  };
}
