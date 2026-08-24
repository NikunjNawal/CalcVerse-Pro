// Mount module for the Basic Calculator — convention discovered by
// main-calculator.ts via import.meta.glob('./domains/**/mount.ts').
// Keeps UI wiring in the calculator layer; the bootstrap stays generic.
import type { CalculatorConfig } from '../../../CalculatorBase';
import type { CalculatorDefinition } from '../../../registry/calculator-definition';
import { BasicCalculator } from '../../../calculators/BasicCalculator';

export default function mount(
  container: HTMLElement,
  _def: CalculatorDefinition,
  config: CalculatorConfig
): void {
  new BasicCalculator(container, config);
}
