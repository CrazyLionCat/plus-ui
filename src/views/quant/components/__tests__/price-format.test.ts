import { describe, expect, it } from 'vitest';
import { cacheQuantSymbolTickSize, formatPriceByTickSize, formatQuantPrice, formatQuantPriceCompact } from '../price-format';

describe('formatPriceByTickSize', () => {
  it('rounds prices to the decimal precision implied by tickSize and keeps fixed zeros', () => {
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

describe('formatQuantPriceCompact', () => {
  it('removes insignificant fractional trailing zeros after tick-size rounding', () => {
    cacheQuantSymbolTickSize('COMPACTUSDT', '0.010');
    expect(formatQuantPrice('COMPACTUSDT', '1.2')).toBe('1.20');
    expect(formatQuantPriceCompact('COMPACTUSDT', '1.2')).toBe('1.2');
    expect(formatQuantPriceCompact('COMPACTUSDT', '2.00')).toBe('2');
    expect(formatQuantPriceCompact('UNKNOWNUSDT', '12.3400')).toBe('12.34');
    expect(formatQuantPriceCompact('UNKNOWNUSDT', '1000')).toBe('1000');
  });
});
