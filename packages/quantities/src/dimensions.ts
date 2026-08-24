// Dimensional identity for the Quantities system (A5).
//
// A Dimension is a sparse exponent record over BASE dimension keys. Derived
// dimensions (velocity, force, …) are constructed compositionally from base
// exponents — adding new dimensions later requires ZERO changes to existing
// units, registry or conversion code (extension point per §7 of the A5 spec).
//
// Compound/derived UNITS (m/s, N, J…) build on these dimensions; string
// parsing of compound unit expressions is explicitly future work.
import { Decimal } from './decimal';

export type BaseDimensionKey = 'length' | 'mass' | 'time' | 'temperature';

/** Sparse exponent vector, e.g. velocity = { length: 1, time: -1 }. */
export type Dimension = Partial<Record<BaseDimensionKey, number>>;

/** Identity — used to decide whether two units are conversion-compatible. */
export const DIMENSIONLESS: Dimension = {};

export const LENGTH: Dimension = { length: 1 };
export const MASS: Dimension = { mass: 1 };
export const TIME: Dimension = { time: 1 };
/** Temperature participates in affine (not purely multiplicative) conversion. */
export const TEMPERATURE: Dimension = { temperature: 1 };

// -- Derived-dimension construction helpers (A6+/future domains extend here) --

export function multiply(a: Dimension, b: Dimension): Dimension {
  return combine(a, b, 1);
}

export function divide(a: Dimension, b: Dimension): Dimension {
  return combine(a, b, -1);
}

function combine(a: Dimension, b: Dimension, sign: number): Dimension {
  const out: Dimension = { ...a };
  for (const [k, v] of Object.entries(b) as [BaseDimensionKey, number][]) {
    out[k] = (out[k] ?? 0) + sign * v;
    if (out[k] === 0) delete out[k];
  }
  return out;
}

export function power(d: Dimension, n: number): Dimension {
  const out: Dimension = {};
  for (const [k, v] of Object.entries(d) as [BaseDimensionKey, number][]) {
    out[k] = v * n;
  }
  return out;
}

/** Structural equality — the gate that blocks incompatible conversions. */
export function sameDimension(a: Dimension, b: Dimension): boolean {
  const ka = Object.keys(a).filter(k => (a as Record<string, number>)[k] !== 0);
  const kb = Object.keys(b).filter(k => (b as Record<string, number>)[k] !== 0);
  if (ka.length !== kb.length) return false;
  return ka.every(k => (a as Record<string, number>)[k] === (b as Record<string, number>)[k]);
}

/** Ready-made derived dimensions demonstrating the extension point. */
export const VELOCITY: Dimension = divide(LENGTH, TIME); // m/s
export const ACCELERATION: Dimension = divide(VELOCITY, TIME); // m/s²
export const FORCE: Dimension = multiply(MASS, ACCELERATION); // kg·m/s² (N)
export const ENERGY: Dimension = multiply(FORCE, LENGTH); // J
export const POWER: Dimension = divide(ENERGY, TIME); // W
export const PRESSURE: Dimension = divide(FORCE, power(LENGTH, 2)); // Pa
export const DENSITY: Dimension = divide(MASS, power(LENGTH, 3)); // kg/m³
export const AREA: Dimension = power(LENGTH, 2);
export const VOLUME: Dimension = power(LENGTH, 3);

/** Human-readable label used in error messages ("mass → length"). */
export function dimensionLabel(d: Dimension): string {
  const parts = Object.entries(d) as [BaseDimensionKey, number][];
  if (parts.length === 0) return 'dimensionless';
  return parts
    .map(([k, v]) => (v === 1 ? k : `${k}^${v}`))
    .sort()
    .join('·');
}

// Re-export so downstream code can do exact comparisons without importing decimal.js directly.
export { Decimal };
