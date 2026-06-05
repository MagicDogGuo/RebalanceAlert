import type { PortfolioPrices } from '../types/portfolio';

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  finmindApiUrl: process.env.FINMIND_API_URL ?? 'https://api.finmindtrade.com/api/v4/data',
  finmindToken: process.env.FINMIND_TOKEN,
  requestTimeoutMs: 5000,
  lookbackDays: 7,
  fallbackPrices: {
    '0050': readNumber(process.env.FALLBACK_PRICE_0050, 160.0),
    '00631L': readNumber(process.env.FALLBACK_PRICE_00631L, 210.0),
  } satisfies PortfolioPrices,
};
