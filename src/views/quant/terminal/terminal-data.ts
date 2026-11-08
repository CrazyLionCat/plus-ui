import type {
  OrderSnapshot,
  PositionSnapshot,
  ProtectionOrderSnapshot,
  StrategyPositionStateVO,
  TradeRecord
} from '@/api/quant/types';

type RawFields = Record<string, unknown>;

export function slopeStreamQuery(
  rows: ReadonlyArray<{ symbol: string; interval: string }>,
  runMode = 'LIVE'
): URLSearchParams {
  const query = new URLSearchParams({ runMode });
  rows.forEach(row => {
    query.append('symbol', row.symbol);
    query.append('interval', row.interval);
  });
  return query;
}

export function chunkSlopeSubscriptions<T>(rows: ReadonlyArray<T>, size = 50): T[][] {
  if (!Number.isInteger(size) || size < 1) throw new RangeError('订阅批次大小必须为正整数');
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) chunks.push(rows.slice(index, index + size));
  return chunks;
}

/** Build a de-duplicated market subscription list for the chart and open positions. */
export function terminalMarketSubscriptions(
  chart: { symbol: string; interval: string },
  positions: ReadonlyArray<{ symbol: string; quantity: string | number }>
): Array<{ symbol: string; interval: string }> {
  const subscriptions = new Map<string, { symbol: string; interval: string }>();
  const add = (symbol: string, interval: string) => {
    const normalized = symbol.trim().toUpperCase();
    if (normalized) subscriptions.set(`${normalized}:${interval}`, { symbol: normalized, interval });
  };
  add(chart.symbol, chart.interval);
  positions.forEach(position => {
    const quantity = Number(position.quantity);
    if (!Number.isFinite(quantity) || Math.abs(quantity) <= 0) return;
    const normalized = position.symbol.trim().toUpperCase();
    add(normalized, normalized === chart.symbol.trim().toUpperCase() ? chart.interval : '1m');
  });
  return [...subscriptions.values()];
}

function numeric(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function calculateRealtimeSlope(
  currentPrice: unknown,
  referenceOpenPrice: unknown,
  entryAngleDegrees = 60
): { slopePercent: number; degrees: number; entryApproved: boolean } | undefined {
  const current = numeric(currentPrice);
  const reference = numeric(referenceOpenPrice);
  if (current === undefined || current <= 0 || reference === undefined || reference <= 0) return undefined;
  const slopePercent = Number((((current - reference) * 100) / reference).toFixed(5));
  const rawDegrees = (Math.atan(slopePercent) * 180) / Math.PI;
  return {
    slopePercent,
    degrees: Number(rawDegrees.toFixed(2)),
    entryApproved: Math.abs(rawDegrees) >= entryAngleDegrees
  };
}

/**
 * Exchange IDs are integers, NOT floating-point amounts.
 * Reject unsafe numbers: once JSON.parse has rounded an ID, its original value cannot be recovered.
 */
export function exactIntegerId(value: unknown): string | undefined {
  if (typeof value === 'string') return /^\d+$/.test(value) ? value : undefined;
  if (typeof value === 'bigint') return value >= 0n ? value.toString() : undefined;
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? String(value) : undefined;
}

/**
 * Binance private stream sends order/trade/algo IDs as numeric JSON tokens.
 * Quote these specific fields BEFORE JSON.parse to avoid IEEE-754 rounding.
 * This parser must only be used for trusted Binance user-data event envelopes.
 */
type BinanceAccountEvent = {
  e?: string;
  E?: unknown;
  T?: unknown;
  a?: { B?: RawFields[]; P?: RawFields[] };
  o?: RawFields;
};

export function parseBinanceAccountEvent(rawJson: string): BinanceAccountEvent {
  const idPreserved = rawJson.replace(/("(?:i|t|aid)"\s*:\s*)(\d+)(?=\s*[,}])/g, '$1"$2"');
  return JSON.parse(idPreserved) as BinanceAccountEvent;
}

/** Preserve the exact exchange decimal quantity when submitting a close command. */
export function exactCloseQuantity(value: string): string | undefined {
  const signed = value.trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(signed)) return undefined;
  const positive = signed.startsWith('-') ? signed.slice(1) : signed;
  return /[1-9]/.test(positive) ? positive : undefined;
}

