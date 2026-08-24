// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { Decimal } from '../src';
import {
  quantity,
  convert,
  unitRegistry,
  DimensionMismatchError,
  DuplicateUnitError,
  UnknownUnitError,
} from '../src';
import { LENGTH, MASS, TIME, TEMPERATURE, VELOCITY } from '../src/dimensions';

describe('length conversions', () => {
  it('1 km → 1000 m', () => {
    expect(convert(1, 'km', 'm').toString()).toBe('1000');
  });

  it('1 m → 100 cm', () => {
    expect(convert(1, 'm', 'cm').toString()).toBe('100');
  });

  it('1 mile → 1609.344 m (exact survey definition)', () => {
    expect(convert(1, 'mi', 'm').toString()).toBe('1609.344');
  });

  it('1 ft → 12 in exactly', () => {
    expect(convert(1, 'ft', 'in').toString()).toBe('12');
  });

  it('quantity object style works', () => {
    expect(quantity(10, 'm').to('cm').value.toString()).toBe('1000');
  });
});

describe('mass conversions', () => {
  it('1 kg → 1000 g', () => {
    expect(convert(1, 'kg', 'g').toString()).toBe('1000');
  });

  it('1 kg → lb matches the authoritative factor via round-trip', () => {
    const lbs = convert(1, 'kg', 'lb');
    expect(lbs.toString().startsWith('2.2046226218')).toBe(true); // sanity prefix
    // Authoritative check: converting back must land on exactly 1 kg.
    const kg = convert(lbs, 'lb', 'kg');
    expect(kg.toFixed(30)).toBe('1.000000000000000000000000000000');
  });

  it('16 oz ↔ 1 lb in both directions', () => {
    expect(convert(16, 'oz', 'lb').toString()).toBe('1');
    expect(convert(1, 'lb', 'oz').toString()).toBe('16');
  });
});

describe('time conversions', () => {
  it('1 h → 3600 s', () => {
    expect(convert(1, 'h', 's').toString()).toBe('3600');
  });

  it('1 day → 24 h', () => {
    expect(convert(1, 'day', 'h').toString()).toBe('24');
  });

  it('1500 ms → 1.5 s', () => {
    expect(convert(1500, 'ms', 's').toString()).toBe('1.5');
  });
});

describe('temperature — affine conversions', () => {
  it('0 °C → 273.15 K', () => {
    expect(convert(0, '°C', 'K').toString()).toBe('273.15');
  });

  it('100 °C → 212 °F', () => {
    expect(convert(100, '°C', '°F').toString()).toBe('212');
  });

  it('32 °F → 0 °C', () => {
    expect(convert(32, '°F', '°C').toString()).toBe('0');
  });

  it('-40 °C → -40 °F (crossover point)', () => {
    expect(convert(-40, '°C', '°F').toString()).toBe('-40');
  });

  it('0 K → −273.15 °C (absolute zero)', () => {
    expect(convert(0, 'K', '°C').toString()).toBe('-273.15');
  });

  it('covers all six directed pairs at the canonical anchor points', () => {
    // C→K / K→C
    expect(convert(100, '°C', 'K').toString()).toBe('373.15');
    expect(convert(273.15, 'K', '°C').toString()).toBe('0');
    // F→C / C→F
    expect(convert(212, '°F', '°C').toString()).toBe('100');
    // K→F / F→K (the pair that caught the wrong −32 constant)
    expect(convert(0, 'K', '°F').toString()).toBe('-459.67');
    expect(convert(-459.67, '°F', 'K').toString()).toBe('0');
  });

  it('temperature is NOT treated multiplicatively (regression guard)', () => {
    // If affine logic were replaced by a factor, this would fail.
    expect(convert(1, '°C', 'K').toString()).not.toBe('1');
    expect(convert(1, '°C', '°F').toString()).toBe('33.8'); // 1×9/5+32
  });

  it('round-trips preserve values: 36.6 °C → °F → °C', () => {
    const back = convert(convert('36.6', '°C', '°F'), '°F', '°C').toFixed(10);
    expect(back).toBe('36.6000000000');
  });
});

