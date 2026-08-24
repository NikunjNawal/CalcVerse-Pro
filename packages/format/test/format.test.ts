// @vitest-environment node
import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import type { DecimalInput } from '../src';
import {
  formatNumber,
  formatScientific,
  formatPercentage,
  formatCurrency,
  formatUnitValue,
  toDecimal,
} from '../src';

describe('formatNumber — basic values', () => {
  const cases: [DecimalInput, string][] = [
    [0, '0'],
    [5, '5'],
    [-5, '-5'],
    [1234567, '1,234,567'],
    [2.5, '2.5'],
    [-0.25, '-0.25'],
  ];
  cases.forEach(([input, expected]) => {
    it(`${String(input)} → "${expected}"`, () => {
      expect(formatNumber(input)).toBe(expected);
    });
  });

  it('preserves meaningful trailing zero when decimals requested', () => {
    expect(formatNumber(2.5, { decimals: 2 })).toBe('2.50');
  });

  it('trims trailing zeros by default when no fixed decimals', () => {
    expect(formatNumber(new Decimal('2.500'))).toBe('2.5');
    expect(formatNumber('2.500')).toBe('2.5');
  });

  it('keeps zeros when trimTrailingZeros is false', () => {
    expect(formatNumber('2.500', { trimTrailingZeros: false })).toBe('2.500');
  });

  it('normalizes negative zero to 0', () => {
    expect(formatNumber(new Decimal('-0'))).toBe('0');
    expect(formatNumber(-0)).toBe('0');
  });

  it('can disable grouping', () => {
    expect(formatNumber(1234567, { grouping: false })).toBe('1234567');
  });
});

describe('formatNumber — large and small magnitudes', () => {
  it('groups very large integers exactly', () => {
    const big = '123456789012345678901234567890';
    expect(formatNumber(big)).toBe('123,456,789,012,345,678,901,234,567,890');
  });

  it('keeps positional form for small decimals (never forces scientific)', () => {
    expect(formatNumber('0.00000123')).toBe('0.00000123');
  });

  it('rounds via decimals without float round-trip', () => {
    expect(formatNumber(new Decimal('1.005'), { decimals: 2 })).toBe('1.01'); // Decimal HALF_UP? decimal.js default ROUND_HALF_UP (4) — 1.005 → 1.01
    expect(formatNumber('2.675', { decimals: 2 })).toBe('2.68'); // float would give 2.67
  });

  it('significantFigures rounds correctly', () => {
    expect(formatNumber(123456, { significantFigures: 3 })).toBe('123,000');
    expect(formatNumber('0.001234', { significantFigures: 2, grouping: false })).toBe('0.0012');
  });

  it('rejects conflicting precision options', () => {
    expect(() => formatNumber(1, { decimals: 2, significantFigures: 3 })).toThrow();
  });
});

describe('formatNumber — locale separators', () => {
  it('de-DE swaps separators', () => {
    expect(formatNumber(1234567.89, { locale: 'de-DE' })).toBe('1.234.567,89');
  });

  it('en-IN uses Indian grouping', () => {
    expect(formatNumber(12345678, { locale: 'en-IN' })).toBe('1,23,45,678');
  });
});

describe('formatScientific', () => {
  it('positive exponent with Unicode superscript', () => {
    expect(formatScientific('1234567')).toBe('1.234567 × 10⁶');
  });

  it('negative exponent', () => {
    expect(formatScientific('0.00000123', { decimals: 2 })).toBe('1.23 × 10⁻⁶');
  });

  it('renders zero as plain 0', () => {
    expect(formatScientific(0)).toBe('0');
  });

  it('ascii mode uses e-notation', () => {
    expect(formatScientific('1234567', { unicode: false, decimals: 2 })).toBe('1.23e6');
  });

  it('handles negative mantissas (explicit decimals kept verbatim)', () => {
    const out = formatScientific('-0.0005', { decimals: 1 });
    expect(out).toBe('-5.0 × 10⁻⁴');
  });

  it('default mode trims mantissa zeros', () => {
    expect(formatScientific('-0.0005')).toBe('-5 × 10⁻⁴');
  });
});

