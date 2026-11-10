import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

export interface TradeHistoryRecord {
  id: string;
  credentialId: string;
  accountName: string;
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'UNKNOWN';
  entryPrice: string | null;
  openingNotional: string | null;
  leverage: number | null;
  openingBalance: string | null;
  openingBalanceAt: string | null;
  openedAt: string;
  closePrice: string | null;
  closingEquity: string | null;
  walletBalance: string | null;
  unrealizedPnl: string | null;
  closingEquityAt: string | null;
  realizedPnl: string | null;
  commission: string | null;
  closedAt: string | null;
  status: 'OPEN' | 'PARTIAL' | 'CLOSED' | 'RECONCILE_REQUIRED';
  reconstructionSource: 'EXCHANGE' | 'INFERRED';
  reconciliationStatus: 'VERIFIED' | 'INFERRED' | 'RECONCILE_REQUIRED';
  reconciliationReason?: string | null;
}
export interface TradeHistoryPage extends PageResult<TradeHistoryRecord> {
  incompleteCount: number;
  inferredCount: number;
}
export const listTradeHistory = (
  query: PageQuery & Record<string, string | number | undefined>
): AxiosPromise<TradeHistoryPage> => request({ url: '/quant/trade-history/page', method: 'get', params: query });