export function positionMetrics(item: PositionSnapshot, liveMark?: number | string) {
  const freshMark = numeric(liveMark);
  const mark = freshMark && freshMark > 0 ? freshMark : numeric(item.markPrice);
  const validMark = mark && mark > 0 ? mark : undefined;
  const quantity = numeric(item.quantity);
  const entry = numeric(item.entryPrice);
  const calculated =
    validMark !== undefined && entry !== undefined && entry > 0 && quantity !== undefined
      ? (quantity < 0 || item.side === 'SHORT' ? entry - validMark : validMark - entry) * Math.abs(quantity)
      : undefined;
  const pnl = freshMark && freshMark > 0 ? calculated : (numeric(item.unrealizedPnl) ?? calculated);
  const notional = validMark !== undefined && quantity !== undefined ? Math.abs(quantity * validMark) : undefined;
  const margin =
    freshMark && freshMark > 0 && item.leverage && item.leverage > 0 && notional !== undefined
      ? notional / item.leverage
      : numeric(item.margin);
  return {
    ...item,
    markPrice: validMark,
    unrealizedPnl: pnl,
    notional,
    returnRate: margin !== undefined && margin > 0 && pnl !== undefined ? (pnl / margin) * 100 : undefined
  };
}

/** Sum unrealized PnL only when every open position has a fresh mark-price sample. */
export function aggregateLivePositionPnl(
  positions: ReadonlyArray<PositionSnapshot>,
  marks: ReadonlyMap<string, { price: string; receivedAt: number }>,
  now: number,
  maxAgeMs = 3000
): number | undefined {
  let total = 0;
  for (const position of positions) {
    const quantity = numeric(position.quantity);
    if (quantity === undefined) return undefined;
    if (quantity === 0) continue;
    const mark = marks.get(position.symbol.toUpperCase());
    if (!mark || mark.receivedAt > now || now - mark.receivedAt > maxAgeMs) return undefined;
    const pnl = positionMetrics(position, mark.price).unrealizedPnl;
    if (pnl === undefined) return undefined;
    total += pnl;
  }
  return total;
}

/** Return the highest Binance-style return-rate sample for this position cycle. */
export function positionMaximumReturnRate(
  position: PositionSnapshot,
  credentialId: string | number | undefined,
  histories: readonly StrategyPositionStateVO[],
  currentReturnRate?: number
): number | undefined {
  const quantity = numeric(position.quantity);
  const positionEntry = numeric(position.entryPrice);
  const direction =
    position.side === 'LONG' || position.side === 'SHORT'
      ? position.side
      : quantity !== undefined && quantity < 0
        ? 'SHORT'
        : 'LONG';
  const entryTolerance = positionEntry === undefined ? undefined : Math.max(positionEntry * 0.000001, 0.00000001);
  const matching = histories.filter(
    item =>
      credentialId !== undefined &&
      String(item.credentialId) === String(credentialId) &&
      item.symbol?.toUpperCase() === position.symbol.toUpperCase() &&
      item.direction?.toUpperCase() === direction &&
      entryTolerance !== undefined &&
      numeric(item.entryPrice) !== undefined &&
      Math.abs(numeric(item.entryPrice)! - positionEntry!) <= entryTolerance
  );
  const rates = matching.flatMap(item => {
    const rate = numeric(item.maximumReturnRate);
    return rate === undefined || !Number.isFinite(rate) ? [] : [rate];
  });
  if (currentReturnRate !== undefined && Number.isFinite(currentReturnRate)) rates.push(currentReturnRate);
  return rates.length ? Math.max(0, ...rates) : undefined;
}

export function mergeAccountPosition(previous: PositionSnapshot | undefined, raw: RawFields): PositionSnapshot {
  const row: PositionSnapshot = previous
    ? { ...previous }
    : {
        symbol: String(raw.s),
        side: String(raw.ps || 'BOTH'),
        quantity: '',
        entryPrice: '',
        markPrice: '',
        unrealizedPnl: '',
        liquidationPrice: '',
        margin: ''
      };
  // ACCOUNT_UPDATE does not contain mark price, leverage or position initial margin. iw is isolated wallet.
  if (numeric(raw.pa) !== undefined) {
    row.quantity = String(raw.pa);
    if (previous && row.quantity !== previous.quantity) row.margin = '';
  }
  if (numeric(raw.ep) !== undefined) row.entryPrice = String(raw.ep);
  if (numeric(raw.up) !== undefined) row.unrealizedPnl = String(raw.up);
  return row;
}

