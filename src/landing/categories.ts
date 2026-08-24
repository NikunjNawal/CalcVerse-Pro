// Domain/category presentation metadata for discovery UIs (V3).
// Visual THEME values are NOT here — V4 owns domain accents/motifs via the
// token scopes; this file only maps categories to labels + icon names so
// discovery components stay data-driven.
import type { IconName } from '@ui/icons';

export interface CategoryMeta {
  id: string;
  label: string;
  icon: IconName;
  tagline: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  mathematics: {
    id: 'mathematics',
    label: 'Mathematics',
    icon: 'sigma',
    tagline: 'Numbers, algebra, statistics',
  },
  physics: { id: 'physics', label: 'Physics', icon: 'atom', tagline: 'Motion, energy, forces' },
  chemistry: {
    id: 'chemistry',
    label: 'Chemistry',
    icon: 'flask',
    tagline: 'Moles, solutions, reactions',
  },
  finance: {
    id: 'finance',
    label: 'Finance',
    icon: 'chart-line',
    tagline: 'Interest, loans, investments',
  },
  health: {
    id: 'health',
    label: 'Health',
    icon: 'heart-pulse',
    tagline: 'Body, nutrition, fitness',
  },
  engineering: {
    id: 'engineering',
    label: 'Engineering',
    icon: 'ruler',
    tagline: 'Technical calculations',
  },
  computing: {
    id: 'computing',
    label: 'Computing',
    icon: 'terminal',
    tagline: 'Data, networks, bases',
  },
  business: {
    id: 'business',
    label: 'Business',
    icon: 'chart-line',
    tagline: 'Margins, pricing, growth',
  },
  tax: { id: 'tax', label: 'Tax', icon: 'book', tagline: 'Jurisdiction-aware estimates' },
  'data-science': {
    id: 'data-science',
    label: 'Data Science',
    icon: 'chart-line',
    tagline: 'Metrics and models',
  },
  conversion: {
    id: 'conversion',
    label: 'Conversion',
    icon: 'swap',
    tagline: 'Every unit, both directions',
  },
  'date-time': {
    id: 'date-time',
    label: 'Date & Time',
    icon: 'calendar',
    tagline: 'Ages, spans, workdays',
  },
  everyday: { id: 'everyday', label: 'Everyday', icon: 'bag', tagline: 'Tips, splits, shopping' },
};

export function categoryMeta(id: string): CategoryMeta {
  return CATEGORY_META[id] ?? { id, label: id, icon: 'calculator' as const, tagline: '' };
}
