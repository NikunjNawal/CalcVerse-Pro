// @vitest-environment node
// Purity tripwire (§8.2): this file MUST run in the Node environment.
// If calculateBasic/resolvePercentages touch DOM or localStorage, these tests crash.
import { describe, it, expect } from 'vitest';
import { calculateBasic, resolvePercentages } from './compute';

describe('resolvePercentages (ratified §12.1 semantics)', () => {
  it('standalone percent becomes fraction', () => {
    expect(resolvePercentages('50%')).toBe('(50/100)');
  });

  it('additive percent is base-relative', () => {
    expect(resolvePercentages('50+10%')).toBe('50+(50*10/100)');
  });

  it('subtractive percent is base-relative', () => {
    expect(resolvePercentages('50−10%')).toBe('50−(50*10/100)');
  });

  it('multiplicative percent is fractional', () => {
    expect(resolvePercentages('200×10%')).toBe('200×(10/100)');
  });

  it('divisive percent is fractional', () => {
    expect(resolvePercentages('200÷10%')).toBe('200÷(10/100)');
  });

  it('handles decimal percentages', () => {
    expect(resolvePercentages('0.5%')).toBe('(0.5/100)');
  });

  it('throws on misplaced percent', () => {
    expect(() => resolvePercentages('%5')).toThrow("Misplaced '%'");
  });

  it('transforms every ratified pattern exactly', () => {
    const spec: [string, string][] = [
      ['50+10%', '50+(50*10/100)'],
      ['50−10%', '50−(50*10/100)'],
      ['-50+10%', '-50+(50*10/100)'],
      ['-50−10%', '-50−(50*10/100)'],
      ['10.5+20%', '10.5+(10.5*20/100)'],
      ['200×10%', '200×(10/100)'],
      ['200÷10%', '200÷(10/100)'],
      ['50%', '(50/100)'],
    ];
    for (const [input, expected] of spec) {
      expect(resolvePercentages(input)).toBe(expected);
    }
  });

  it('is whitespace-tolerant for additive context (regression: 50.1 bug)', () => {
    expect(resolvePercentages('50 + 10%')).toBe('50 + (50*10/100)');
    expect(resolvePercentages('50 − 10%')).toBe('50 − (50*10/100)');
    expect(resolvePercentages('50+ 10%')).toBe('50+ (50*10/100)');
    expect(resolvePercentages('50 +10%')).toBe('50 +(50*10/100)');
  });

  it('uses the absolute base for negative operands (ratified)', () => {
    expect(resolvePercentages('-50 + 10%')).toBe('-50 + (50*10/100)');
    expect(resolvePercentages('-50−10%')).toBe('-50−(50*10/100)');
  });
});

describe('calculateBasic — golden arithmetic', () => {
  const cases: [string, string][] = [
    ['2 + 2', '4'],
    ['10 - 3', '7'],
    ['6 × 7', '42'],
    ['20 ÷ 4', '5'],
    ['0.1 + 0.2', '0.3'],
    ['0.7 + 0.1', '0.8'],
    ['2 + 3 × 4', '14'],
    ['−5 + 3', '-2'],
    ['1 ÷ 8', '0.125'],
  ];

  cases.forEach(([input, expected]) => {
    it(`${input} = ${expected}`, () => {
      expect(calculateBasic(input).value).toBe(expected);
    });
  });
});

describe('calculateBasic — ratified percentage semantics', () => {
  // The authoritative spec: CALCVERSE_MASTER_ARCHITECTURE.md §12.1
  const cases: [string, string][] = [
    ['50%', '0.5'], // standalone → fraction
    ['50 + 10%', '55'], // additive → base-relative (legacy 50.1 retired)
    ['250 + 20%', '300'],
    ['50 − 10%', '45'], // subtractive → base-relative
    ['250 − 20%', '200'],
    ['200 × 10%', '20'], // multiplicative → fractional
    ['10% × 200', '20'], // leading percent → fraction, then multiply
    ['200 ÷ 10%', '2000'],
    ['80 + 25%', '100'], // markup-flavored check via expression
    ['10.5 + 20%', '12.6'], // decimal base
    ['100 − 25%', '75'],
    ['-50 + 10%', '-45'], // negative base uses absolute value (ratified)
    ['-50 − 10%', '-55'],
  ];

  cases.forEach(([input, expected]) => {
    it(`${input} = ${expected}`, () => {
      expect(calculateBasic(input).value).toBe(expected);
    });
  });

  it('handles multiple percentages in one expression', () => {
    // Chaining convention: each % resolves against its immediately preceding
    // OPERAND EXPRESSION (string-level rewrite, no intermediate evaluation):
    // 50 + (50*10/100) - ((50*10/100)*20/100) = 50 + 5 − 1 = 54
    expect(calculateBasic('50 + 10% - 20%').value).toBe('54');
  });

  it('handles decimal percentage operands with whitespace', () => {
    expect(calculateBasic('200 + 12.5%').value).toBe('225');
  });
});

describe('calculateBasic — output structure', () => {
  it('returns ordered steps ending with a final answer', () => {
    const out = calculateBasic('2 + 3 × 4');
    expect(out.steps.length).toBeGreaterThan(1);
    expect(out.steps[out.steps.length - 1].isFinal).toBe(true);
    expect(out.steps[out.steps.length - 1].result).toBe('14');
  });

  it('returns empty warnings for clean calculations', () => {
    expect(calculateBasic('2 + 2').warnings).toEqual([]);
  });

  it('propagates engine errors for division by zero', () => {
    expect(() => calculateBasic('5 ÷ 0')).toThrow('Division by zero');
  });

  it('rejects malformed input', () => {
    expect(() => calculateBasic('abc')).toThrow();
    expect(() => calculateBasic('')).toThrow();
  });
});
