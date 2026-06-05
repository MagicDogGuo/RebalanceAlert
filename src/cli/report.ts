import { SYMBOLS, type PortfolioHoldings, type PortfolioResult } from '../types/portfolio';
import type { FetchStockPricesResult } from '../types/stockPrice';
import { formatCurrency, formatLeverage, formatPercent, formatPrice } from '../utils/format';

const SYMBOL_LABELS: Record<(typeof SYMBOLS)[number], string> = {
  '0050': '元大台灣50 (0050)',
  '00631L': '元大台灣50正2 (00631L)',
};

function priceSourceLabel(source: 'finmind' | 'fallback'): string {
  return source === 'finmind' ? 'FinMind API' : '防禦預設股價';
}

function line(label: string, value: string, width = 14): string {
  return `  ${label.padEnd(width, ' ')}${value}`;
}

export function renderReport(
  stockPrices: FetchStockPricesResult,
  result: PortfolioResult,
): string {
  const lines: string[] = [];
  const divider = '═'.repeat(52);

  lines.push(divider);
  lines.push('  0050 + 00631L 投資組合動態槓桿報表');
  lines.push(divider);

  lines.push('');
  lines.push('【市場行情】');
  for (const symbol of SYMBOLS) {
    const quote = stockPrices.quotes[symbol];
    const source = priceSourceLabel(quote.source);
    lines.push(
      line(
        SYMBOL_LABELS[symbol],
        `${formatPrice(quote.close)}  （${quote.date}，${source}）`,
        22,
      ),
    );
  }

  lines.push('');
  lines.push('【投資組合摘要】');
  const { summary } = result;
  lines.push(line('總市值', formatCurrency(summary.totalMarketValue)));
  lines.push(line('總曝險', formatCurrency(summary.totalExposure)));
  lines.push(line('整體槓桿', formatLeverage(summary.leverage)));
  lines.push(line('總成本', formatCurrency(summary.totalCost)));
  lines.push(line('未實現損益', formatCurrency(summary.unrealizedPnL)));
  lines.push(line('投資報酬率', formatPercent(summary.roiPercent)));

  lines.push('');
  lines.push('【資產明細】');
  for (const item of result.breakdown) {
    lines.push('');
    lines.push(`  ${SYMBOL_LABELS[item.symbol]}`);
    lines.push(line('持有股數', `${item.shares.toLocaleString('en-US')} 股`, 12));
    lines.push(line('每股成本', formatPrice(item.costPerShare), 12));
    lines.push(line('現價', formatPrice(item.currentPrice), 12));
    lines.push(line('市值', formatCurrency(item.marketValue), 12));
    lines.push(line('市值權重', formatPercent(item.weightPercent), 12));
    lines.push(line('曝險倍數', `${item.exposureMultiplier} 倍`, 12));
    lines.push(line('曝險金額', formatCurrency(item.exposure), 12));
    lines.push(line('成本基礎', formatCurrency(item.costBasis), 12));
    lines.push(line('未實現損益', formatCurrency(item.unrealizedPnL), 12));
  }

  if (stockPrices.warnings.length > 0) {
    lines.push('');
    lines.push('【警告】');
    for (const warning of stockPrices.warnings) {
      lines.push(`  ⚠ ${warning}`);
    }
  }

  lines.push('');
  lines.push(divider);

  return lines.join('\n');
}

export function renderHoldingsSummary(holdings: PortfolioHoldings): string {
  const lines = ['', '【輸入確認】'];
  for (const symbol of SYMBOLS) {
    const { shares, costPerShare } = holdings[symbol];
    lines.push(
      `  ${SYMBOL_LABELS[symbol]}：${shares.toLocaleString('en-US')} 股，每股成本 ${formatPrice(costPerShare)}`,
    );
  }
  return lines.join('\n');
}
