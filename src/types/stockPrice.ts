import type { PortfolioPrices, Symbol } from './portfolio';

export type StockPriceSource = 'finmind' | 'fallback';

export interface StockPriceQuote {
  symbol: Symbol;
  close: number;
  date: string;
  source: StockPriceSource;
}

export interface FetchStockPricesResult {
  quotes: Record<Symbol, StockPriceQuote>;
  prices: PortfolioPrices;
  warnings: string[];
}