describe('formatPercentage — display only', () => {
  it.each([
    [0, '0%'],
    [10, '10%'],
    [100, '100%'],
    [12.5, '12.5%'],
    [-3.75, '-3.75%'],
  ])('%s → "%s"', (input, expected) => {
    expect(formatPercentage(input)).toBe(expected);
  });

  it('supports optional space and decimals', () => {
    expect(formatPercentage(33.33333, { decimals: 2, spaceBeforeSign: true })).toBe('33.33\u00a0%');
  });

  it('does NOT multiply by 100 (calculation semantics stay outside)', () => {
    // 0.25 in percent units renders as "0.25%" — NOT "25%"
    expect(formatPercentage(0.25)).toBe('0.25%');
  });
});

describe('formatCurrency — standards-based', () => {
  it('formats INR', () => {
    expect(formatCurrency(123456.78, { currency: 'INR' })).toContain('₹');
  });

  it('formats USD', () => {
    expect(formatCurrency(9.99, { currency: 'USD' })).toMatch(/\$9\.99/);
  });

  it('formats EUR with de-DE placement', () => {
    const out = formatCurrency(9.99, { currency: 'EUR', locale: 'de-DE' });
    expect(out).toContain('9,99');
    expect(out).toContain('€');
  });

  it('formats GBP', () => {
    expect(formatCurrency(10, { currency: 'GBP' })).toContain('£');
  });

  it('JPY defaults to zero fraction digits', () => {
    const out = formatCurrency(1234.56, { currency: 'JPY' });
    expect(out).not.toContain('.56');
    expect(out).toContain('1,235');
  });

  it('respects explicit decimals override', () => {
    expect(formatCurrency(5, { currency: 'USD', decimals: 0 })).toBe('$5');
  });

  it('preserves every digit beyond the Intl-safe magnitude (ISO fallback)', () => {
    const exact = '999999999999999999999999.99';
    const out = formatCurrency(exact, { currency: 'USD' });
    expect(out).toContain('USD');
    expect(out.replace(/[^0-9]/g, '')).toBe('99999999999999999999999999');
  });
});

describe('formatUnitValue — A5 preparation primitive', () => {
  it('attaches symbol with thin space', () => {
    expect(formatUnitValue(9.81, 'm/s²')).toBe('9.81\u2009m/s²');
  });

  it('space can be disabled', () => {
    expect(formatUnitValue(30, '°', { spaceBeforeSymbol: false })).toBe('30°');
  });

  it('accepts number options passthrough', () => {
    expect(formatUnitValue(Math.PI, 'rad', { decimals: 2 })).toBe(`3.14\u2009rad`);
  });
});

describe('precision — no floating-point corruption', () => {
  it('string inputs bypass binary float entirely', () => {
    // The classic 0.1 + 0.2 problem: engine produces exact '0.3';
    // formatting must not reintroduce float artifacts.
    const engineResult = new Decimal('0.1').plus('0.2').toString();
    expect(formatNumber(engineResult)).toBe('0.3');
  });

  it('36-digit integers survive formatting unchanged in value', () => {
    const huge = '123456789012345678901234567890123456';
    const out = formatNumber(huge, { grouping: false });
    expect(out).toBe(huge);
    // round-trip via toFixed (positional), NOT toString (which goes exponential >e20)
    expect(toDecimal(out).toFixed(0)).toBe(huge);
  });

  it('currency boundary conversion happens once at the Intl edge', () => {
    // 1080.42 must not become 1080.4200000000003 through intermediate floats
    expect(formatCurrency('1080.42', { currency: 'INR', locale: 'en-IN' })).toContain('1,080.42');
  });
});
