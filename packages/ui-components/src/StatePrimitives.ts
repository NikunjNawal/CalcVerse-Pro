// Skeleton / Badge / EmptyState — V2 state primitives.
import { createIcon, type IconName } from './Icon';

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export interface SkeletonOptions {
  width?: string;
  height?: string;
  lines?: number;
}

export function createSkeleton(options: SkeletonOptions = {}): HTMLDivElement {
  const wrap = document.createElement('div');
  const lines = options.lines ?? 1;
  for (let i = 0; i < lines; i++) {
    const bar = document.createElement('span');
    bar.className = 'skeleton';
    if (options.width) bar.style.width = options.width;
    bar.style.height = options.height ?? '1rem';
    if (lines > 1 && i === lines - 1) bar.style.width = '60%';
    wrap.appendChild(bar);
  }
  return wrap;
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export type BadgeVariant = 'accent' | 'neutral' | 'success' | 'warning';

export interface BadgeOptions {
  variant?: BadgeVariant;
  icon?: IconName;
}

export function createBadge(text: string, options: BadgeOptions = {}): HTMLSpanElement {
  const el = document.createElement('span');
  const variant = options.variant ?? 'accent';
  el.className = `badge${variant !== 'accent' ? ` badge--${variant}` : ''}`;
  if (options.icon) el.appendChild(createIcon(options.icon, { size: 'sm' }));
  el.appendChild(document.createTextNode(text));
  return el;
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

export interface EmptyStateOptions {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function createEmptyState(options: EmptyStateOptions): HTMLElement {
  const el = document.createElement('div');
  el.className = 'empty-state';

  if (options.icon) {
    const icon = createIcon(options.icon);
    icon.className += ' empty-state__icon';
    el.appendChild(icon);
  }

  const title = document.createElement('p');
  title.className = 'empty-state__title';
  title.textContent = options.title;
  el.appendChild(title);

  if (options.message) {
    const msg = document.createElement('p');
    msg.textContent = options.message;
    el.appendChild(msg);
  }

  if (options.actionLabel && options.onAction) {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'btn btn-secondary btn-sm empty-state__action';
    action.textContent = options.actionLabel;
    action.addEventListener('click', options.onAction);
    el.appendChild(action);
  }

  return el;
}
