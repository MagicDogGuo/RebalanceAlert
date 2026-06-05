import axios, { type AxiosInstance } from 'axios';
import { config } from '../config';
import { SYMBOLS, type Symbol } from '../types/portfolio';
import type { FetchStockPricesResult, StockPriceQuote } from '../types/stockPrice';

const DATASET = 'TaiwanStockPrice';

interface FinMindPriceRow {
  date: string;
  stock_id: string;
  close: number;
}

interface FinMindResponse {
  msg: string;
  status: number;
  data: FinMindPriceRow[];
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLookbackDateRange(
  referenceDate: Date = new Date(),
  lookbackDays: number = config.lookbackDays,
): DateRange {
  const end = new Date(referenceDate);
  const start = new Date(referenceDate);
  start.setDate(start.getDate() - lookbackDays);

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

export function pickLatestTradingClose(
  rows: FinMindPriceRow[],
): { date: string; close: number } | null {
  const validRows = rows.filter((row) => Number.isFinite(row.close) && row.close > 0);
  if (validRows.length === 0) {
    return null;
  }

  const sorted = [...validRows].sort((a, b) => b.date.localeCompare(a.date));
  return { date: sorted[0].date, close: sorted[0].close };
}

function createFallbackQuote(symbol: Symbol): StockPriceQuote {
  const today = formatDate(new Date());
  return {
    symbol,
    close: config.fallbackPrices[symbol],
    date: today,
    source: 'fallback',
  };
}

function logFallbackWarning(symbol: Symbol, reason: string, fallbackPrice: number): string {
  const message =
    `[StockPriceService] ${symbol} FinMind API 無法取得股價，已改用預設防禦股價 ${fallbackPrice}（原因：${reason}）`;
  console.warn(message);
  return message;
}

async function fetchSymbolFromFinMind(
  symbol: Symbol,
  dateRange: DateRange,
  httpClient: AxiosInstance,
): Promise<StockPriceQuote> {
  const headers: Record<string, string> = {};
  if (config.finmindToken) {
    headers.Authorization = `Bearer ${config.finmindToken}`;
  }

  const response = await httpClient.get<FinMindResponse>(config.finmindApiUrl, {
    params: {
      dataset: DATASET,
      data_id: symbol,
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
    },
    headers,
    timeout: config.requestTimeoutMs,
  });

  if (response.data.status !== 200 || response.data.msg !== 'success') {
    throw new Error(`API 回應異常：${response.data.msg ?? 'unknown'}`);
  }

  const latest = pickLatestTradingClose(response.data.data ?? []);
  if (!latest) {
    throw new Error('回傳資料為空或無有效收盤價');
  }

  return {
    symbol,
    close: latest.close,
    date: latest.date,
    source: 'finmind',
  };
}

async function fetchSymbolWithFallback(
  symbol: Symbol,
  dateRange: DateRange,
  httpClient: AxiosInstance,
): Promise<{ quote: StockPriceQuote; warning?: string }> {
  try {
    const quote = await fetchSymbolFromFinMind(symbol, dateRange, httpClient);
    return { quote };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const fallback = createFallbackQuote(symbol);
    const warning = logFallbackWarning(symbol, reason, fallback.close);
    return { quote: fallback, warning };
  }
}

export async function fetchStockPrices(
  options?: {
    referenceDate?: Date;
    httpClient?: AxiosInstance;
  },
): Promise<FetchStockPricesResult> {
  const httpClient = options?.httpClient ?? axios;
  const dateRange = getLookbackDateRange(options?.referenceDate);

  const results = await Promise.all(
    SYMBOLS.map((symbol) => fetchSymbolWithFallback(symbol, dateRange, httpClient)),
  );

  const quotes = {} as Record<Symbol, StockPriceQuote>;
  const prices = {} as FetchStockPricesResult['prices'];
  const warnings: string[] = [];

  for (const result of results) {
    quotes[result.quote.symbol] = result.quote;
    prices[result.quote.symbol] = result.quote.close;
    if (result.warning) {
      warnings.push(result.warning);
    }
  }

  return { quotes, prices, warnings };
}
