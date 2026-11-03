export interface CredentialVO extends BaseEntity {
  id: string | number;
  userId: string | number;
  userName?: string;
  accountName: string;
  maskedApiKey: string;
  signatureType: string;
  runMode: string;
  status: string;
  connectionStatus: string;
  tradePermission?: boolean;
  withdrawalDisabled?: boolean;
  remark?: string;
}
export interface CredentialQuery extends PageQuery {
  accountName?: string;
  userId?: string | number;
  status?: string;
}
export interface CredentialForm {
  id?: string | number;
  userId: string | undefined;
  accountName: string;
  apiKey: string;
  secretKey?: string;
  signatureType: string;
  runMode: string;
  remark?: string;
}
export interface SymbolVO extends BaseEntity {
  id: string | number;
  symbol: string;
  quoteAsset: string;
  pricePrecision: number;
  quantityPrecision: number;
  priceTickSize: string;
  quantityStep: string;
  marketQuantityStep: string;
  minNotional: string;
  maxLeverage: number;
  exchangeStatus: string;
  status: string;
  favorite?: boolean;
  syncedAt?: string;
}
export interface SymbolQuery extends PageQuery {
  symbol?: string;
  quoteAsset?: string;
  status?: string;
  exchangeStatus?: string;
  favorite?: boolean;
}
export interface RiskVO extends BaseEntity {
  id: number;
  credentialId: number;
  liveEnabled: boolean;
  maxOrderNotional: string;
  dailyLossLimit: string;
  maxOpenPositions: number;
  maxOrdersPerMinute: number;
  websocketDisconnectAction: string;
  positionMismatchAction: string;
  protectionFailureAction: string;
  whitelist: boolean;
  notificationEmails?: string;
}
export interface RiskForm extends Omit<RiskVO, 'id' | 'credentialId' | 'createTime' | 'updateTime'> {
  id?: number;
  credentialId?: number;
}

export interface AccountSnapshot {
  walletBalance: string;
  availableBalance: string;
  marginBalance: string;
  unrealizedPnl: string;
}

export interface DailyAccountBaseline {
  equity: string;
  observedAt: string;
}

export interface PositionSnapshot {
  symbol: string;
  side: string;
  quantity: string;
  entryPrice: string;
  markPrice: string;
  unrealizedPnl: string;
  liquidationPrice: string;
  margin: string;
  leverage?: number;
  maximumReturnRate?: number;
  takeProfitPrice?: string;
  stopLossPrice?: string;
}

export interface OrderSnapshot {
  symbol: string;
  orderId: string;
  clientOrderId: string;
  side: string;
  type: string;
  status: string;
  price: string;
  originalQuantity: string;
  executedQuantity: string;
  updateTime: string;
}
export interface OrderLedgerRow {
  id: string | number;
  credentialId: string | number;
  customerName?: string;
  symbol: string;
  orderId?: string | null;
  clientOrderId?: string | null;
  side: string;
  positionSide?: string | null;
  reduceOnly?: boolean | null;
  type: string;
  price: string | number;
  originalQuantity: string | number;
  executedQuantity: string | number;
  tradeCount: number;
  status: string;
  updateTime?: string;
}

export interface ProtectionOrderSnapshot {
  symbol: string;
  algoId: string;
  clientAlgoId: string;
  status: string;
  side: string;
  positionSide: string;
  type: string;
  quantity: string;
  triggerPrice: string;
  updateTime: string;
  executedQuantity?: string;
  reduceOnly?: boolean;
  closePosition?: boolean;
}

export interface TradeSnapshot {
  symbol: string;
  tradeId: string;
  orderId: string;
  side: string;
  quantity: string;
  price: string;
  commission: string;
  realizedPnl: string;
  time: string;
}

export interface TradeRecord {
  id: string | number;
  credentialId: string | number;
  customerName: string;
  userId: string | number;
  userName?: string;
  symbol: string;
  side: string;
  quantity: string;
  price: string;
  commission: string;
  realizedPnl: string;
  tradeTime: string;
  exchangeTradeId: string;
  exchangeOrderId: string;
}

export interface StrategyPluginVO {
  code: string;
  version: string;
  name: string;
  paramsExample?: Record<string, number | string | boolean>;
}

export interface ClosePositionForm {
  credentialId: string | number;
  symbol: string;
  side: string;
  positionSide: string;
  quantity: string | number;
  idempotencyKey: string;
}

export interface PriceSnapshot {
  symbol: string;
  lastTradePrice: string;
  markPrice: string;
  observedAt: string;
}

export interface KlineSnapshot {
  openTime: string;
  closeTime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closed: boolean;
}

export interface CancelOrderForm {
  credentialId: string | number;
  symbol: string;
  orderId: string;
  clientOrderId?: string;
  idempotencyKey: string;
}

