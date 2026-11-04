import { reactive } from 'vue';

const SYMBOL_PAGE_SIZE = 500;
const symbolTickSizes = reactive(new Map<string, string>());
const symbolPricePrecisions = reactive(new Map<string, number>());
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

const precisionScale = (precision: unknown): number | undefined => {
  if (precision === undefined || precision === null || precision === '') return undefined;
  const scale = Number(precision);
  return Number.isInteger(scale) && scale >= 0 && scale <= 16 ? scale : undefined;
};

/** Round decimal strings to the symbol price precision without converting through Number. */
export const formatPriceByTickSize = (value: unknown, tickSize: unknown, fallbackPrecision?: unknown, trimTrailingZeros = false): string => {
  if (value === undefined || value === null || value === '') return '—';
  const raw = String(value);
  const scale = priceScale(tickSize) ?? precisionScale(fallbackPrecision);
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
  let outputScale = scale;
  if (trimTrailingZeros) {
    while (outputScale > 0 && scaled % 10n === 0n) {
      scaled /= 10n;
      outputScale -= 1;
    }
  }
  const rounded = scaled.toString().padStart(outputScale + 1, '0');
  const result = outputScale === 0 ? rounded : `${rounded.slice(0, -outputScale)}.${rounded.slice(-outputScale)}`;
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
        if (!row.symbol) return;
        const key = row.symbol.toUpperCase();
        if (row.priceTickSize) symbolTickSizes.set(key, String(row.priceTickSize));
        if (Number.isInteger(row.pricePrecision) && row.pricePrecision >= 0) symbolPricePrecisions.set(key, row.pricePrecision);
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

export const cacheQuantSymbolTickSize = (symbol: string | undefined, tickSize: unknown, pricePrecision?: unknown): void => {
  if (!symbol) return;
  const key = symbol.toUpperCase();
  if (tickSize !== undefined && tickSize !== null && tickSize !== '') symbolTickSizes.set(key, String(tickSize));
  if (precisionScale(pricePrecision) !== undefined) symbolPricePrecisions.set(key, Number(pricePrecision));
};

export const formatQuantPrice = (symbol: string | undefined, value: unknown): string =>
  formatPriceByTickSize(value, symbol ? symbolTickSizes.get(symbol.toUpperCase()) : undefined);

export const formatQuantTablePrice = (symbol: string | undefined, value: unknown): string => {
  const key = symbol?.toUpperCase();
  return formatPriceByTickSize(value, key ? symbolTickSizes.get(key) : undefined, key ? symbolPricePrecisions.get(key) : undefined, true);
};

export const priceScaleFromTickSize = (tickSize: unknown): number | undefined => priceScale(tickSize);