export function updateOrders(rows: OrderSnapshot[], raw: RawFields): OrderSnapshot[] {
  const id = exactIntegerId(raw.i);
  if (!raw.s || id === undefined || !raw.X) return rows;
  const remaining = rows.filter(row => row.symbol !== raw.s || row.orderId !== id);
  if (['FILLED', 'CANCELED', 'EXPIRED', 'EXPIRED_IN_MATCH', 'REJECTED'].includes(String(raw.X))) return remaining;
  const previous = rows.find(row => row.symbol === raw.s && row.orderId === id);
  return [
    {
      ...previous,
      symbol: String(raw.s),
      orderId: id,
      clientOrderId: String(raw.c ?? previous?.clientOrderId ?? ''),
      side: String(raw.S ?? previous?.side ?? ''),
      type: String(raw.o ?? previous?.type ?? ''),
      status: String(raw.X),
      price: String(raw.p ?? previous?.price ?? ''),
      originalQuantity: String(raw.q ?? previous?.originalQuantity ?? ''),
      executedQuantity: String(raw.z ?? previous?.executedQuantity ?? ''),
      updateTime: numeric(raw.T) !== undefined ? new Date(Number(raw.T)).toISOString() : (previous?.updateTime ?? '')
    },
    ...remaining
  ];
}

export function accountTrade(
  raw: RawFields,
  credentialId: string | number,
  formatTime: (time: number) => string
): TradeRecord | undefined {
  const quantity = numeric(raw.l),
    price = numeric(raw.L),
    tradeId = exactIntegerId(raw.t),
    orderId = exactIntegerId(raw.i),
    time = numeric(raw.T);
  if (
    raw.x !== 'TRADE' ||
    !raw.s ||
    !raw.S ||
    quantity === undefined ||
    quantity <= 0 ||
    price === undefined ||
    price <= 0 ||
    tradeId === undefined ||
    orderId === undefined ||
    time === undefined
  )
    return undefined;
  return {
    id: `${raw.s}:${tradeId}`,
    credentialId,
    customerName: '',
    userId: '',
    symbol: String(raw.s),
    side: String(raw.S),
    quantity: String(raw.l),
    price: String(raw.L),
    commission: String(raw.n ?? '0'),
    realizedPnl: String(raw.rp ?? '0'),
    tradeTime: formatTime(time),
    exchangeTradeId: tradeId,
    exchangeOrderId: orderId
  };
}

export function mergeTrades(current: TradeRecord[], incoming: TradeRecord[]): TradeRecord[] {
  const rows = new Map<string, TradeRecord>();
  for (const row of [...current, ...incoming]) rows.set(`${row.symbol}:${row.exchangeTradeId}`, row);
  return [...rows.values()]
    .toSorted((a, b) => {
      const byTime = b.tradeTime.localeCompare(a.tradeTime);
      if (byTime !== 0) return byTime;
      const older = BigInt(a.exchangeTradeId),
        newer = BigInt(b.exchangeTradeId);
      return newer > older ? 1 : newer < older ? -1 : 0;
    })
    .slice(0, 100);
}

export function positionSnapshotKey(symbol: string, side?: string): string {
  return `${symbol}:${side || 'BOTH'}`;
}

// Merge a REST snapshot with position events received after that snapshot started.
export function mergePositionSnapshots(
  snapshot: PositionSnapshot[],
  changes: ReadonlyMap<string, { revision: number; row?: PositionSnapshot }>,
  snapshotRevision: number
): PositionSnapshot[] {
  const rows = new Map(snapshot.map(row => [positionSnapshotKey(row.symbol, row.side), row]));
  for (const [key, change] of changes) {
    if (change.revision <= snapshotRevision) continue;
    if (!change.row || Number(change.row.quantity) === 0) {
      rows.delete(key);
      continue;
    }
    const latest = change.row;
    const snapshotRow = rows.get(key);
    rows.set(
      key,
      snapshotRow
        ? {
            ...snapshotRow,
            ...latest,
            markPrice: snapshotRow.markPrice,
            margin: snapshotRow.quantity === latest.quantity ? snapshotRow.margin : latest.margin,
            leverage: snapshotRow.leverage,
            liquidationPrice: snapshotRow.liquidationPrice
          }
        : latest
    );
  }
  return [...rows.values()];
}

