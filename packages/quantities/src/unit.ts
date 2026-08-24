// Unit model (A5).
//
// Two unit kinds cover the ratified scope:
//  - LinearUnit:   base = value × factor          (km, lb, min …)
//  - AffineUnit:   base = toBase(value)            (°C, °F — temperature)
// Affine units are the reason temperature must never be treated like km→m.
//
// Compound/derived unit SYMBOL parsing ("m/s", "N") is documented future work;
// derived DIMENSIONS already exist so such units can be added without redesign.
import { Decimal } from './decimal';
import type { Dimension } from './dimensions';

export interface LinearUnitDef {
  /** Canonical symbol — unique across the registry. */
  symbol: string;
  dimension: Dimension;
  /** Multiplicative factor to the dimension's base unit. */
  factor: string | number;
  /** Alternative lookup names ("meter" for "m"). */
  aliases?: string[];
  displayName?: string;
}

export interface AffineUnitDef {
  symbol: string;
  dimension: Dimension;
  aliases?: string[];
  displayName?: string;
  /** value → base-unit value (e.g. °C → K: +273.15). */
  toBase: (value: Decimal) => Decimal;
  /** base-unit value → value (e.g. K → °C: −273.15). */
  fromBase: (value: Decimal) => Decimal;
}

export type UnitDef = LinearUnitDef | AffineUnitDef;

export function isAffine(def: UnitDef): def is AffineUnitDef {
  return 'toBase' in def && typeof def.toBase === 'function';
}

/** Runtime-resolved unit with Decimal-normalized factors. */
export interface Unit {
  symbol: string;
  aliases: string[];
  dimension: Dimension;
  displayName: string;
  kind: 'linear' | 'affine';
  factor?: Decimal; // linear
  toBase?: (value: Decimal) => Decimal; // affine
  fromBase?: (value: Decimal) => Decimal; // affine
}

export function resolveUnit(def: UnitDef): Unit {
  if (isAffine(def)) {
    return {
      symbol: def.symbol,
      aliases: def.aliases ?? [],
      dimension: def.dimension,
      displayName: def.displayName ?? def.symbol,
      kind: 'affine',
      toBase: def.toBase,
      fromBase: def.fromBase,
    };
  }
  return {
    symbol: def.symbol,
    aliases: def.aliases ?? [],
    dimension: def.dimension,
    displayName: def.displayName ?? def.symbol,
    kind: 'linear',
    factor: new Decimal(def.factor),
  };
}
