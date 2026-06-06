import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../../src/app';

const mockGetSavedHoldings = vi.fn();
const mockSaveHoldings = vi.fn();

vi.mock('../../src/services/portfolioStorageService', () => ({
  getSavedHoldings: (...args: unknown[]) => mockGetSavedHoldings(...args),
  saveHoldings: (...args: unknown[]) => mockSaveHoldings(...args),
}));

const validBody = {
  holdings: {
    '0050': { shares: 1000, costPerShare: 150.5 },
    '00631L': { shares: 500, costPerShare: 200.0 },
  },
};

describe('GET /api/v1/holdings', () => {
  beforeEach(() => {
    mockGetSavedHoldings.mockReset();
  });

  it('回傳已儲存的持股', async () => {
    mockGetSavedHoldings.mockResolvedValue(validBody.holdings);

    const response = await request(app).get('/api/v1/holdings');

    expect(response.status).toBe(200);
    expect(response.body.holdings).toEqual(validBody.holdings);
  });

  it('尚未儲存時回傳 null', async () => {
    mockGetSavedHoldings.mockResolvedValue(null);

    const response = await request(app).get('/api/v1/holdings');

    expect(response.status).toBe(200);
    expect(response.body.holdings).toBeNull();
  });
});

describe('PUT /api/v1/holdings', () => {
  beforeEach(() => {
    mockSaveHoldings.mockReset();
  });

  it('儲存持股並回傳', async () => {
    mockSaveHoldings.mockResolvedValue(undefined);

    const response = await request(app).put('/api/v1/holdings').send(validBody);

    expect(response.status).toBe(200);
    expect(response.body.holdings).toEqual(validBody.holdings);
    expect(mockSaveHoldings).toHaveBeenCalledWith(validBody.holdings);
  });

  it('缺少 holdings 回傳 400', async () => {
    const response = await request(app).put('/api/v1/holdings').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('holdings');
    expect(mockSaveHoldings).not.toHaveBeenCalled();
  });
});
