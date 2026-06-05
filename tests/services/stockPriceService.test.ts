import type { AxiosInstance } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchStockPrices,
  getLookbackDateRange,
  pickLatestTradingClose,
} from '../../src/services/stockPriceService';

describe('getLookbackDateRange (FR-02-2)', () => {
  it('涵蓋過去 7 個日曆日', () => {
    const range = getLookbackDateRange(new Date('2026-06-05'), 7);

    expect(range.startDate).toBe('2026-05-29');
    expect(range.endDate).toBe('2026-06-05');
  });
});

describe('pickLatestTradingClose (FR-02-2)', () => {
  it('回傳最新一個交易日的收盤價', () => {
    const latest = pickLatestTradingClose([
      { date: '2026-06-03', stock_id: '0050', close: 107.6 },
      { date: '2026-06-05', stock_id: '0050', close: 104.15 },
      { date: '2026-06-04', stock_id: '0050', close: 106.1 },
    ]);

    expect(latest).toEqual({ date: '2026-06-05', close: 104.15 });
  });

  it('忽略無效收盤價', () => {
    const latest = pickLatestTradingClose([
      { date: '2026-06-05', stock_id: '0050', close: 0 },
      { date: '2026-06-04', stock_id: '0050', close: 106.1 },
    ]);

    expect(latest).toEqual({ date: '2026-06-04', close: 106.1 });
  });

  it('空資料回傳 null', () => {
    expect(pickLatestTradingClose([])).toBeNull();
  });
});

describe('fetchStockPrices (FR-02)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('FR-02-1 成功從 FinMind 取得 0050 與 00631L 股價', async () => {
    const httpClient = {
      get: vi.fn().mockImplementation((_url: string, options: { params: { data_id: string } }) => {
        if (options.params.data_id === '0050') {
          return Promise.resolve({
            data: {
              msg: 'success',
              status: 200,
              data: [{ date: '2026-06-05', stock_id: '0050', close: 104.15 }],
            },
          });
        }

        return Promise.resolve({
          data: {
            msg: 'success',
            status: 200,
            data: [{ date: '2026-06-05', stock_id: '00631L', close: 36.67 }],
          },
        });
      }),
    } as unknown as AxiosInstance;

    const result = await fetchStockPrices({
      referenceDate: new Date('2026-06-05'),
      httpClient,
    });

    expect(result.prices['0050']).toBe(104.15);
    expect(result.prices['00631L']).toBe(36.67);
    expect(result.quotes['0050'].source).toBe('finmind');
    expect(result.quotes['00631L'].source).toBe('finmind');
    expect(result.warnings).toHaveLength(0);
    expect(httpClient.get).toHaveBeenCalledTimes(2);
  });

  it('FR-02-3 API 失敗時改用 Fallback 並記錄警告', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const httpClient = {
      get: vi.fn().mockRejectedValue(new Error('timeout')),
    } as unknown as AxiosInstance;

    const result = await fetchStockPrices({ httpClient });

    expect(result.prices['0050']).toBe(160.0);
    expect(result.prices['00631L']).toBe(210.0);
    expect(result.quotes['0050'].source).toBe('fallback');
    expect(result.quotes['00631L'].source).toBe('fallback');
    expect(result.warnings).toHaveLength(2);
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(result.warnings[0]).toContain('0050');
    expect(result.warnings[0]).toContain('160');
  });

  it('FR-02-3 回傳空資料時改用 Fallback', async () => {
    const httpClient = {
      get: vi.fn().mockResolvedValue({
        data: {
          msg: 'success',
          status: 200,
          data: [],
        },
      }),
    } as unknown as AxiosInstance;

    const result = await fetchStockPrices({ httpClient });

    expect(result.quotes['0050'].source).toBe('fallback');
    expect(result.warnings).toHaveLength(2);
  });

  it('請求參數包含 7 日區間與正確標的', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        msg: 'success',
        status: 200,
        data: [{ date: '2026-06-05', stock_id: '0050', close: 100 }],
      },
    });

    await fetchStockPrices({
      referenceDate: new Date('2026-06-10'),
      httpClient: { get } as unknown as AxiosInstance,
    });

    expect(get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({
          dataset: 'TaiwanStockPrice',
          start_date: '2026-06-03',
          end_date: '2026-06-10',
        }),
        timeout: 5000,
      }),
    );

    const requestedSymbols = get.mock.calls.map((call) => call[1].params.data_id);
    expect(requestedSymbols).toContain('0050');
    expect(requestedSymbols).toContain('00631L');
  });
});
