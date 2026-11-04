import { describe, expect, it } from 'vitest';
import { cacheQuantSymbolTickSize, formatPriceByTickSize, formatQuantPrice, formatQuantTablePrice } from '../price-format';

describe('formatPriceByTickSize', () => {
  it('rounds prices to the decimal precision implied by tickSize', () => {
    expect(formatPriceByTickSize('1.235', '0.01000000')).toBe('1.24');
    expect(formatPriceByTickSize('1.2', '0.010')).toBe('1.20');
  });

  it('handles scientific notation without converting prices through floating point', () => {
    expect(formatPriceByTickSize('1.9e-8', '1e-8')).toBe('0.00000002');
    expect(formatPriceByTickSize('9.999e-7', '0.0000001')).toBe('0.0000010');
  });

  it('preserves the original value when tickSize or price is unavailable', () => {
    expect(formatPriceByTickSize('1.234500', undefined)).toBe('1.234500');
    expect(formatPriceByTickSize('not-a-price', '0.01')).toBe('not-a-price');
    expect(formatPriceByTickSize(undefined, '0.01')).toBe('—');
  });

  it('uses the cached tickSize for symbols without altering the raw value source', () => {
    cacheQuantSymbolTickSize('testusdt', '0.001');
    expect(formatQuantPrice('TESTUSDT', '12.3456')).toBe('12.346');
    expect(formatQuantPrice('UNKNOWNUSDT', '12.3456')).toBe('12.3456');
  });
});

describe('formatQuantTablePrice', () => {
  it('rounds long prices to the symbol tick precision and omits padding zeros', () => {
    cacheQuantSymbolTickSize('BTCUSDT', '0.0001', 4);
    expect(formatQuantTablePrice('BTCUSDT', '23.0546822307066408')).toBe('23.0547');
    expect(formatQuantTablePrice('BTCUSDT', '23.054600000')).toBe('23.0546');
    expect(formatQuantTablePrice('BTCUSDT', '23.05')).toBe('23.05');
  });

  it('uses pricePrecision when a tick size is unavailable', () => {
    cacheQuantSymbolTickSize('FALLBACKUSDT', undefined, 3);
    expect(formatQuantTablePrice('FALLBACKUSDT', '12.345678')).toBe('12.346');
  });

  it('preserves the source string when symbol precision is unknown', () => {
    expect(formatQuantTablePrice('UNKNOWNUSDT', '23.0546822307066408')).toBe('23.0546822307066408');
    expect(formatQuantTablePrice('UNKNOWNUSDT', '1000')).toBe('1000');
    expect(formatPriceByTickSize('23.0546822307066408', undefined, null, true)).toBe('23.0546822307066408');
  });
});
