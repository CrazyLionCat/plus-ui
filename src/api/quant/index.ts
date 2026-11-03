import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  AccountSnapshot,
  DailyAccountBaseline,
  CancelOrderForm,
  ClosePositionForm,
  CredentialForm,
  CredentialQuery,
  CredentialVO,
  KlineSnapshot,
  OrderSnapshot,
  ProtectionOrderSnapshot,
  PositionSnapshot,
  RiskForm,
  RiskVO,
  PriceSnapshot,
  SymbolQuery,
  SymbolVO,
  TradeSnapshot,
  TradeRecord,
  StrategyPluginVO,
  StrategyQuery,
  StrategyInstanceQuery,
  StrategyPositionStateQuery,
  ExecutionQuery,
  StrategyPreflightResult,
  StrategyUserBinding,
  WebSocketTransportInfo,
  UnresolvedLiveDispatch,
  StrategyFillAuditSummary
} from './types';

export const listCredential = (query: CredentialQuery): AxiosPromise<PageResult<CredentialVO>> =>
  request({ url: '/quant/credential/list', method: 'get', params: query });
export const addCredential = (data: CredentialForm) => request({ url: '/quant/credential', method: 'post', data });
export const updateCredential = (data: CredentialForm) => request({ url: '/quant/credential', method: 'put', data });
export const delCredential = (id: number | number[]) => request({ url: `/quant/credential/${id}`, method: 'delete' });
export const changeCredentialStatus = (id: string | number, status: string) =>
  request({ url: '/quant/credential/changeStatus', method: 'put', params: { id, status } });
export const testCredential = (id: string) => request({ url: `/quant/credential/${id}/test`, method: 'post' });
export const listSymbol = (query: SymbolQuery, signal?: AbortSignal): AxiosPromise<PageResult<SymbolVO>> =>
  request({ url: '/quant/symbol/list', method: 'get', params: query, signal });
export const getSymbol = (id: number | string, signal?: AbortSignal): AxiosPromise<SymbolVO> =>
  request({ url: `/quant/symbol/${id}`, method: 'get', signal });
export const syncSymbol = () => request({ url: '/quant/symbol/sync', method: 'post' });
export const addSymbol = (data: Partial<SymbolVO>) => request({ url: '/quant/symbol', method: 'post', data });
export const updateSymbol = (data: Partial<SymbolVO>) => request({ url: '/quant/symbol', method: 'put', data });
export const delSymbol = (id: number | number[]) => request({ url: `/quant/symbol/${id}`, method: 'delete' });
export const toggleSymbolFavorite = (id: number | string, favorite: boolean) =>
  request({ url: `/quant/symbol/${id}/favorite`, method: 'post', data: { favorite } });
export const listRisk = (query: PageQuery): AxiosPromise<PageResult<RiskVO>> =>
  request({ url: '/quant/risk/list', method: 'get', params: query });
export const getRisk = (id: number): AxiosPromise<RiskVO> => request({ url: `/quant/risk/${id}`, method: 'get' });
export const addRisk = (data: RiskForm) => request({ url: '/quant/risk', method: 'post', data });
export const updateRisk = (data: RiskForm) => request({ url: '/quant/risk', method: 'put', data });
export const delRisk = (id: number | number[]) => request({ url: `/quant/risk/${id}`, method: 'delete' });

export const getAccountSnapshot = (credentialId: string | number, signal?: AbortSignal): AxiosPromise<AccountSnapshot> =>
  request({ url: `/quant/account/${credentialId}`, method: 'get', signal });
export const getDailyAccountBaseline = (credentialId: string | number, signal?: AbortSignal): AxiosPromise<DailyAccountBaseline | null> =>
  request({ url: `/quant/account/${credentialId}/daily-baseline`, method: 'get', signal });
export const listPositions = (credentialId: string | number, symbol?: string, signal?: AbortSignal): AxiosPromise<PositionSnapshot[]> =>
  request({ url: `/quant/position/${credentialId}`, method: 'get', params: { symbol }, signal });
