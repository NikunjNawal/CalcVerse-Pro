// Local calculator discovery over registry metadata (V3).
// Deliberately simple substring/scoring matcher operating on the SAME
// validated registry the rest of the platform uses — no second catalog.
// Future fuzzy/NL/AI matchers can replace this module without touching the
// landing page or SearchBox.
import type { DisplayEntry } from '../registry';
import { getAllCalculators } from '../registry';

/**
 * Score an entry against a query. Higher is better; 0 = no match.
 * Exact id/name hits rank above tag hits, which rank above substring hits.
 */
export function scoreEntry(entry: DisplayEntry, query: string): number {
  const q = query.trim().toLowerCase();
  if (q === '') return 0;

  const name = entry.name.toLowerCase();
  const id = entry.id.toLowerCase();
  let score = 0;

  if (name === q || id === q) return 100;
  if (name.startsWith(q)) score += 60;
  else if (name.includes(q)) score += 40;
  if (id.includes(q)) score += 20;

  for (const tag of entry.tags) {
    if (tag === q) score += 30;
    else if (tag.includes(q)) score += 10;
  }
  if (entry.category.toLowerCase().includes(q)) score += 8;
  if (entry.description.toLowerCase().includes(q)) score += 5;

  // Coming-soon entries rank below live ones so available tools surface first.
  if (entry.status === 'coming-soon') score -= Math.ceil(score / 2);
  return score;
}

/** Return matching calculators, best-first. Empty query → empty result. */
export function searchEntries(
  query: string,
  all: DisplayEntry[] = getAllCalculators()
): DisplayEntry[] {
  return all
    .map(entry => ({ entry, score: scoreEntry(entry, query) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.entry);
}
