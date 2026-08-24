type Theme = 'light' | 'dark';

const STORAGE_KEY = 'calcverse-theme';
const DARK_CLASS = 'dark';

function prefersDarkScheme(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved) return saved;
  return prefersDarkScheme() ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  if (theme === 'dark') {
    document.documentElement.classList.add(DARK_CLASS);
  } else {
    document.documentElement.classList.remove(DARK_CLASS);
  }
}

export function initTheme(): Theme {
  const theme = getInitialTheme();
  applyTheme(theme);
  return theme;
}

export function toggleTheme(): Theme {
  const current = document.documentElement.classList.contains(DARK_CLASS) ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY, next);
  return next;
}

export function getTheme(): Theme {
  return document.documentElement.classList.contains(DARK_CLASS) ? 'dark' : 'light';
}

export function onThemeChange(callback: (theme: Theme) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => callback(getTheme());
  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}