export const listOrders = (credentialId: string | number, symbol?: string, signal?: AbortSignal): AxiosPromise<OrderSnapshot[]> =>
  request({ url: `/quant/order/${credentialId}`, method: 'get', params: { symbol }, signal });
export const listProtectionOrders = (
  credentialId: string | number,
  symbol?: string,
  signal?: AbortSignal
): AxiosPromise<ProtectionOrderSnapshot[]> =>
  request({ url: `/quant/order/${credentialId}/protection`, method: 'get', params: { symbol }, signal });
export const listTrades = (
  credentialId: string | number,
  symbol: string | undefined,
  query: PageQuery & { side?: string; from?: string; to?: string },
  signal?: AbortSignal
): AxiosPromise<PageResult<TradeRecord>> =>
  request({ url: `/quant/trade/${credentialId}/page`, method: 'get', params: { symbol, ...query }, signal });
export const listAccessibleTrades = (
  credentialId: string | number | undefined,
  symbol: string | undefined,
  query: PageQuery & { side?: string; from?: string; to?: string }
): AxiosPromise<PageResult<TradeRecord>> =>
  request({ url: '/quant/trade/page', method: 'get', params: { credentialId, symbol, ...query } });
export const syncTrades = (credentialId: string | number, symbol: string) =>
  request({ url: `/quant/trade/${credentialId}/sync`, method: 'post', params: { symbol } });
export const listStrategyPlugins = (): AxiosPromise<StrategyPluginVO[]> =>
  request({ url: '/quant/strategy/plugins', method: 'get' });
export const getRealtimePrice = (symbol: string): AxiosPromise<PriceSnapshot> =>
  request({ url: '/quant/market/price', method: 'get', params: { symbol } });
export const listRealtimeKlines = (
  symbol: string,
  interval: string,
  limit = 100,
  runMode = 'LIVE',
  signal?: AbortSignal
): AxiosPromise<KlineSnapshot[]> =>
  request({ url: '/quant/market/klines', method: 'get', params: { symbol, interval, limit, runMode }, signal });
export const closePosition = (data: ClosePositionForm) =>
  request({ url: '/quant/execution/close', method: 'post', data });
export const cancelOrder = (data: CancelOrderForm) => request({ url: '/quant/execution/cancel', method: 'post', data });

import type {
  StrategyVO,
  StrategyForm,
  StrategyInstanceVO,
  StrategyPositionStateVO,
  StrategyAccountBinding,
  StrategySymbolBinding,
  DashboardOverview,
  ExecutionRecordVO,
} from './types';

export const listStrategies = (query: StrategyQuery): AxiosPromise<PageResult<StrategyVO>> =>
  request({ url: '/quant/strategy/list', method: 'get', params: query });
export const getStrategy = (id: number | string): AxiosPromise<StrategyVO> =>
  request({ url: '/quant/strategy/' + id, method: 'get' });
export const addStrategy = (data: StrategyForm) => request({ url: '/quant/strategy', method: 'post', data });
export const updateStrategy = (data: StrategyForm) => request({ url: '/quant/strategy', method: 'put', data });
export const delStrategy = (id: number | string | number[]) =>
  request({ url: '/quant/strategy/' + id, method: 'delete' });
export const startStrategy = (id: number | string) =>
  request({ url: '/quant/strategy/' + id + '/start', method: 'post' });
export const stopStrategy = (id: number | string) =>
  request({ url: '/quant/strategy/' + id + '/stop', method: 'post' });
export const preflightStrategy = (id: number | string): AxiosPromise<StrategyPreflightResult> =>
  request({ url: '/quant/strategy/' + id + '/preflight', method: 'get' });
export const listStrategyAccounts = (id: number | string): AxiosPromise<StrategyAccountBinding[]> =>
  request({ url: '/quant/strategy/' + id + '/accounts', method: 'get' });
