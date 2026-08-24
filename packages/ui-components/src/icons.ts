// CalcVerse icon sprite (V2).
// Single source for inline SVG stroke icons: 24px grid, 1.5px stroke,
// currentColor — themed by CSS, zero dependencies, no icon fonts.
// Add new icons HERE; never paste raw emoji or third-party SVGs into UI code.

export type IconName =
  | 'calculator'
  | 'sparkle'
  | 'search'
  | 'sun'
  | 'moon'
  | 'arrow-right'
  | 'book'
  | 'clock'
  | 'alert-triangle'
  | 'info'
  | 'check'
  | 'sigma'
  | 'atom'
  | 'flask'
  | 'chart-line'
  | 'heart-pulse'
  | 'ruler'
  | 'terminal'
  | 'swap'
  | 'calendar'
  | 'bag'
  | 'github'
  | 'close';

const PATHS: Record<IconName, string> = {
  calculator:
    '<rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="8.01" y2="11"/><line x1="12" y1="11" x2="12.01" y2="11"/><line x1="16" y1="11" x2="16.01" y2="11"/><line x1="8" y1="15" x2="8.01" y2="15"/><line x1="12" y1="15" x2="12.01" y2="15"/><line x1="16" y1="15" x2="16.01" y2="15"/><line x1="8" y1="19" x2="12" y2="19"/><line x1="16" y1="19" x2="16.01" y2="19"/>',
  sparkle:
    '<path d="M12 3l1.9 5.7L19.6 10l-5.7 1.9L12 17.6l-1.9-5.7L4.4 10l5.7-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  sun: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  'arrow-right': '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="13 5 20 12 13 19"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 13.5"/>',
  'alert-triangle':
    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  sigma:
    '<path d="M18 6H7a1 1 0 0 0-.8 1.6L12 14l-5.8 6.4A1 1 0 0 0 7 22h11"/><line x1="6" y1="4" x2="19" y2="4" opacity="0"/>',
  atom: '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-60 12 12)"/>',
  flask:
    '<path d="M10 3h4"/><path d="M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><line x1="7.5" y1="15" x2="16.5" y2="15"/>',
  'chart-line':
    '<polyline points="4 20 4 4"/><line x1="4" y1="20" x2="20" y2="20"/><polyline points="7 15 11 10 14 13 19 6"/>',
  'heart-pulse':
    '<path d="M12 21C7 16.5 3 13 3 8.5A4.5 4.5 0 0 1 7.5 4c1.8 0 3.4 1 4.5 2.6A5.4 5.4 0 0 1 16.5 4 4.5 4.5 0 0 1 21 8.5c0 4.5-4 8-9 12.5z"/><polyline points="7 12 10 12 12 9 14 14 16 12"/>',
  ruler:
    '<rect x="2" y="9" width="20" height="6" rx="1" transform="rotate(-45 12 12)"/><line x1="8" y1="11" x2="10" y2="13"/><line x1="11" y1="8" x2="13" y2="10"/><line x1="14" y1="5" x2="16" y2="7"/>',
  terminal:
    '<polyline points="5 7 10 12 5 17"/><line x1="12" y1="18" x2="20" y2="18"/><rect x="2" y="3" width="20" height="18" rx="2"/>',
  swap: '<polyline points="7 4 3 8 7 12"/><line x1="3" y1="8" x2="15" y2="8"/><polyline points="17 20 21 16 17 12"/><line x1="21" y1="16" x2="9" y2="16"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
  bag: '<path d="M6 7h12l1 14H5z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
  github:
    '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
};

export function iconSvg(name: IconName): string {
  const body = PATHS[name];
  if (!body) throw new Error(`Unknown icon "${name}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export function iconMarkup(name: IconName): string {
  return `<span class="icon" data-icon="${name}">${iconSvg(name)}</span>`;
}
