import type { LeverageAnalysisResponse } from '../types/api';
import { formatCurrency, formatLeverage, formatPercent } from '../utils/format';

function formatSummarySection(
  title: string,
  summary: LeverageAnalysisResponse['current']['summary'],
): string[] {
  return [
    title,
    `總市值：${formatCurrency(summary.totalMarketValue)}`,
    `總曝險：${formatCurrency(summary.totalExposure)}`,
    `整體槓桿：${formatLeverage(summary.leverage)}`,
    `總成本：${formatCurrency(summary.totalCost)}`,
    `未實現損益：${formatCurrency(summary.unrealizedPnL)}`,
    `投資報酬率：${formatPercent(summary.roiPercent)}`,
  ];
}

export function formatLeverageSummaryMessage(analysis: LeverageAnalysisResponse): string {
  const lines: string[] = [
    '📊 0050 + 00631L 槓桿分析日報',
    `資料日期：${analysis.prices['0050'].date}`,
    '',
    ...formatSummarySection('【現況摘要】', analysis.current.summary),
    '',
    `【買入時槓桿】${formatLeverage(analysis.atPurchase.leverage)}`,
    '',
    '【再平衡建議】',
    analysis.rebalance.summary,
  ];

  if (analysis.warnings.length > 0) {
    lines.push('', '【警告】');
    for (const warning of analysis.warnings) {
      lines.push(`⚠ ${warning}`);
    }
  }

  return lines.join('\n');
}
