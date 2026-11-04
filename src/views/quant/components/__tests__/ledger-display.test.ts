import { describe, expect, it } from 'vitest';
import { displayCommission, displayDecimal } from '../ledger-display';

describe('displayDecimal', () => {
  it('preserves existing full precision when no display scale is supplied', () => {
    expect(displayDecimal('23.0546822307066408')).toBe('23.0546822307066408');
    expect(displayDecimal('23.050000000')).toBe('23.05');
  });

  it('rounds to a maximum display scale using decimal strings', () => {
    expect(displayDecimal('23.0546822307066408', 8)).toBe('23.05468223');
    expect(displayDecimal('23.0546822397066408', 8)).toBe('23.05468224');
    expect(displayDecimal('9007199254740993.123456789', 8)).toBe('9007199254740993.12345679');
  });

  it('expands scientific notation and normalizes rounded negative zero', () => {
    expect(displayDecimal('2.30546822307066408e1', 8)).toBe('23.05468223');
    expect(displayDecimal('-0.000000004', 8)).toBe('0');
  });

  it('supports zero decimal places', () => {
    expect(displayDecimal('23.5', 0)).toBe('24');
  });
});


describe('displayCommission', () => {
  it('rounds each asset amount independently and preserves asset labels', () => {
    expect(displayCommission('0.123456789012345678 USDT + 0.000000005 BNB'))
      .toBe('0.12345679 USDT + 0.00000001 BNB');
  });

  it('preserves non-numeric commission states and handles missing values', () => {
    expect(displayCommission('待核实')).toBe('待核实');
    expect(displayCommission(null)).toBe('—');
  });
});
