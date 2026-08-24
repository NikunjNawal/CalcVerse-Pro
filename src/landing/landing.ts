// V3 landing page composition.
// index.html owns the STATIC shell (hero copy, benefits, footer — crawlable,
// no-JS friendly). This module renders only the DATA-DRIVEN sections:
// domain rail, featured bento, coming-soon chips, and search wiring.
import { createSearchBox, iconMarkup } from '@ui';
import { getAllCalculators, type DisplayEntry } from '../registry';
import { categoryMeta, CATEGORY_META } from './categories';
import { searchEntries } from './search';

function el<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function setYear(): void {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear().toString();
}

// ---------------------------------------------------------------------------
// Domain discovery rail
// ---------------------------------------------------------------------------

export function renderDomainRail(container: HTMLElement): void {
  const entries = getAllCalculators();
  // Every ratified domain is shown (planned ones included) so the rail
  // communicates the full universe; availability is labeled per tile.
  const counts = new Map<string, { live: number; soon: number }>(
    Object.keys(CATEGORY_META).map(id => [id, { live: 0, soon: 0 }])
  );
  for (const e of entries) {
    const c = counts.get(e.category) ?? { live: 0, soon: 0 };
    if (e.status === 'live') c.live++;
    else c.soon++;
    counts.set(e.category, c);
  }

  // Order rail by live availability first, then alphabetical label.
  const cats = [...counts.entries()]
    .map(([id, c]) => ({ ...categoryMeta(id), id, live: c.live, soon: c.soon }))
    .sort((a, b) => b.live - a.live || a.label.localeCompare(b.label));

  container.className = 'domain-rail';
  container.setAttribute('role', 'list');
  container.innerHTML = '';

  for (const cat of cats) {
    const tile = document.createElement('div');
    tile.className = 'domain-tile' + (cat.live > 0 ? ' is-live' : '');
    tile.setAttribute('role', 'listitem');
    tile.dataset.domain = cat.id;

    tile.innerHTML = `
      <span class="domain-tile__icon">${iconMarkup(cat.icon)}</span>
      <span class="domain-tile__label">${cat.label}</span>
      <span class="domain-tile__count">${cat.live > 0 ? `${cat.live} available` : 'planned'}</span>
    `;
    container.appendChild(tile);
  }
}

// ---------------------------------------------------------------------------
// Featured bento
// ---------------------------------------------------------------------------

export function renderFeaturedBento(container: HTMLElement): void {
  const all = getAllCalculators();
  const live = all.filter(e => e.status === 'live');
  const soon = all.filter(e => e.status === 'coming-soon');

  container.className = 'bento';
  container.innerHTML = '';

  const makeCard = (entry: DisplayEntry, size: 'wide' | 'tall' | 'std'): HTMLElement => {
    const card = document.createElement('article');
    card.className =
      `bento__card bento__card--${size}` + (entry.status === 'coming-soon' ? ' is-soon' : '');
    card.dataset.domain = entry.category;
    const meta = categoryMeta(entry.category);

    card.innerHTML = `
      <div class="bento__head">
        <span class="bento__icon">${iconMarkup(meta.icon)}</span>
        ${entry.status === 'coming-soon' ? '<span class="badge badge--neutral">Coming soon</span>' : '<span class="badge">Available</span>'}
      </div>
      <h3 class="bento__title">${entry.name}</h3>
      <p class="bento__desc">${entry.description}</p>
      <span class="bento__category">${meta.label}</span>
    `;

    if (entry.status === 'live') {
      const link = document.createElement('a');
      link.className = 'bento__link';
      link.href = entry.path;
      link.setAttribute('aria-label', `Open ${entry.name}`);
      card.appendChild(link);
    }
    return card;
  };

  // Primary wide tile: first LIVE calculator (flagship). Fallback to first
  // coming-soon so the section never renders empty during early growth.
  const primary = live[0] ?? soon[0];
  if (primary) container.appendChild(makeCard(primary, 'wide'));

  // Secondary tall tiles: next two live calculators, else notable planned ones.
  const secondary = [...live.slice(1), ...soon.filter(s => s.id !== primary?.id)].slice(0, 2);
  secondary.forEach(entry => container.appendChild(makeCard(entry, 'tall')));

  // Remaining live calculators as standard tiles (grows over time).
  live.slice(3).forEach(entry => container.appendChild(makeCard(entry, 'std')));
}

// ---------------------------------------------------------------------------
// Coming-soon exploration chips
// ---------------------------------------------------------------------------

export function renderComingSoonChips(container: HTMLElement): void {
  const soon = getAllCalculators().filter(e => e.status === 'coming-soon');
  container.className = 'chip-marquee';
  container.innerHTML = '';
  // Duplicated track pairs enable a seamless CSS loop; reduced-motion users
  // get a static wrapped row instead (see CSS).
  for (const pass of ['aria-hidden', undefined] as const) {
    const track = document.createElement('div');
    track.className = 'chip-marquee__track';
    if (pass === 'aria-hidden') track.setAttribute('aria-hidden', 'true');
    for (const entry of soon.length ? soon : []) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = entry.name;
      track.appendChild(chip);
    }
    container.appendChild(track);
  }
}

// ---------------------------------------------------------------------------
// Ask / search wiring
// ---------------------------------------------------------------------------

export function wireAskBar(
  container: HTMLElement,
  navigate: (href: string) => void = href => {
    window.location.href = href;
  }
): void {
  const box = createSearchBox({
    placeholder: 'What do you want to calculate?',
    ariaLabel: 'Search calculators',
    onSearch: query =>
      searchEntries(query).map(e => ({
        id: e.id,
        label: e.name,
        hint: e.description,
        href: e.path,
        disabled: e.status === 'coming-soon',
      })),
    onSelect: item => navigate(item.href ?? '/'),
  });
  container.appendChild(box);

  // Example suggestion chips under the bar.
  const suggestions = document.createElement('div');
  suggestions.className = 'ask-suggestions';
  for (const q of ['percentage', 'convert', 'compound interest']) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'ask-suggestions__chip';
    chip.textContent = q;
    chip.addEventListener('click', () => {
      const input = box.querySelector<HTMLInputElement>('.search-box__input');
      if (!input) return;
      input.value = q;
      input.dispatchEvent(new Event('input'));
      input.focus();
    });
    suggestions.appendChild(chip);
  }
  container.appendChild(suggestions);
}

/** Entry point — called from main-index after DOM ready. */
export function mountLanding(navigate?: (href: string) => void): void {
  setYear();
  const rail = el('domain-rail');
  if (rail) renderDomainRail(rail);
  const bento = el('featured-bento');
  if (bento) renderFeaturedBento(bento);
  const chips = el('coming-soon-chips');
  if (chips) renderComingSoonChips(chips);
  const ask = el('ask-search');
  if (ask) wireAskBar(ask, navigate);
}
