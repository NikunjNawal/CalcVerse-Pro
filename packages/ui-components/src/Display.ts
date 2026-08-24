export interface DisplayProps {
  expression: string;
  result: string;
  'aria-live'?: 'polite' | 'assertive';
}

export function createDisplay(props: DisplayProps): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'calculator-display';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', props['aria-live'] ?? 'polite');

  const expr = document.createElement('div');
  expr.className = 'display-expression';
  expr.textContent = props.expression || '0';
  expr.setAttribute('aria-hidden', 'true');

  const result = document.createElement('div');
  result.className = 'display-result';
  result.textContent = props.result || '0';
  result.setAttribute('role', 'text');

  container.appendChild(expr);
  container.appendChild(result);

  return container;
}

export function updateDisplay(display: HTMLDivElement, expression: string, result: string): void {
  const exprEl = display.querySelector('.display-expression');
  const resultEl = display.querySelector('.display-result');
  if (exprEl) exprEl.textContent = expression || '0';
  if (resultEl) resultEl.textContent = result || '0';
}