export interface StrategyVO extends BaseEntity {
  id: number | string;
  strategyName: string;
  pluginCode: string;
  pluginVersion?: string;
  strategyType?: string;
  maxOpenCount?: number;
  defaultInterval?: string;
  defaultOpenRatio?: string | number;
  defaultStopLossRatio?: string | number;
  stopLossRatio?: string | number;
  hardStopMarginLossRatio?: string | number;
  defaultLeverage?: number;
  defaultMarginMode?: string;
  paramsJson?: string;
  status: string;
}
export type StrategyForm = Partial<StrategyVO> & Pick<StrategyVO, 'strategyName' | 'pluginCode'>;
export interface StrategyAccountBinding {
  id?: number | string;
  strategyId?: number | string;
  credentialId: number | string;
  status?: string;
}
export interface StrategyUserBinding {
  id?: number | string;
  strategyId?: number | string;
  userId: number | string;
  status?: string;
}
export interface StrategySymbolBinding {
  id?: number | string;
  strategyId?: number | string;
  symbolId: number | string;
  intervalCode?: string;
  openRatio?: string | number;
  stopLossRatio?: string | number;
  hardStopMarginLossRatio?: string | number;
  leverage?: number;
  marginMode?: string;
  paramsJson?: string;
  status?: string;
  runtimeEnabled?: boolean;
}
export interface StrategyPreflightResult {
  valid: boolean;
  instanceCount: number;
  accounts: Array<{ credentialId: number | string; accountName?: string }>;
  symbols: Array<{
    symbolId: number | string;
    symbol?: string;
    intervalCode?: string;
    openRatio?: number;
    stopLossRatio?: number;
    leverage?: number;
    marginMode?: string;
  }>;
  errors: string[];
  warnings: string[];
}
export interface StrategyInstanceVO {
  id: number | string;
  strategyId?: number | string;
  strategyName?: string;
  strategySymbolId?: number | string;
  runtimeEnabled?: boolean;
  credentialId?: number | string;
  accountName?: string;
  symbol?: string;
  status?: string;
  lastSignalAt?: string;
  lastError?: string;
}
export interface StrategyQuery extends PageQuery {
  strategyName?: string;
  status?: string;
}
export interface StrategyInstanceQuery extends PageQuery {
  credentialId?: number | string;
  status?: string;
}
export interface StrategyPositionStateQuery extends PageQuery {
  credentialId?: number | string;
  status?: string;
}
export interface StrategyPositionStateVO {
  id: number | string;
  instanceId?: number | string;
  positionId?: number | string;
  positionCycleKey?: string;
  instanceName?: string;
  credentialId?: number | string;
  status?: string;
  statusLabel?: string;
  direction?: string;
  directionLabel?: string;
  symbol?: string;
  entryPrice?: string | number;
  positionQty?: string | number;
  initialPositionQty?: string | number;
  initialMargin?: string | number;
  maximumReturnRate?: string | number;
  highestPriceSinceEntry?: string | number;
  lowestPriceSinceEntry?: string | number;
  highestStep?: number;
  firstTakeProfitTriggered?: boolean;
  pendingAction?: string;
  recoveryRequired?: boolean;
  recoveryRequiredLabel?: string;
  unsafeRecovery?: boolean;
  updatedAt?: string;
}
export interface DashboardOverview {
  credentialCount: number;
  positionCount: number;
  orderCount: number;
  tradeCount: number;
  runningInstanceCount: number;
  unknownExecutionCount: number;
  pendingNotificationCount: number;
}
export interface ExecutionRecordVO {
  id: number | string;
  credentialId?: number | string;
  accountName?: string;
  symbol?: string;
  executionStatus?: string;
  exchangeOrderStatus?: string;
  operationType?: string;
  idempotencyKey?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface ExecutionQuery extends PageQuery {
  symbol?: string;
  startTime?: string;
  endTime?: string;
  credentialId?: number | string;
  executionStatus?: string;
  exchangeOrderStatus?: string;
}
/** 当前应用节点的 Binance WebSocket 传输模式（需要基础设施权限）。 */
export interface WebSocketTransportInfo {
  transport: 'RAW_OKHTTP' | 'BINANCE_SDK';
  scope: 'THIS_NODE';
  streamsReconnected?: number;
}

/** All identifiers are serialized as strings to preserve Binance/Snowflake precision. */
export interface UnresolvedLiveDispatch {
  credentialId: string;
  symbol: string;
  dispatchKey: string;
  operation: string | null;
  clientOrderId: string | null;
  status: string | null;
  exchangeOrderId: string | null;
  strategyInstanceId: string | null;
  leaseEpoch: string | null;
  blockedAt: string | null;
}

/** Only lifetime verified Binance fill facts, NOT a current strategy position. */
export interface StrategyFillAuditSummary {
  credentialId: string;
  strategyId: string;
  instanceId: string;
  symbol: string;
  allocationScope: 'LIFETIME_VERIFIED_FILLS_NOT_OPEN_POSITION';
  fillCount: string;
  boughtQty: string;
  soldQty: string;
  boughtNotional: string;
  soldNotional: string;
  totalFees: string | null;
  feeAsset: string | null;
  feeBreakdown: Array<{ asset: string; amount: string }>;
  realizedPnl: string;
}