export const bindStrategyAccount = (id: number | string, data: StrategyAccountBinding) =>
  request({ url: '/quant/strategy/' + id + '/accounts', method: 'post', data });
export const unbindStrategyAccount = (id: number | string, credentialId: number | string) =>
  request({ url: '/quant/strategy/' + id + '/accounts/' + credentialId, method: 'delete' });
export const replaceStrategyAccounts = (id: number | string, credentialIds: Array<number | string>) =>
  request({ url: '/quant/strategy/' + id + '/accounts', method: 'put', data: { credentialIds } });
export const listStrategyUsers = (id: number | string): AxiosPromise<StrategyUserBinding[]> =>
  request({ url: '/quant/strategy/' + id + '/users', method: 'get' });
export const replaceStrategyUsers = (id: number | string, userIds: Array<number | string>) =>
  request({ url: '/quant/strategy/' + id + '/users', method: 'put', data: { userIds } });
export const listStrategySymbols = (id: number | string, signal?: AbortSignal): AxiosPromise<StrategySymbolBinding[]> =>
  request({ url: '/quant/strategy/' + id + '/symbols', method: 'get', signal });
export const setStrategySymbolRuntimeEnabled = (strategyId: number | string, strategySymbolId: number | string, enabled: boolean) =>
  request({ url: `/quant/strategy/${strategyId}/symbols/${strategySymbolId}/runtime`, method: 'post', params: { enabled } });
export const bindStrategySymbol = (id: number | string, data: StrategySymbolBinding) =>
  request({ url: '/quant/strategy/' + id + '/symbols', method: 'post', data });
export const unbindStrategySymbol = (id: number | string, symbolId: number | string) =>
  request({ url: '/quant/strategy/' + id + '/symbols/' + symbolId, method: 'delete' });
export const replaceStrategySymbols = (id: number | string, items: StrategySymbolBinding[]) =>
  request({ url: '/quant/strategy/' + id + '/symbols', method: 'put', data: { items } });
export const listStrategyInstances = (query: StrategyInstanceQuery, signal?: AbortSignal): AxiosPromise<PageResult<StrategyInstanceVO>> =>
  request({ url: '/quant/strategy/instances', method: 'get', params: query, signal });
export const listStrategyPositionStates = (
  query: StrategyPositionStateQuery,
  signal?: AbortSignal
): AxiosPromise<PageResult<StrategyPositionStateVO>> =>
  request({ url: '/quant/strategy/position-states', method: 'get', params: query, signal });

export const getDashboardOverview = (): AxiosPromise<DashboardOverview> =>
  request({ url: '/quant/dashboard/overview', method: 'get' });
export const listExecution = (query: ExecutionQuery): AxiosPromise<PageResult<ExecutionRecordVO>> =>
  request({ url: '/quant/execution/page', method: 'get', params: query });

/** 运维端：节点级 Binance WebSocket 传输查询与切换。 */

export const getStrategyFillAuditSummary = (params: {
  credentialId: string; strategyId: string; instanceId: string; symbol: string;
}): AxiosPromise<StrategyFillAuditSummary> =>
  request({ url: '/quant/infrastructure/fill-audit/summary', method: 'get', params });

export const listUnresolvedLiveDispatches = (): AxiosPromise<UnresolvedLiveDispatch[]> =>
  request({ url: '/quant/infrastructure/dispatch/unresolved', method: 'get' });


export const getWebSocketTransport = (): AxiosPromise<WebSocketTransportInfo> =>
  request({ url: '/quant/infrastructure/websocket/transport', method: 'get' });

export const switchWebSocketTransport = (mode: WebSocketTransportInfo['transport']): AxiosPromise<WebSocketTransportInfo> =>
  request({
    url: '/quant/infrastructure/websocket/transport',
    method: 'post',
    params: { mode, acknowledgeReconnectionRisk: true }
  });
