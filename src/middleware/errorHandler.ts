import type { NextFunction, Request, Response } from 'express';
import { PortfolioValidationError, SavedHoldingsNotFoundError } from '../models/portfolio';
import type { ErrorResponse } from '../types/api';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
): void {
  if (error instanceof PortfolioValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof SavedHoldingsNotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : '未知錯誤';
  console.error('[ErrorHandler]', message);
  res.status(500).json({ error: '伺服器內部錯誤' });
}
