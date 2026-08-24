// Centralized unit registry (A5 §10).
// Single authority for unit lookup/identity — calculators NEVER define units
// locally; new domains extend the catalog through registerUnit().
import { Decimal } from './decimal';
import { dimensionLabel, sameDimension, type Dimension } from './dimensions';
import { resolveUnit, type Unit, type UnitDef } from './unit';

export class UnknownUnitError extends Error {
  constructor(symbol: string) {
    super(`Unknown unit "${symbol}"`);
    this.name = 'UnknownUnitError';
  }
}

export class DuplicateUnitError extends Error {
  constructor(name: string, existing: string) {
    super(`Duplicate unit identifier "${name}" — already registered for "${existing}"`);
    this.name = 'DuplicateUnitError';
  }
}

export class DimensionMismatchError extends Error {
  constructor(from: Unit, to: Unit) {
    super(
      `Incompatible dimensions: cannot convert ${dimensionLabel(from.dimension)} (${from.symbol}) → ${dimensionLabel(to.dimension)} (${to.symbol})`
    );
    this.name = 'DimensionMismatchError';
  }
}

export class UnitRegistry {
  private bySymbol = new Map<string, Unit>();

  /** Register a definition; rejects symbol/alias collisions with clear errors. */
  register(def: UnitDef): Unit {
    const unit = resolveUnit(def);
    const names = [unit.symbol, ...unit.aliases];
    for (const name of names) {
      const existing = this.bySymbol.get(name);
      if (existing && existing.symbol !== unit.symbol) {
        throw new DuplicateUnitError(name, existing.symbol);
      }
    }
    // Same-symbol re-registration of an identical unit is idempotent-safe:
    // overwrite. Cross-identities were rejected above.
    for (const name of names) this.bySymbol.set(name, unit);
    return unit;
  }

  has(name: string): boolean {
    return this.bySymbol.has(name);
  }

  /** Resolve by canonical symbol or alias. Throws on unknown input. */
  get(name: string): Unit {
    const unit = this.bySymbol.get(name);
    if (!unit) throw new UnknownUnitError(name);
    return unit;
  }

  /** All registered units, deduplicated by canonical symbol. */
  list(): Unit[] {
    return [...new Set(this.bySymbol.values())];
  }

  listByDimension(dimension: Dimension): Unit[] {
    return this.list().filter(u => sameDimension(u.dimension, dimension));
  }
}

/** Convert a numeric value between two registry-resolved units. */
export function convertUnits(
  registry: UnitRegistry,
  value: Decimal | string | number,
  fromName: string,
  toName: string
): Decimal {
  const from = registry.get(fromName);
  const to = registry.get(toName);
  if (!sameDimension(from.dimension, to.dimension)) throw new DimensionMismatchError(from, to);

  const v = value instanceof Decimal ? value : new Decimal(value);
  const base = from.kind === 'linear' ? v.times(from.factor!) : from.toBase!(v);
  return to.kind === 'linear' ? base.dividedBy(to.factor!) : to.fromBase!(base);
}
