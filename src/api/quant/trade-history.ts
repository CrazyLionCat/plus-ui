import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

export interface TradeHistoryRecord {
  id: string;
  credentialId: string;
  accountName: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  positionCycleKey: string | null;
  entryPrice: string;
  openingNotional: string | null;
  leverage: number | null;
  openingBalance: string | null;
  openingBalanceAt: string | null;
  openedAt: string;
  closePrice: string | null;
  closingBalance: string | null;
  closingBalanceAt: string | null;
  realizedPnl: string | null;
  commission: string | null;
  closedAt: string | null;
  status: 'OPEN' | 'CLOSED';
  openingQuantity: string;
  closingQuantity: string;
  remainingQuantity: string;
  openingFillCount: number;
  closingFillCount: number;
  openingOrderIds: string[];
  closingOrderIds: string[];
  openingTradeIds: string[];
  closingTradeIds: string[];
}
export interface TradeHistoryPage extends PageResult<TradeHistoryRecord> {
  incompleteCount: number;
}
export const listTradeHistory = (
  query: PageQuery & Record<string, string | number | undefined>
): AxiosPromise<TradeHistoryPage> => request({ url: '/quant/trade-history/page', method: 'get', params: query });
