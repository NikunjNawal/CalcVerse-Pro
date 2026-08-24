// Quantity abstraction + default catalog (A5).
import { Decimal } from './decimal';
import type { Dimension } from './dimensions';
import { LENGTH, MASS, TEMPERATURE, TIME } from './dimensions';
import {
  convertUnits,
  DimensionMismatchError,
  DuplicateUnitError,
  UnitRegistry,
  UnknownUnitError,
} from './registry';
import type { UnitDef } from './unit';

export class Quantity {
  constructor(
    public readonly value: Decimal,
    public readonly unit: UnitDef | string,
    private readonly registry: UnitRegistry
  ) {}

  get dimension(): Dimension {
    return this.registry.get(this.unitName()).dimension;
  }

  unitName(): string {
    return typeof this.unit === 'string' ? this.unit : this.unit.symbol;
  }

  /** Convert to another compatible unit; returns a NEW Quantity. */
  to(targetUnit: string): Quantity {
    const out = convertUnits(this.registry, this.value, this.unitName(), targetUnit);
    return new Quantity(out, targetUnit, this.registry);
  }

  /** Same as .to() but returns the bare Decimal for pipeline use. */
  convertTo(targetUnit: string): Decimal {
    return convertUnits(this.registry, this.value, this.unitName(), targetUnit);
  }
}

// ---------------------------------------------------------------------------
// Catalog — representative verified seed set; future domains extend via
// registerUnit() on the shared registry, never with local calculator units.
// ---------------------------------------------------------------------------

export const unitRegistry = new UnitRegistry();

const CATALOG: UnitDef[] = [
  // Length (base: m)
  { symbol: 'm', aliases: ['meter', 'meters'], dimension: LENGTH, factor: 1, displayName: 'meter' },
  { symbol: 'km', aliases: ['kilometer', 'kilometers'], dimension: LENGTH, factor: '1000' },
  { symbol: 'cm', aliases: ['centimeter', 'centimeters'], dimension: LENGTH, factor: '0.01' },
  { symbol: 'mm', aliases: ['millimeter', 'millimeters'], dimension: LENGTH, factor: '0.001' },
  { symbol: 'ft', aliases: ['foot', 'feet'], dimension: LENGTH, factor: '0.3048' },
  { symbol: 'in', aliases: ['inch', 'inches'], dimension: LENGTH, factor: '0.0254' },
  { symbol: 'mi', aliases: ['mile', 'miles'], dimension: LENGTH, factor: '1609.344' },

  // Mass (base: kg)
  { symbol: 'kg', aliases: ['kilogram', 'kilograms'], dimension: MASS, factor: 1 },
  { symbol: 'g', aliases: ['gram', 'grams'], dimension: MASS, factor: '0.001' },
  { symbol: 'mg', aliases: ['milligram', 'milligrams'], dimension: MASS, factor: '0.000001' },
  { symbol: 'lb', aliases: ['pound', 'pounds'], dimension: MASS, factor: '0.45359237' },
  { symbol: 'oz', aliases: ['ounce', 'ounces'], dimension: MASS, factor: '0.028349523125' },

  // Time (base: s)
  { symbol: 's', aliases: ['second', 'seconds'], dimension: TIME, factor: 1 },
  { symbol: 'ms', aliases: ['millisecond', 'milliseconds'], dimension: TIME, factor: '0.001' },
  { symbol: 'min', aliases: ['minute', 'minutes'], dimension: TIME, factor: '60' },
  { symbol: 'h', aliases: ['hour', 'hours'], dimension: TIME, factor: '3600' },
  { symbol: 'day', aliases: ['days'], dimension: TIME, factor: '86400' },

  // Temperature (base: K) — affine conversions, never multiplicative
  {
    symbol: 'K',
    aliases: ['kelvin', 'kelvins'],
    dimension: TEMPERATURE,
    displayName: 'kelvin',
    toBase: v => v,
    fromBase: v => v,
  },
  {
    symbol: '°C',
    aliases: ['celsius'],
    dimension: TEMPERATURE,
    displayName: 'degree Celsius',
    toBase: v => v.plus('273.15'),
    fromBase: v => v.minus('273.15'),
  },
  {
    symbol: '°F',
    aliases: ['fahrenheit'],
    dimension: TEMPERATURE,
    displayName: 'degree Fahrenheit',
    // Canonical affine pair: F→K = (F−459.67)·5/9 ; K→F = K·9/5 − 459.67
    toBase: v => v.plus('459.67').times(5).dividedBy(9),
    fromBase: v => v.times(9).dividedBy(5).minus('459.67'),
  },
];

for (const def of CATALOG) unitRegistry.register(def);

// ---------------------------------------------------------------------------
// Public convenience API bound to the default registry
// ---------------------------------------------------------------------------

/** Quantity factory against the shared registry: quantity(10, 'm').to('cm') */
/** Quantity factory against the shared registry: quantity(10,'m').to('cm') */
export function quantity(value: Decimal | string | number, unit: string | UnitDef): Quantity {
  const name = typeof unit === 'string' ? unit : unit.symbol;
  if (typeof unit !== 'string') unitRegistry.register(unit); // inline custom units allowed
  const q = new Quantity(new Decimal(value), name, unitRegistry);
  void q.dimension; // fail fast on unknown units at construction
  return q;
}

/** Convert between registered units; throws UnknownUnit/DimensionMismatch errors. */
export function convert(
  value: Decimal | string | number,
  fromUnit: string,
  toUnit: string
): Decimal {
  return convertUnits(unitRegistry, value, fromUnit, toUnit);
}

export { DimensionMismatchError, DuplicateUnitError, UnknownUnitError };
/** Precision-configured constructor — public so callers build scale-exact inputs. */
export { Decimal } from './decimal';
