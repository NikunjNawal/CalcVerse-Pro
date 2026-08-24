import { initTheme, toggleTheme, onThemeChange } from '@theme';
import { iconSvg } from './icons';

export function createThemeToggle(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Toggle dark mode');

  function updateButton(theme: 'light' | 'dark'): void {
    // Sun shown in dark mode (action = switch to light); moon in light mode.
    btn.innerHTML = `${iconSvg(theme === 'dark' ? 'sun' : 'moon')}<span>${theme === 'dark' ? 'Light' : 'Dark'}</span>`;
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  const currentTheme = initTheme();
  updateButton(currentTheme);

  btn.addEventListener('click', () => {
    const next = toggleTheme();
    updateButton(next);
  });

  const cleanup = onThemeChange(updateButton);
  (btn as HTMLButtonElement & { _cleanup?: () => void })._cleanup = cleanup;

  return btn;
}
