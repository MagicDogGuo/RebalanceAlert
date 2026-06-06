import {
  EXPOSURE_MULTIPLIERS,
  SYMBOLS,
  type AssetBreakdown,
  type HoldingInput,
  type PortfolioHoldings,
  type PortfolioPrices,
  type PortfolioResult,
  type RebalanceAdvice,
  type RebalanceTrade,
  type Symbol,
  type LeverageAnalysisResult,
} from '../types/portfolio';

export class SavedHoldingsNotFoundError extends Error {
  constructor(message = '尚未儲存持股資料，請先輸入持股並計算一次') {
    super(message);
    this.name = 'SavedHoldingsNotFoundError';
  }
}

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

const LEVERAGE_DRIFT_TOLERANCE = 0.005;

function purchasePricesFromHoldings(holdings: PortfolioHoldings): PortfolioPrices {
  return {
    '0050': holdings['0050'].costPerShare,
    '00631L': holdings['00631L'].costPerShare,
  };
}

function applyShareDelta(holdings: PortfolioHoldings, symbol: Symbol, delta: number): PortfolioHoldings {
  const nextShares = holdings[symbol].shares + delta;
  if (!Number.isInteger(nextShares) || nextShares <= 0) {
    throw new PortfolioValidationError('再平衡後股數必須為正整數，請手動微調建議交易量');
  }

  return {
    ...holdings,
    [symbol]: {
      ...holdings[symbol],
      shares: nextShares,
    },
  };
}

function buildRebalanceSummary(
  action: RebalanceAdvice['action'],
  currentLeverage: number,
  targetLeverage: number,
  trades: RebalanceTrade[],
): string {
  if (action === 'none') {
    return `目前槓桿 ${currentLeverage} 倍已接近買入時 ${targetLeverage} 倍，無需調整。`;
  }

  const drift = roundTo(currentLeverage - targetLeverage, 3);
  const driftText = drift > 0 ? `偏高 ${Math.abs(drift)} 倍` : `偏低 ${Math.abs(drift)} 倍`;
  const tradeText = trades
    .map((trade) => `${trade.side === 'buy' ? '買入' : '賣出'} ${trade.symbol} ${trade.shares} 股（約 ${Math.round(trade.estimatedAmount).toLocaleString('en-US')} 元）`)
    .join('，');

  if (action === 'reduce_leverage') {
    return `目前槓桿 ${currentLeverage} 倍，買入時為 ${targetLeverage} 倍（${driftText}）。建議 ${tradeText}，以降低整體槓桿。`;
  }

  return `目前槓桿 ${currentLeverage} 倍，買入時為 ${targetLeverage} 倍（${driftText}）。建議 ${tradeText}，以提高整體槓桿。`;
}

export function calculateRebalanceAdvice(
  holdings: PortfolioHoldings,
  currentPrices: PortfolioPrices,
  targetLeverage: number,
): RebalanceAdvice {
  validateHoldings(holdings);
  validatePrices(currentPrices);

  const current = calculatePortfolio(holdings, currentPrices);
  const currentLeverage = current.summary.leverage;
  const leverageDrift = roundTo(currentLeverage - targetLeverage, 3);

  if (Math.abs(leverageDrift) < LEVERAGE_DRIFT_TOLERANCE) {
    return {
      targetLeverage,
      currentLeverage,
      leverageDrift,
      action: 'none',
      summary: buildRebalanceSummary('none', currentLeverage, targetLeverage, []),
      trades: [],
      estimatedLeverageAfterRebalance: currentLeverage,
    };
  }

  const totalMarketValue = current.summary.totalMarketValue;
  const price0050 = currentPrices['0050'];
  const price00631L = currentPrices['00631L'];
  const target00631LMarketValue = (targetLeverage - 1) * totalMarketValue;
  const current00631LMarketValue = price00631L * holdings['00631L'].shares;
  const marketValueDelta = target00631LMarketValue - current00631LMarketValue;
  const shares00631LDelta = Math.round(marketValueDelta / price00631L);

  if (shares00631LDelta === 0) {
    return {
      targetLeverage,
      currentLeverage,
      leverageDrift,
      action: 'none',
      summary: `目前槓桿 ${currentLeverage} 倍與買入時 ${targetLeverage} 倍差距極小，無需調整。`,
      trades: [],
      estimatedLeverageAfterRebalance: currentLeverage,
    };
  }

  const estimatedAmount = Math.abs(shares00631LDelta) * price00631L;
  let shares0050Delta = Math.max(1, Math.round(estimatedAmount / price0050));
  const trades: RebalanceTrade[] = [];
  let adjustedHoldings = holdings;

  if (shares00631LDelta > 0) {
    const sharesToSell0050 = Math.min(shares0050Delta, holdings['0050'].shares);
    trades.push(
      { symbol: '00631L', side: 'buy', shares: shares00631LDelta, estimatedAmount },
      { symbol: '0050', side: 'sell', shares: sharesToSell0050, estimatedAmount: sharesToSell0050 * price0050 },
    );
    adjustedHoldings = applyShareDelta(adjustedHoldings, '0050', -sharesToSell0050);
    adjustedHoldings = applyShareDelta(adjustedHoldings, '00631L', shares00631LDelta);
  } else {
    const sharesToSell00631L = Math.min(Math.abs(shares00631LDelta), holdings['00631L'].shares);
    const matchedAmount = sharesToSell00631L * price00631L;
    shares0050Delta = Math.max(1, Math.round(matchedAmount / price0050));
    trades.push(
      { symbol: '00631L', side: 'sell', shares: sharesToSell00631L, estimatedAmount: matchedAmount },
      { symbol: '0050', side: 'buy', shares: shares0050Delta, estimatedAmount: shares0050Delta * price0050 },
    );
    adjustedHoldings = applyShareDelta(adjustedHoldings, '00631L', -sharesToSell00631L);
    adjustedHoldings = applyShareDelta(adjustedHoldings, '0050', shares0050Delta);
  }

  const action: RebalanceAdvice['action'] = leverageDrift > 0 ? 'reduce_leverage' : 'increase_leverage';
  const estimatedLeverageAfterRebalance = calculatePortfolio(adjustedHoldings, currentPrices).summary.leverage;

  return {
    targetLeverage,
    currentLeverage,
    leverageDrift,
    action,
    summary: buildRebalanceSummary(action, currentLeverage, targetLeverage, trades),
    trades,
    estimatedLeverageAfterRebalance,
  };
}

export function calculateLeverageAnalysis(
  holdings: PortfolioHoldings,
  currentPrices: PortfolioPrices,
): LeverageAnalysisResult {
  const current = calculatePortfolio(holdings, currentPrices);
  const atPurchase = calculatePortfolio(holdings, purchasePricesFromHoldings(holdings));
  const rebalance = calculateRebalanceAdvice(holdings, currentPrices, atPurchase.summary.leverage);

  return {
    current,
    atPurchase,
    rebalance,
  };
}
