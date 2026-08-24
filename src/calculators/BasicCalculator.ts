import { CalculatorBase, type CalculatorConfig } from '../CalculatorBase';
import type { CalcOutput } from '../registry/calculator-definition';
import { getMetadata } from '../registry';
import basicDefinition from '../domains/math/basic/definition';
import { keypadConfigFromMetadata } from './keypadConfig';

const OPERATORS = ['+', '−', '×', '÷'];

/** Fallback config built from validated registry metadata (used by tests). */
function basicDefaultConfig(): CalculatorConfig {
  return keypadConfigFromMetadata(getMetadata('basic')!);
}

export class BasicCalculator extends CalculatorBase {
  /**
   * Config is injected by the mount module (A3 bootstrap) so this class no
   * longer fetches registry data itself. The definition's compute remains
   * bound here because BasicCalculator IS the basic calculator's implementation.
   */
  constructor(container: HTMLElement, config: CalculatorConfig = basicDefaultConfig()) {
    super(config, container);
  }

  /** Route evaluation through the definition's pure compute (§8 dependency rule). */
  protected override computeExpression(expression: string): CalcOutput {
    return basicDefinition.compute(expression);
  }

  protected processInput(value: string): void {
    if (value === 'C') return this.clearAll();
    if (value === 'CE') return this.clearEntry();
    if (value === '±') return this.toggleSign();
    if (value === '%') return this.appendPercent();
    if (value === '=') return this.evaluateExpression(this.expression);

    const last = this.expression.slice(-1);
    const lastIsOperator = OPERATORS.includes(last);
    const inputIsOperator = OPERATORS.includes(value);

    if (this.expression === '0' && !inputIsOperator && value !== '.') {
      this.expression = value;
    } else if (lastIsOperator && inputIsOperator) {
      return;
    } else {
      this.expression += value;
    }

    this.updateExpressionView();
  }

  /**
   * Append the percent marker per ratified §12.1 semantics. Resolution to a
   * numeric value happens in compute.ts at evaluation time (base-relative
   * after + −, fractional after × ÷ and standalone) — not by rewriting the
   * last number in the display.
   */
  protected appendPercent(): void {
    const last = this.expression.slice(-1);
    if (this.expression !== '0' && /\d/.test(last)) {
      this.appendToExpression('%');
    }
  }
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('calculator-app');
    if (container) {
      new BasicCalculator(container);
    }
  });
}
