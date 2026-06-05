import 'dotenv/config';
import { calculatePortfolio } from '../models/portfolio';
import { fetchStockPrices } from '../services/stockPriceService';
import { promptHoldings } from './prompt';
import { renderHoldingsSummary, renderReport } from './report';

async function run(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   0050 + 00631L 投資組合動態槓桿計算器             ║');
  console.log('╚════════════════════════════════════════════════════╝');

  const holdings = await promptHoldings();
  console.log(renderHoldingsSummary(holdings));

  console.log('\n正在從 FinMind 取得最新股價，請稍候...');
  const stockPrices = await fetchStockPrices();
  const result = calculatePortfolio(holdings, stockPrices.prices);

  console.log('\n' + renderReport(stockPrices, result));
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n執行失敗：${message}`);
  process.exitCode = 1;
});