export function mergePositionSymbolSnapshot(
  current: PositionSnapshot[],
  snapshot: PositionSnapshot[],
  symbol: string,
  changes: ReadonlyMap<string, { revision: number; row?: PositionSnapshot }>,
  snapshotRevision: number
): PositionSnapshot[] {
  const matchesSymbol = (row: PositionSnapshot) => row.symbol.toUpperCase() === symbol.toUpperCase();
  const symbolChanges = new Map([...changes].filter(([key]) => key.toUpperCase().startsWith(`${symbol.toUpperCase()}:`)));
  const merged = mergePositionSnapshots(snapshot.filter(matchesSymbol), symbolChanges, snapshotRevision);
  return [...current.filter(row => !matchesSymbol(row)), ...merged];
}

export function liveTradePage(rows: TradeRecord[], trade: TradeRecord, page: number, size: number): TradeRecord[] {
  return page === 1 ? mergeTrades(rows, [trade]).slice(0, size) : rows;
}

export function protectionPrices(position: PositionSnapshot, orders: ProtectionOrderSnapshot[]) {
  const closingSide = position.side === 'SHORT' || Number(position.quantity) < 0 ? 'BUY' : 'SELL';
  const matching = orders.filter(
    order =>
      order.symbol === position.symbol &&
      order.positionSide === position.side &&
      order.side === closingSide &&
      ['NEW', 'WORKING', 'ACCEPTED'].includes(order.status) &&
      (position.side !== 'BOTH' || order.reduceOnly === true || order.closePosition === true) &&
      Number(order.triggerPrice) > 0
  );
  const prices = (types: string[]) => [
    ...new Set(matching.filter(order => types.includes(order.type)).map(order => order.triggerPrice))
  ];
  return { takeProfit: prices(['TAKE_PROFIT', 'TAKE_PROFIT_MARKET']), stopLoss: prices(['STOP', 'STOP_MARKET']) };
}

export function protectionPriceLines(
  positions: PositionSnapshot[],
  orders: ProtectionOrderSnapshot[],
  symbol: string
): Array<{ value: number; kind: 'takeProfit' | 'stopLoss' }> {
  const lines = new Map<string, { value: number; kind: 'takeProfit' | 'stopLoss' }>();
  for (const position of positions) {
    if (position.symbol.toUpperCase() !== symbol.toUpperCase() || Number(position.quantity) === 0) continue;
    const prices = protectionPrices(position, orders);
    for (const [kind, values] of Object.entries(prices) as Array<['takeProfit' | 'stopLoss', string[]]>) {
      for (const rawValue of values) {
        const value = Number(rawValue);
        if (Number.isFinite(value) && value > 0) lines.set(`${kind}:${value}`, { value, kind });
      }
    }
  }
  return [...lines.values()];
}

export function updateProtectionOrders(
  rows: ProtectionOrderSnapshot[],
  raw: RawFields,
  time: number
): ProtectionOrderSnapshot[] {
  const id = exactIntegerId(raw.aid);
  if (!raw.s || id === undefined || !raw.X) return rows;
  const remaining = rows.filter(row => row.symbol !== raw.s || row.algoId !== id);
  if (['CANCELED', 'CANCELLED', 'EXPIRED', 'REJECTED', 'FINISHED', 'TRIGGERED'].includes(String(raw.X)))
    return remaining;
  const previous = rows.find(row => row.symbol === raw.s && row.algoId === id);
  return [
    {
      ...previous,
      symbol: String(raw.s),
      algoId: id,
      clientAlgoId: String(raw.caid ?? previous?.clientAlgoId ?? ''),
      status: String(raw.X),
      side: String(raw.S ?? previous?.side ?? ''),
      positionSide: String(raw.ps ?? previous?.positionSide ?? 'BOTH'),
      type: String(raw.o ?? previous?.type ?? ''),
      quantity: String(raw.q ?? previous?.quantity ?? ''),
      triggerPrice: String(raw.tp ?? previous?.triggerPrice ?? ''),
      updateTime: new Date(time).toISOString(),
      reduceOnly: typeof raw.R === 'boolean' ? raw.R : previous?.reduceOnly,
      closePosition: typeof raw.cp === 'boolean' ? raw.cp : previous?.closePosition
    },
    ...remaining
  ];
}
