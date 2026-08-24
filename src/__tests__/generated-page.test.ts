// @vitest-environment jsdom
// Behavioral smoke test for the GENERATED calculator page (A3).
// Reproduces the exact production wiring: read dist page → extract
// <meta name="calculator-id"> → registry.loadDefinition → domain mount →
// BasicCalculator → simulate user input. Not curl-only; this executes the app.
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const DIST = path.resolve(__dirname, '../../dist');
const PAGE = path.join(DIST, 'calculators', 'basic.html');

const consoleErrors: string[] = [];

let dom: JSDOM;

beforeAll(async () => {
  // Ensure artifacts exist even when tests run before a build.
  if (!fs.existsSync(PAGE)) {
    const { execSync } = await import('node:child_process');
    execSync('npx tsx scripts/build-pages.mts', { cwd: path.resolve(__dirname, '../..') });
  }

  const html = fs.readFileSync(PAGE, 'utf8');
  dom = new JSDOM(html, {
    url: 'https://nikunjnawal.github.io/CalcVerse-Pro/calculators/basic.html',
  });
  (globalThis as Record<string, unknown>).document = dom.window.document;
  console.error = (...args: unknown[]) => {
    consoleErrors.push(String(args));
  };

  // Execute the same mounting sequence main-calculator.ts performs.
  const id = document.querySelector('meta[name="calculator-id"]')?.getAttribute('content');
  expect(id).toBe('basic');

  const { loadDefinition } = await import('../registry');
  const def = await loadDefinition(id!);
  const container = document.getElementById('calculator-app')!;
  const { keypadConfigFromMetadata } = await import('../calculators/keypadConfig');
  const config = keypadConfigFromMetadata(def);

  const { BasicCalculator } = await import('../calculators/BasicCalculator');
  new BasicCalculator(container, config);
});

function click(label: string): void {
  const btns = Array.from(document.querySelectorAll('button'));
  const btn = btns.find(b => b.textContent?.trim() === label);
  if (!btn) throw new Error(`button "${label}" not found`);
  btn.click();
}

function result(): string {
  return document.querySelector('.display-result')!.textContent ?? '';
}

describe('generated /calculators/basic.html behaves correctly', () => {
  it('mounts the calculator into the page container', () => {
    expect(document.querySelector('.calculator-display')).toBeTruthy();
    expect(document.querySelectorAll('.btn').length).toBeGreaterThanOrEqual(20);
  });

  it('computes ratified percentage semantics: 50 + 10% = 55', () => {
    ['5', '0', '+', '1', '0', '%', '='].forEach(click);
    expect(result()).toBe('55');
  });

  it('performs basic arithmetic: 6 × 7 = 42', () => {
    ['C', '6', '×', '7', '='].forEach(click);
    expect(result()).toBe('42');
  });

  it('records history entries', () => {
    const items = Array.from(document.querySelectorAll('.history-item')).map(li => li.textContent);
    expect(items.some(t => t === '50+10% = 55')).toBe(true);
  });

  it('produces step-by-step explanations with final answer', () => {
    const steps = Array.from(document.querySelectorAll('.step-description')).map(
      el => el.textContent
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[steps.length - 1]).toContain('Final Answer');
  });

  it('accepts keyboard input end-to-end', () => {
    click('C'); // isolate from prior test state
    '12-5'
      .split('')
      .forEach(k =>
        document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
      );
    expect(document.querySelector('.display-expression')!.textContent).toBe('12−5');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(result()).toBe('7');
  });

  it('renders theme toggle and persists theme choice', () => {
    const toggle = document.querySelector('.theme-toggle') as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    toggle.click();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    toggle.click();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('collects no console errors during the entire session', () => {
    expect(consoleErrors).toEqual([]);
  });
});
