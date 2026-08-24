import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BasicCalculator } from '../calculators/BasicCalculator';

describe('BasicCalculator integration (jsdom)', () => {
  let container: HTMLElement;
  const instances: { destroy(): void }[] = [];

  function clickButton(label: string): void {
    const btns = Array.from(container.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent?.trim() === label);
    if (!btn) throw new Error(`Button "${label}" not found`);
    btn.click();
  }

  function getExpression(): string {
    return container.querySelector('.display-expression')!.textContent ?? '';
  }

  function getResult(): string {
    return container.querySelector('.display-result')!.textContent ?? '';
  }

  function pressKey(key: string): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  }

  function calculateViaUI(sequence: string[]): string {
    sequence.forEach(clickButton);
    return getResult();
  }

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <header class="header"><h1>Basic Calculator</h1></header>
      <main id="calculator-app"></main>
      <footer class="footer"></footer>
    `;
    container = document.getElementById('calculator-app')!;
    instances.push(new BasicCalculator(container));
  });

  afterEach(() => {
    while (instances.length) instances.pop()!.destroy();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('renders display and all buttons', () => {
    expect(container.querySelector('.calculator-display')).toBeTruthy();
    const labels = Array.from(container.querySelectorAll('button')).map(b => b.textContent?.trim());
    for (const label of [
      'C',
      'CE',
      '±',
      '÷',
      '7',
      '8',
      '9',
      '×',
      '4',
      '5',
      '6',
      '−',
      '1',
      '2',
      '3',
      '+',
      '0',
      '%',
      '.',
      '=',
    ]) {
      expect(labels).toContain(label);
    }
  });

  it('does not duplicate the page header or footer', () => {
    expect(document.querySelectorAll('.header').length).toBe(1);
    expect(document.querySelectorAll('.footer').length).toBe(1);
    expect(document.querySelector('.header .theme-toggle')).toBeTruthy();
  });

  it('performs addition via button clicks', () => {
    expect(calculateViaUI(['2', '+', '3', '='])).toBe('5');
  });

  it('respects operator precedence', () => {
    expect(calculateViaUI(['2', '+', '3', '×', '4', '='])).toBe('14');
  });

  it('handles parentheses-free division producing decimals', () => {
    expect(calculateViaUI(['1', '÷', '8', '='])).toBe('0.125');
  });

  it('maintains decimal precision (0.1 + 0.2)', () => {
    expect(calculateViaUI(['0', '.', '1', '+', '0', '.', '2', '='])).toBe('0.3');
  });

  it('rejects consecutive operators', () => {
    calculateViaUI(['5', '+', '×']);
    expect(getExpression()).toBe('5+');
  });

  it('shows error state on division by zero', () => {
    expect(calculateViaUI(['5', '÷', '0', '='])).toBe('Error');
  });

  it('percent appends a marker without rewriting the display', () => {
    clickButton('5');
    clickButton('0');
    clickButton('%');
    expect(getExpression()).toBe('50%');
    clickButton('=');
    expect(getResult()).toBe('0.5');
  });

  it('additive percent is base-relative — ratified: 50 + 10% = 55', () => {
    expect(calculateViaUI(['5', '0', '+', '1', '0', '%', '='])).toBe('55');
  });

  it('subtractive percent is base-relative — 50 − 10% = 45', () => {
    expect(calculateViaUI(['5', '0', '−', '1', '0', '%', '='])).toBe('45');
  });

  it('multiplicative percent is fractional — 200 × 10% = 20', () => {
    expect(calculateViaUI(['2', '0', '0', '×', '1', '0', '%', '='])).toBe('20');
  });

  it('% is ignored when pressed on an empty display', () => {
    clickButton('%');
    expect(getExpression()).toBe('0');
  });

  it('± toggles sign of last number', () => {
    calculateViaUI(['5']);
    clickButton('±');
    expect(getExpression()).toBe('-5');
  });

  it('C clears everything including steps', () => {
    calculateViaUI(['2', '+', '2', '=']);
    clickButton('C');
    expect(getExpression()).toBe('0');
    expect(container.querySelector('.steps-placeholder')).toBeTruthy();
  });

  it('CE deletes one character', () => {
    calculateViaUI(['1', '2', '3']);
    clickButton('CE');
    expect(getExpression()).toBe('12');
  });

  it('supports keyboard input end-to-end', () => {
    '12+34'.split('').forEach(pressKey);
    pressKey('Enter');
    expect(getResult()).toBe('46');
  });

  it('keyboard Backspace and Escape work', () => {
    '7'.split('').forEach(pressKey);
    pressKey('Backspace');
    expect(getExpression()).toBe('0');
    '9'.split('').forEach(pressKey);
    pressKey('Escape');
    expect(getExpression()).toBe('0');
  });

  it('records history after calculation', () => {
    calculateViaUI(['2', '+', '2', '=']);
    const items = Array.from(container.querySelectorAll('.history-item')).map(li => li.textContent);
    expect(items.some(t => t === '2+2 = 4')).toBe(true);
  });

  it('persists history across instances', () => {
    calculateViaUI(['3', '×', '3', '=']);
    const second = document.createElement('main');
    document.body.appendChild(second);
    const secondCalc = new BasicCalculator(second);
    instances.push(secondCalc);
    const items = Array.from(second.querySelectorAll('.history-item')).map(li => li.textContent);
    expect(items.some(t => t === '3×3 = 9')).toBe(true);
  });

  it('generates step-by-step explanation with final answer', () => {
    calculateViaUI(['2', '+', '3', '=']);
    const steps = Array.from(container.querySelectorAll('.step-description')).map(
      el => el.textContent
    );
    expect(steps.some(s => s === '2 + 3 = 5')).toBe(true);
    expect(steps[steps.length - 1]).toContain('Final Answer: 5');
  });

  it('steps panel auto-opens after calculation', () => {
    calculateViaUI(['2', '+', '2', '=']);
    const toggle = container.querySelector('.steps-toggle') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('theme toggle switches class and persists', async () => {
    const themeBtn = document.querySelector('.header .theme-toggle') as HTMLButtonElement;
    themeBtn.click();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('calcverse-theme')).toBe('dark');

    themeBtn.click();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('calcverse-theme')).toBe('light');
  });
});
