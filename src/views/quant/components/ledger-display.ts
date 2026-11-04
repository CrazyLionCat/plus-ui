// 后端状态机/交易所协议值的展示名称；筛选请求仍提交原始代码。
export const financialEventTypes: Record<string, string> = {
  COMMISSION: '交易手续费',
  FUNDING_FEE: '资金费用',
  REALIZED_PNL: '已实现盈亏'
};
export const reconcileTypes: Record<string, string> = { FULL: '全量对账' };
export const reconcileResults: Record<string, string> = { SUCCESS: '成功', FAILED: '失败', DEGRADED: '需人工核查（保护单或成交归属异常）' };
export const notificationChannels: Record<string, string> = { SYSTEM: '系统通知', EMAIL: '邮件通知' };
export const notificationStatuses: Record<string, string> = {
  PENDING: '待发送',
  SENDING: '发送中',
  SENT: '已发送',
  RETRY: '等待重试',
  FAILED: '发送失败'
};
export const operationTypes: Record<string, string> = { OPEN: '开仓', CLOSE: '平仓', CANCEL: '撤单' };
export const executionStatuses: Record<string, string> = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  UNKNOWN: '结果未知',
  FAILED: '执行失败',
  RECOVERED: '已恢复确认'
};
export const protectionTypes: Record<string, string> = {
  HARD_STOP: '固定硬止损',
  LOCAL_STOP: '本地止损保护',
  FIRST_TP: '首次止盈',
  STEP_TP: '阶梯追踪止盈',
  EXCHANGE_CONDITIONAL: '交易所条件保护'
};
export const orderTypes: Record<string, string> = {
  LIMIT: '限价单',
  MARKET: '市价单',
  STOP: '止损限价单',
  STOP_MARKET: '止损市价单',
  TAKE_PROFIT: '止盈限价单',
  TAKE_PROFIT_MARKET: '止盈市价单',
  TRAILING_STOP_MARKET: '追踪止损市价单'
};
export const protectionStatuses: Record<string, string> = {
  NEW: '新建',
  WORKING: '生效中',
  ACCEPTED: '已受理',
  ACTIVE: '活动中',
  PARTIALLY_FILLED: '部分成交',
  FILLED: '已成交',
  FINISHED: '已完成',
  CANCELED: '已撤销',
  CANCELLED: '已撤销',
  EXPIRED: '已过期',
  REJECTED: '已拒绝',
  FAILED: '失败',
  MISSING: '交易所订单缺失',
  CANCEL_FAILED: '撤单失败',
  COMPLETED_OR_MISSING: '已完成或已缺失',
  TRIGGERED: '已触发',
  PENDING: '处理中'
};
// 未识别的交易所状态不得默认为成功或已完成；保留原始代码供故障排查。
export const displayLabel = (labels: Record<string, string>, value: unknown) => {
  if (value === undefined || value === null || value === '') return '-';
  return labels[String(value)] || `未知（${String(value)}）`;
};

export const labelOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

// 按字符串展开科学计数法，避免先转 Number 导致价格精度丢失。
export const displayDecimal = (value: unknown, maximumFractionDigits?: number): string => {
  if (value === undefined || value === null || value === '') return '-';
  const text = String(value);
  const match = text.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);
  if (!match) return text;
  const [, sign, integer, fraction = '', exponent = '0'] = match;
  const digits = integer + fraction;
  const point = integer.length + Number(exponent);
  if (!Number.isSafeInteger(point) || Math.abs(point) > 1000) return text;
  const expanded =
    point <= 0
      ? '0.' + '0'.repeat(-point) + digits
      : point >= digits.length
        ? digits + '0'.repeat(point - digits.length)
        : digits.slice(0, point) + '.' + digits.slice(point);

  if (maximumFractionDigits === undefined) {
    const decimal = expanded
      .replace(/^(0+)(?=\d)/, '')
      .replace(/(\.\d*?)0+$/, '$1')
      .replace(/\.$/, '');
    return /^0(?:\.0*)?$/.test(decimal) ? '0' : (sign === '-' ? '-' : '') + decimal;
  }

  const requestedScale = Number.isFinite(maximumFractionDigits) ? Math.trunc(maximumFractionDigits) : 8;
  const scale = Math.max(0, Math.min(1000, requestedScale));
  const [whole, decimalPart = ''] = expanded.split('.');
  const retainedFraction = decimalPart.slice(0, scale).padEnd(scale, '0');
  const scaledText = (whole + retainedFraction).replace(/^0+(?=\d)/, '') || '0';
  let scaled = BigInt(scaledText);
  if (decimalPart.length > scale && decimalPart.charAt(scale) >= '5') scaled += 1n;

  const rounded = scaled.toString().padStart(scale + 1, '0');
  const result = scale === 0 ? rounded : rounded.slice(0, -scale) + '.' + rounded.slice(-scale);
  const normalized = result
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '')
    .replace(/^(0+)(?=\d)/, '');
  if (/^0(?:\.0*)?$/.test(normalized)) return '0';
  return (sign === '-' ? '-' : '') + normalized;
};
