const LEVERAGE_KEYWORDS = ['槓桿', '杠杆', 'leverage', '分析', '報告', '现況', '現況', 'summary', '查詢', '查询'];
const HELP_KEYWORDS = ['說明', '说明', 'help', '幫助', '帮助', '指令', '命令'];

export const LINE_HELP_MESSAGE = [
  '可用指令：',
  '• 傳送「槓桿」「分析」「報告」「現況」→ 查詢目前槓桿與再平衡建議',
  '• 傳送「說明」「help」→ 顯示此說明',
].join('\n');

export const LINE_WELCOME_MESSAGE = [
  '歡迎使用 RebalanceAlert！',
  '',
  '傳送「槓桿」或「分析」即可查詢目前 0050 + 00631L 投資組合槓桿狀況。',
].join('\n');

export type LineCommand = 'leverage' | 'help' | 'unknown';

export function parseLineCommand(text: string): LineCommand {
  const normalized = text.trim().toLowerCase();

  if (normalized.length === 0) {
    return 'unknown';
  }

  if (HELP_KEYWORDS.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
    return 'help';
  }

  if (LEVERAGE_KEYWORDS.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
    return 'leverage';
  }

  return 'unknown';
}