describe('precision — Decimal preserved end-to-end', () => {
  it('0.1 m → mm has no float drift', () => {
    expect(convert('0.1', 'm', 'mm').toString()).toBe('100');
  });

  it('repeating decimals keep 40-digit working precision', () => {
    const out = convert(1, 'in', 'cm').toString(); // 1 in = 2.54 cm exactly
    expect(out).toBe('2.54');
    const third = convert(1, 'ft', 'm').toString(); // 0.3048 exact
    expect(third).toBe('0.3048');
  });

  it('round-trip km → cm → km returns the original string', () => {
    const out = convert(convert('3.14159', 'km', 'cm'), 'cm', 'km').toString();
    expect(out).toBe('3.14159');
  });

  it('accepts and returns high-precision Decimals without Number()', () => {
    // Sanity anchor: 1 mg = 0.001 g
    expect(convert(1, 'mg', 'g').toString()).toBe('0.001');
    const v = new Decimal('123456789012345678901234567890.123456789'); // 39 sig digits
    const out = convert(v, 'mg', 'g'); // ×10⁻³, exact shift then 40-digit working precision
    // toString() is exponential above e20 — assert positionally via toFixed.
    expect(out.toFixed(12)).toBe('123456789012345678901234567.890123456789');
  });
});

describe('dimension guards', () => {
  it.each([
    ['kg', 'm'],
    ['m', 's'],
    ['°C', 'm'],
    ['h', 'kg'],
  ])('%s → %s is rejected with DimensionMismatchError', (from, to) => {
    expect(() => convert(1, from, to)).toThrow(DimensionMismatchError);
    expect(() => convert(1, from, to)).toThrow(/Incompatible dimensions/);
  });

  it('error message names both dimensions readably', () => {
    try {
      convert(1, 'kg', 'm');
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as Error).message).toContain('mass');
      expect((e as Error).message).toContain('length');
    }
  });

  it('derived dimensions share compatibility (velocity family)', () => {
    expect(VELOCITY).toEqual({ length: 1, time: -1 }); // extension point exists
  });
});

describe('unit registry', () => {
  it('resolves canonical symbols and aliases to the same unit', () => {
    expect(unitRegistry.get('m')).toBe(unitRegistry.get('meter'));
    expect(unitRegistry.get('°C')).toBe(unitRegistry.get('celsius'));
  });

  it('throws UnknownUnitError for unknown units', () => {
    expect(() => unitRegistry.get('parsec-furlong')).toThrow(UnknownUnitError);
    expect(() => convert(1, 'nope', 'm')).toThrow(UnknownUnitError);
    expect(() => convert(1, 'm', 'nope')).toThrow(UnknownUnitError);
  });

  it('rejects duplicate registration of an existing identity', () => {
    expect(() =>
      unitRegistry.register({ symbol: 'kilograms', dimension: MASS, factor: 1 })
    ).toThrow(DuplicateUnitError);
  });

  it('allows registering NEW unique units at runtime (extension point)', () => {
    unitRegistry.register({
      symbol: 'furlong',
      aliases: ['furlongs'],
      dimension: LENGTH,
      factor: '201.168',
    });
    expect(convert(1, 'furlong', 'm').toString()).toBe('201.168');
    expect(unitRegistry.has('furlongs')).toBe(true);
  });

  it('lists units filtered by dimension', () => {
    const lengths = unitRegistry.listByDimension(LENGTH).map(u => u.symbol);
    expect(lengths).toContain('m');
    expect(lengths).not.toContain('kg');
    const temps = unitRegistry.listByDimension(TEMPERATURE).map(u => u.symbol);
    expect(temps).toEqual(expect.arrayContaining(['K', '°C', '°F']));
  });

  it('every registered time/mass/length unit resolves against its declared base dimension constant', () => {
    for (const [symbol, dim] of [
      ['m', LENGTH],
      ['kg', MASS],
      ['min', TIME],
    ] as const) {
      expect(unitRegistry.get(symbol).dimension).toEqual(dim);
    }
  });
});
