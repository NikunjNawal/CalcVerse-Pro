// Icon factory — renders a sprite icon as an inline, theme-aware element.
// Accessibility: decorative by default (aria-hidden); pass role/label for
// meaningful icons.
import { iconSvg, type IconName } from './icons';

export type { IconName };

export interface IconOptions {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function createIcon(name: IconName, options: IconOptions = {}): HTMLElement {
  const el = document.createElement('span');
  el.className = `icon${options.size ? ` icon--${options.size}` : ''}`;
  el.innerHTML = iconSvg(name); // sprite markup is authored in-repo; no user input
  if (options.label) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', options.label);
  } else {
    el.setAttribute('aria-hidden', 'true');
  }
  return el;
}
