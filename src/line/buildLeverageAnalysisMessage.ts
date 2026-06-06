import { formatLeverageSummaryMessage } from './formatLeverageSummaryMessage';
import { getLeverageAnalysis, SavedHoldingsNotFoundError } from '../services/leverageAnalysisService';

const HOLDINGS_NOT_FOUND_MESSAGE =
  '⚠ 尚未儲存持股資料，請先透過 API 或網頁儲存持股後再查詢。';

export async function buildLeverageAnalysisMessage(): Promise<string> {
  try {
    const analysis = await getLeverageAnalysis();
    return formatLeverageSummaryMessage(analysis);
  } catch (error) {
    if (error instanceof SavedHoldingsNotFoundError) {
      return HOLDINGS_NOT_FOUND_MESSAGE;
    }

    throw error;
  }
}
