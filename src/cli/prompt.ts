import { createInterface, type Interface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { SYMBOLS, type HoldingInput, type PortfolioHoldings, type Symbol } from '../types/portfolio';

const SYMBOL_LABELS: Record<Symbol, string> = {
  '0050': '元大台灣50 (0050)',
  '00631L': '元大台灣50正2 (00631L)',
};

export function parsePositiveInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function parseNonNegativeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

async function askPositiveInteger(rl: Interface, question: string): Promise<number> {
  while (true) {
    const answer = await rl.question(question);
    const value = parsePositiveInteger(answer);
    if (value !== null) {
      return value;
    }
    console.log('  ⚠ 請輸入正整數，請再試一次。');
  }
}

async function askNonNegativeNumber(rl: Interface, question: string): Promise<number> {
  while (true) {
    const answer = await rl.question(question);
    const value = parseNonNegativeNumber(answer);
    if (value !== null) {
      return value;
    }
    console.log('  ⚠ 請輸入大於等於 0 的數字，請再試一次。');
  }
}

async function promptHolding(rl: Interface, symbol: Symbol): Promise<HoldingInput> {
  console.log(`\n── ${SYMBOL_LABELS[symbol]} ──`);
  const shares = await askPositiveInteger(rl, '  持有股數：');
  const costPerShare = await askNonNegativeNumber(rl, '  每股成本（元）：');
  return { shares, costPerShare };
}

export async function promptHoldings(rl?: Interface): Promise<PortfolioHoldings> {
  const interface_ = rl ?? createInterface({ input, output });
  const shouldClose = !rl;

  try {
    console.log('\n請依序輸入您的持股資料：');

    const holdings = {} as PortfolioHoldings;
    for (const symbol of SYMBOLS) {
      holdings[symbol] = await promptHolding(interface_, symbol);
    }

    return holdings;
  } finally {
    if (shouldClose) {
      interface_.close();
    }
  }
}
