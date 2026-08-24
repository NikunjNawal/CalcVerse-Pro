// SearchBox — accessible calculator-discovery input (V3).
// Generic combobox primitive: owns interaction/ARIA only. Result DATA and
// selection behavior are supplied by the caller, so a smarter (fuzzy/NL/AI)
// matcher can replace the local one later without touching this component.
import { createIcon } from './Icon';

export interface SearchResultItem {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  disabled?: boolean;
}

export interface SearchBoxOptions {
  placeholder?: string;
  /** Return matching items for the current query. */
  onSearch: (query: string) => SearchResultItem[];
  /** Fired when an enabled result is chosen (click or Enter). */
  onSelect?: (item: SearchResultItem) => void;
  /** Label for the visually-hidden input label. */
  ariaLabel?: string;
}

export function createSearchBox(options: SearchBoxOptions): HTMLDivElement {
  const root = document.createElement('div');
  root.className = 'search-box';

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'search-box__input';
  input.placeholder = options.placeholder ?? 'Search calculators…';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', 'search-results');
  input.setAttribute('aria-autocomplete', 'list');
  if (options.ariaLabel) input.setAttribute('aria-label', options.ariaLabel);

  const searchIcon = createIcon('search', { size: 'sm' });
  searchIcon.className += ' search-box__icon';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'search-box__clear hidden';
  clearBtn.setAttribute('aria-label', 'Clear search');
  clearBtn.appendChild(createIcon('close', { size: 'sm' }));

  const results = document.createElement('ul');
  results.id = 'search-results';
  results.className = 'search-box__results hidden';
  results.setAttribute('role', 'listbox');

  let items: SearchResultItem[] = [];
  let activeIndex = -1;

  function closeResults(): void {
    results.classList.add('hidden');
    input.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
  }

  function renderResults(query: string): void {
    items = query.trim() === '' ? [] : options.onSearch(query);
    results.innerHTML = '';
    clearBtn.classList.toggle('hidden', query === '');

    if (items.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'search-box__empty';
      empty.setAttribute('role', 'option');
      empty.setAttribute('aria-disabled', 'true');
      empty.textContent =
        query.trim() === ''
          ? ''
          : `No calculators match "${query.trim()}" — try "percentage", "convert", or browse categories below.`;
      if (query.trim() !== '') results.classList.remove('hidden');
      else closeResults();
      results.appendChild(empty);
      input.setAttribute('aria-expanded', String(query.trim() !== ''));
      return;
    }

    items.forEach((item, i) => {
      const li = document.createElement('li');
      li.id = `search-result-${item.id}`;
      li.setAttribute('role', 'option');
      li.className = 'search-box__result';

      if (item.disabled) {
        li.setAttribute('aria-disabled', 'true');
        li.textContent = item.label;
        const tag = document.createElement('span');
        tag.className = 'badge badge--neutral';
        tag.textContent = 'Coming soon';
        li.appendChild(tag);
      } else {
        li.textContent = item.label;
        li.addEventListener('click', () => {
          options.onSelect?.(item);
          closeResults();
          input.value = '';
          clearBtn.classList.add('hidden');
        });
      }
      if (i === 0) li.setAttribute('aria-selected', 'true');
      results.appendChild(li);
    });

    results.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
    activeIndex = 0;
    highlight();
  }

  function highlight(): void {
    [...results.querySelectorAll('.search-box__result')].forEach((el, i) =>
      el.classList.toggle('is-active', i === activeIndex)
    );
  }

  function moveActive(delta: number): void {
    const enabled = items.filter(i => !i.disabled);
    if (enabled.length === 0) return;
    // skip disabled entries when moving
    do {
      activeIndex = (activeIndex + delta + items.length) % items.length;
    } while (items[activeIndex]?.disabled);
    highlight();
  }

  function chooseActive(): void {
    const item = items[activeIndex];
    if (!item || item.disabled) return;
    options.onSelect?.(item);
    closeResults();
    input.value = '';
    clearBtn.classList.add('hidden');
  }

  input.addEventListener('input', () => renderResults(input.value));
  input.addEventListener('keydown', e => {
    const open = !results.classList.contains('hidden');
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open) chooseActive();
    } else if (e.key === 'Escape') {
      closeResults();
      input.value = '';
      clearBtn.classList.add('hidden');
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    closeResults();
    input.focus();
  });

  document.addEventListener('click', e => {
    if (!root.contains(e.target as Node)) closeResults();
  });

  root.append(searchIcon, input, clearBtn, results);
  return root;
}
