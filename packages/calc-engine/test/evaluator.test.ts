import { describe, it, expect } from 'vitest';
import { calculate } from '../src';

describe('Calculation Engine', () => {
  describe('Basic arithmetic', () => {
    it('adds two numbers', () => {
      const result = calculate('2 + 3');
      expect(result.value).toBe('5');
    });

    it('subtracts two numbers', () => {
      const result = calculate('10 - 4');
      expect(result.value).toBe('6');
    });

    it('multiplies two numbers', () => {
      const result = calculate('6 * 7');
      expect(result.value).toBe('42');
    });

    it('divides two numbers', () => {
      const result = calculate('20 / 4');
      expect(result.value).toBe('5');
    });

    it('handles operator precedence', () => {
      const result = calculate('2 + 3 * 4');
      expect(result.value).toBe('14');
    });

    it('handles parentheses', () => {
      const result = calculate('(2 + 3) * 4');
      expect(result.value).toBe('20');
    });

    it('handles exponentiation', () => {
      const result = calculate('2 ^ 3');
      expect(result.value).toBe('8');
    });

    it('handles modulo', () => {
      const result = calculate('10 % 3');
      expect(result.value).toBe('1');
    });
  });

  describe('Decimal precision', () => {
    it('handles 0.1 + 0.2 correctly', () => {
      const result = calculate('0.1 + 0.2');
      expect(result.value).toBe('0.3');
    });

    it('handles 0.7 + 0.1 correctly', () => {
      const result = calculate('0.7 + 0.1');
      expect(result.value).toBe('0.8');
    });

    it('handles repeating decimals', () => {
      const result = calculate('1 / 3');
      expect(result.value).toBe('0.3333333333');
    });
  });

  describe('Functions', () => {
    it('calculates sin', () => {
      const result = calculate('sin(0)');
      expect(result.value).toBe('0');
    });

    it('calculates cos', () => {
      const result = calculate('cos(0)');
      expect(result.value).toBe('1');
    });

    it('calculates sqrt', () => {
      const result = calculate('sqrt(16)');
      expect(result.value).toBe('4');
    });

    it('calculates log10', () => {
      const result = calculate('log(100)');
      expect(result.value).toBe('2');
    });

    it('calculates ln', () => {
      const result = calculate('ln(e)');
      expect(result.value).toBe('1');
    });

    it('calculates abs', () => {
      const result = calculate('abs(-5)');
      expect(result.value).toBe('5');
    });

    it('calculates floor', () => {
      const result = calculate('floor(3.7)');
      expect(result.value).toBe('3');
    });

    it('calculates ceil', () => {
      const result = calculate('ceil(3.2)');
      expect(result.value).toBe('4');
    });

    it('calculates round', () => {
      const result = calculate('round(3.5)');
      expect(result.value).toBe('4');
    });
  });

  describe('Constants', () => {
    it('uses pi', () => {
      const result = calculate('pi');
      expect(parseFloat(result.value)).toBeCloseTo(Math.PI, 10);
    });

    it('uses e', () => {
      const result = calculate('e');
      expect(parseFloat(result.value)).toBeCloseTo(Math.E, 10);
    });

    it('uses π symbol', () => {
      const result = calculate('π');
      expect(parseFloat(result.value)).toBeCloseTo(Math.PI, 10);
    });
  });

  describe('Complex expressions', () => {
    it('handles nested parentheses', () => {
      const result = calculate('((2 + 3) * 4) / 2');
      expect(result.value).toBe('10');
    });

    it('handles multiple functions', () => {
      const result = calculate('sin(pi / 2) + cos(0)');
      expect(result.value).toBe('2');
    });

    it('handles chained operations', () => {
      const result = calculate('2 + 3 * 4 - 5 / 2');
      expect(result.value).toBe('11.5');
    });
  });

  describe('Step generation', () => {
    it('generates steps for simple expression', () => {
      const result = calculate('2 + 3 * 4');
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps.some(s => s.description.includes('3 * 4'))).toBe(true);
      expect(result.steps.some(s => s.description.includes('2 + 12'))).toBe(true);
    });

    it('includes final answer step', () => {
      const result = calculate('2 + 2');
      const finalStep = result.steps[result.steps.length - 1];
      expect(finalStep.isFinal).toBe(true);
      expect(finalStep.result).toBe('4');
    });
  });

  describe('Error handling', () => {
    it('throws on division by zero', () => {
      expect(() => calculate('1 / 0')).toThrow('Division by zero');
    });

    it('throws on sqrt of negative', () => {
      expect(() => calculate('sqrt(-1)')).toThrow('Square root of negative number');
    });

    it('throws on mismatched parentheses', () => {
      expect(() => calculate('(2 + 3')).toThrow('Mismatched parentheses');
    });
  });
});

describe('Display-operator aliases', () => {
  it('accepts Unicode minus', () => {
    expect(calculate('5 − 3').value).toBe('2');
  });

  it('accepts Unicode multiplication', () => {
    expect(calculate('6 × 7').value).toBe('42');
  });

  it('accepts Unicode division', () => {
    expect(calculate('20 ÷ 4').value).toBe('5');
  });

  it('handles mixed display operators with precedence', () => {
    expect(calculate('2 + 3 × 4 ÷ 2').value).toBe('8');
  });

  it('handles unary minus via alias', () => {
    expect(calculate('−5 + 3').value).toBe('-2');
  });
});
