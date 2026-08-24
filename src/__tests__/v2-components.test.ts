// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createIcon } from '@ui/Icon';
import { iconSvg } from '@ui/icons';
import { createSkeleton } from '@ui/StatePrimitives';
import { createBadge } from '@ui/StatePrimitives';
import { createEmptyState } from '@ui/StatePrimitives';
import { createResultCard } from '@ui/ResultCard';

describe('Icon system', () => {
  it('renders inline svg using currentColor', () => {
    const el = createIcon('calculator');
    expect(el.classList.contains('icon')).toBe(true);
    expect(el.querySelector('svg')).toBeTruthy();
    expect(el.querySelector('svg')!.getAttribute('stroke')).toBe('currentColor');
  });

  it('is decorative by default (aria-hidden)', () => {
    expect(createIcon('search').getAttribute('aria-hidden')).toBe('true');
  });

  it('supports meaningful icons via label', () => {
    const el = createIcon('info', { label: 'Information' });
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Information');
  });

  it('rejects unknown icon names', () => {
    expect(() => iconSvg('nope' as never)).toThrow(/Unknown icon/);
  });
});

describe('Badge', () => {
  it('renders text with default accent variant', () => {
    const b = createBadge('Live');
    expect(b.className).toBe('badge');
    expect(b.textContent).toBe('Live');
  });

  it('applies variant class and optional icon', () => {
    const b = createBadge('Beta', { variant: 'warning', icon: 'alert-triangle' });
    expect(b.className).toContain('badge--warning');
    expect(b.querySelector('.icon')).toBeTruthy();
  });
});

describe('Skeleton', () => {
  it('renders a single bar by default', () => {
    const s = createSkeleton();
    expect(s.querySelectorAll('.skeleton').length).toBe(1);
  });

  it('renders multiple lines with shortened last line', () => {
    const s = createSkeleton({ lines: 3 });
    expect(s.querySelectorAll('.skeleton').length).toBe(3);
    const last = s.querySelectorAll('.skeleton')[2] as HTMLElement;
    expect(last.style.width).toBe('60%');
  });
});

describe('EmptyState', () => {
  it('renders title and message', () => {
    const el = createEmptyState({ title: 'No results', message: 'Try another query' });
    expect(el.textContent).toContain('No results');
    expect(el.textContent).toContain('Try another query');
  });

  it('wires the action button', () => {
    let clicked = false;
    const el = createEmptyState({
      title: 'Empty',
      actionLabel: 'Retry',
      onAction: () => (clicked = true),
    });
    (el.querySelector('button') as HTMLButtonElement).click();
    expect(clicked).toBe(true);
  });

  it('includes optional icon', () => {
    expect(createEmptyState({ title: 'x', icon: 'search' }).querySelector('.icon')).toBeTruthy();
  });
});

describe('ResultCard foundation', () => {
  it('renders value as live-region status', () => {
    const card = createResultCard({ value: '42' });
    expect(card.className).toBe('result-card');
    expect(card.getAttribute('role')).toBe('status');
    expect(card.querySelector('.result-card__value')!.textContent).toBe('42');
  });

  it('shows unit context and formula when supplied', () => {
    const card = createResultCard({ value: '9.81', unit: 'm/s²', formula: 'g = 9.81' });
    expect(card.querySelector('.result-card__unit')!.textContent).toBe('m/s²');
    expect(card.querySelector('.result-card__formula')!.textContent).toBe('g = 9.81');
  });

  it('renders warnings with machine-readable codes', () => {
    const card = createResultCard({
      value: '~3.14',
      warnings: [{ code: 'W_APPROXIMATE_RESULT', message: 'Iterative approximation' }],
    });
    const w = card.querySelector('.result-card__warning')!;
    expect(w.getAttribute('data-warning-code')).toBe('W_APPROXIMATE_RESULT');
    expect(w.textContent).toContain('Iterative approximation');
  });
});
