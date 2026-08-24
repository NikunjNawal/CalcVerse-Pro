// ResultCard — the V2 foundation of the result experience (V1 §11).
// Anatomy: value → unit/context → formula → warnings.
// Presentation only: values arrive already computed; formatting via @format
// happens in callers. Warnings are always visible (never animated).
import { createIcon } from './Icon';

export interface ResultCardOptions {
  value: string;
  unit?: string;
  formula?: string;
  contextLabel?: string;
  warnings?: { code: string; message: string }[];
}

export function createResultCard(options: ResultCardOptions): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'result-card';
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');

  const valueEl = document.createElement('div');
  valueEl.className = 'result-card__value';
  valueEl.textContent = options.value;
  card.appendChild(valueEl);

  const context = [options.contextLabel, options.unit].filter(Boolean).join(' · ');
  if (context) {
    const unitEl = document.createElement('div');
    unitEl.className = 'result-card__unit';
    unitEl.textContent = context;
    card.appendChild(unitEl);
  }

  if (options.formula) {
    const formulaEl = document.createElement('div');
    formulaEl.className = 'result-card__formula';
    formulaEl.textContent = options.formula;
    card.appendChild(formulaEl);
  }

  for (const w of options.warnings ?? []) {
    const warn = document.createElement('div');
    warn.className = 'result-card__warning';
    warn.dataset.warningCode = w.code;
    warn.appendChild(createIcon('alert-triangle', { size: 'sm' }));
    const msg = document.createElement('span');
    msg.textContent = w.message;
    warn.appendChild(msg);
    card.appendChild(warn);
  }

  return card;
}
