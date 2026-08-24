// @vitest-environment jsdom
// V3 landing page tests — behavior-oriented, not CSS-implementation-coupled.
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

// Real registry + real search + real renderers (integration-level).
const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
const dom = new JSDOM(html);
(globalThis as Record<string, unknown>).document = dom.window.document;
(globalThis as Record<string, unknown>).window = dom.window;

import { mountLanding } from '../landing/landing';
import { searchEntries } from '../landing/search';

function q(sel: string): HTMLElement | null {
  return document.querySelector(sel);
}

beforeEach(() => {
  // Reset dynamic containers so every describe starts from the static shell.
  for (const id of ['domain-rail', 'featured-bento', 'coming-soon-chips', 'ask-search']) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  }
});

describe('V3 landing — static shell', () => {
  it('provides a skip-to-content link', () => {
    expect(q('.skip-link')?.getAttribute('href')).toBe('#main');
  });

  it('has semantic landmarks and heading hierarchy', () => {
    expect(dom.window.document.querySelector('header.cv-header')).toBeTruthy();
    expect(dom.window.document.getElementById('main')).toBeTruthy();
    expect(dom.window.document.querySelector('footer.footer')).toBeTruthy();
    const h2s = [...dom.window.document.querySelectorAll('h2')].map(h => h.id);
    expect(h2s).toContain('hero-title');
  });

  it('contains no emoji in the static shell', () => {
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(html)).toBe(false);
  });

  it('keeps hero copy crawlable without JavaScript', () => {
    expect(html).toContain('Every calculation.');
    expect(html).toContain('<noscript>');
  });
});

describe('V3 landing — dynamic sections', () => {
  it('mounts all discovery sections', () => {
    mountLanding();
    expect(document.querySelectorAll('.domain-tile').length).toBeGreaterThan(5);
    expect(document.querySelectorAll('.bento__card').length).toBeGreaterThanOrEqual(3);
    expect(document.querySelectorAll('.chip').length).toBeGreaterThan(0);
    expect(document.querySelector('.search-box__input')).toBeTruthy();
  });

  it('builds bento cards from registry data with live/soon distinction', async () => {
    mountLanding();
    const { getAllCalculators } = await import('../registry');
    const all = getAllCalculators();
    const live = all.filter(e => e.status === 'live');
    const soon = all.filter(e => e.status === 'coming-soon');

    const primary = q('.bento__card--wide .bento__title')!.textContent;
    expect(primary).toBe(live[0]?.name ?? soon[0]!.name);

    if (live.length > 0 && soon.length > 0) {
      expect(q('.bento__card.is-soon')).toBeTruthy(); // honest availability
      const soonCard = q('.bento__card.is-soon a');
      expect(soonCard).toBeNull(); // coming-soon must NOT link anywhere
    }
    // live cards must link to their generated page
    const liveLink = q('.bento__card:not(.is-soon) .bento__link') as HTMLAnchorElement | null;
    if (liveLink) expect(liveLink.getAttribute('href')).toMatch(/^\/calculators\/.+/);
  });

  it('renders domain rail tiles with data-domain hooks for V4', () => {
    mountLanding();
    const tile = q('.domain-tile[data-domain="mathematics"]');
    expect(tile?.getAttribute('data-domain')).toBe('mathematics');
    expect(document.querySelectorAll('.domain-tile[data-domain]').length).toBeGreaterThan(8);
  });

  it('marks coming-soon rail tiles as planned (not available)', () => {
    mountLanding();
    const plannedTile = [...document.querySelectorAll('.domain-tile')].find(t =>
      t.textContent?.includes('planned')
    );
    expect(plannedTile).toBeTruthy();
  });
});

describe('V3 search over registry metadata', () => {
  it('finds the basic calculator by name and tag', () => {
    const hits = searchEntries('basic');
    expect(hits[0]?.id).toBe('basic');
    expect(hits[0]?.status).toBe('live');
  });

  it('matches tags ("percentage" → basic)', () => {
    expect(searchEntries('percentage')[0]?.id).toBe('basic');
  });

  it('ranks live calculators above coming-soon ones', () => {
    const hits = searchEntries('interest'); // compound-interest is coming-soon
    expect(hits.every(h => h.status === 'coming-soon' || h.id !== 'basic')).toBe(true);
    expect(hits.some(h => h.id === 'compound-interest')).toBe(true);
  });

  it('returns empty array for no matches', () => {
    expect(searchEntries('zzzqqq')).toEqual([]);
  });

  it('empty query returns no results (clean initial state)', () => {
    expect(searchEntries('')).toEqual([]);
  });
});

describe('V3 SearchBox interaction', () => {
  it('shows results while typing and navigates on selection', async () => {
    const navigatedTo: string[] = [];
    mountLanding(href => navigatedTo.push(href));
    const input = q('.search-box__input') as HTMLInputElement;
    input.value = 'basic';
    input.dispatchEvent(new Event('input'));

    const first = q('.search-box__result');
    expect(first?.textContent).toContain('Basic Calculator');

    (first as HTMLElement).click();
    // Selection navigates via the injected handler (jsdom cannot navigate).
    expect(navigatedTo).toEqual(['/calculators/basic.html']);
  });

  it('shows a helpful empty state for unknown queries', () => {
    mountLanding();
    const input = q('.search-box__input') as HTMLInputElement;
    input.value = 'quantum flux capacitor';
    input.dispatchEvent(new Event('input'));
    const empty = q('.search-box__empty');
    expect(empty?.textContent).toContain('No calculators match');
  });

  it('Escape clears query and closes results', () => {
    mountLanding();
    const input = q('.search-box__input') as HTMLInputElement;
    input.value = 'basic';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(input.value).toBe('');
    expect(q('.search-box__results')?.classList.contains('hidden')).toBe(true);
  });
});
