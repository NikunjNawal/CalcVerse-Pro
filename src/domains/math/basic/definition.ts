// BasicCalculator — full CalculatorDefinition v2 = metadata + pure compute.
// This module imports calc-engine (via compute.ts) and is therefore loaded
// LAZILY by the registry; only calculator pages need it.
// Metadata alone (registry/listing use) lives in metadata.ts.
import type { CalculatorDefinition } from '../../../registry/calculator-definition';
import { calculateBasic } from './compute';
import basicMetadata from './metadata';

const basicCalculator: CalculatorDefinition = {
  ...basicMetadata,
  compute: calculateBasic,
};

export default basicCalculator;
