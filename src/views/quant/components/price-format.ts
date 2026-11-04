import { reactive } from 'vue';

const SYMBOL_PAGE_SIZE = 500;
const symbolTickSizes = reactive(new Map<string, string>());
let loadingTickSizes: Promise<void> | undefined;
let tickSizesLoaded = false;

const expandDecimal = (value: string): string | undefined => {
  const match = value.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);
  if (!match) return undefined;
  const [, sign, integer, fraction = '', exponentText = '0'] = match;
  const exponent = Number(exponentText);
  const digits = integer + fraction;
  const point = integer.length + exponent;
  if (!Number.isSafeInteger(point) || Math.abs(point) > 1000) return undefined;
  const plain = point <= 0 ? `0.${'0'.repeat(-point)}${digits}` : point >= digits.length ? `${digits}${'0'.repeat(point - digits.length)}` : `${digits.slice(0, point)}.${digits.slice(point)}`;
  return `${sign}${plain}`;
};

const priceScale = (tickSize: unknown): number | undefined => {
  if (tickSize === undefined || tickSize === null || tickSize === '') return undefined;
  const plain = expandDecimal(String(tickSize));
  if (!plain) return undefined;
  const normalized = plain.replace(/^[+-]/, '').replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
  if (!/[1-9]/.test(normalized)) return undefined;
  const fraction = normalized.split('.')[1] || '';
  return Math.min(16, fraction.length);
};

/** Round decimal strings with half-up semantics while retaining the tick-size scale. */
export const formatPriceByTickSize = (value: unknown, tickSize: unknown): string => {
  if (value === undefined || value === null || value === '') return '—';
  const raw = String(value);
  const scale = priceScale(tickSize);
  if (scale === undefined) return raw;
  const plain = expandDecimal(raw);
  if (!plain) return raw;
  const negative = plain.startsWith('-');
  const unsigned = plain.replace(/^[+-]/, '');
  const [whole, fraction = ''] = unsigned.split('.');
  const digits = `${whole}${fraction}`.replace(/^0+(?=\d)/, '');
  const sourceScale = fraction.length;
  let scaled: bigint;
  if (sourceScale <= scale) {
    scaled = BigInt(digits || '0') * 10n ** BigInt(scale - sourceScale);
  } else {
    const divisor = 10n ** BigInt(sourceScale - scale);
    const magnitude = BigInt(digits || '0');
    scaled = (magnitude + divisor / 2n) / divisor;
  }
  const rounded = scaled.toString().padStart(scale + 1, '0');
  const result = scale === 0 ? rounded : `${rounded.slice(0, -scale)}.${rounded.slice(-scale)}`;
  return `${negative && scaled !== 0n ? '-' : ''}${result}`;
};

/** Load symbol filters once for all quant pages; a denied/failed lookup leaves values untouched. */
export const ensureQuantSymbolTickSizes = (): Promise<void> => {
  if (tickSizesLoaded) return Promise.resolve();
  if (loadingTickSizes) return loadingTickSizes;
  loadingTickSizes = (async () => {
    const { listSymbol } = await import('@/api/quant');
    let pageNum = 1;
    let total = Number.POSITIVE_INFINITY;
    while ((pageNum - 1) * SYMBOL_PAGE_SIZE < total) {
      const result = await listSymbol({ pageNum, pageSize: SYMBOL_PAGE_SIZE });
      const rows = result.data?.rows || [];
      total = Number(result.data?.total ?? rows.length);
      rows.forEach(row => {
        if (row.symbol && row.priceTickSize) symbolTickSizes.set(row.symbol.toUpperCase(), String(row.priceTickSize));
      });
      if (rows.length < SYMBOL_PAGE_SIZE) break;
      pageNum += 1;
    }
    tickSizesLoaded = true;
  })().finally(() => {
    loadingTickSizes = undefined;
  });
  return loadingTickSizes;
};

export const cacheQuantSymbolTickSize = (symbol: string | undefined, tickSize: unknown): void => {
  if (symbol && tickSize !== undefined && tickSize !== null && tickSize !== '') symbolTickSizes.set(symbol.toUpperCase(), String(tickSize));
};

export const formatQuantPrice = (symbol: string | undefined, value: unknown): string =>
  formatPriceByTickSize(value, symbol ? symbolTickSizes.get(symbol.toUpperCase()) : undefined);

/** Format a table price without insignificant fractional trailing zeros. */
export const formatQuantPriceCompact = (symbol: string | undefined, value: unknown): string =>
  formatQuantPrice(symbol, value).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');

export const priceScaleFromTickSize = (tickSize: unknown): number | undefined => priceScale(tickSize);
