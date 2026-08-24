// Precision-safe decimal constructor local to the quantities system.
// A cloned Decimal isolates precision/rounding configuration so the package
// behaves deterministically regardless of engine or app global settings.
import DecimalConstructor from 'decimal.js';

export const Decimal = DecimalConstructor.clone({
  precision: 40,
  rounding: DecimalConstructor.ROUND_HALF_UP,
});
export type Decimal = InstanceType<typeof Decimal>;
