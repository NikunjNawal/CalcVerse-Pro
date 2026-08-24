// Validated auto-assembled registry (§9).
//
// Discovery mechanism:
// - METADATA: `import.meta.glob('/src/domains/**/metadata.ts', { eager: true })`
//   Vite resolves this glob at compile time and inlines the modules into the
//   importing chunk. Because metadata.ts files never import calc-engine, the
//   landing page can list calculators WITHOUT loading any compute code.
//   Validation runs at module initialization — an invalid definition breaks
//   every page that imports the registry (dev overlay + vitest + build).
// - DEFINITIONS: `import.meta.glob('...definition.ts', { eager: false })`
//   produces lazy loaders; full definitions (with engine) load only on
//   calculator pages that actually evaluate.
//
// A Node-side prebuild validator + artifact generation arrives with A3
// (page generation); the shared validator module is already Node-compatible.

import type { CalculatorDefinition } from './calculator-definition';
import type { BasicMetadata, ValidationError } from './validator';
import { validateMetadata, validateUniqueIdentities } from './validator';
import { seedCalculators } from './seeds';

// ---------------------------------------------------------------------------
// Discovery (compile-time glob → runtime map)
// ---------------------------------------------------------------------------

const metadataModules = import.meta.glob<{ default: BasicMetadata }>(
  '/src/domains/**/metadata.ts',
  {
    eager: true,
  }
);

const definitionLoaders = import.meta.glob<{ default: CalculatorDefinition }>(
  '/src/domains/**/definition.ts'
);

function sourcePathOf(globKey: string): string {
  return globKey.replace(/^\/src\//, 'src/');
}

// ---------------------------------------------------------------------------
// Assembly + eager validation (fails fast at startup/build)
// ---------------------------------------------------------------------------

export interface DisplayEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  status: 'live' | 'coming-soon';
  path: string | '';
  featured?: boolean;
}

const FEATURED_IDS = new Set<string>([
  'basic',
  'scientific',
  'unit-converter',
  'bmi',
  'compound-interest',
]);

const discovered: { meta: BasicMetadata; path: string }[] = [];
const discoveryErrors: ValidationError[] = [];

for (const [globKey, mod] of Object.entries(metadataModules)) {
  const path = sourcePathOf(globKey);
  const meta = mod?.default;
  if (!meta) {
    discoveryErrors.push({
      path,
      field: 'default',
      message: 'metadata module must default-export its metadata',
    });
    continue;
  }
  discoveryErrors.push(...validateMetadata(meta, path));
  discovered.push({ meta, path });
}

discoveryErrors.push(
  ...validateUniqueIdentities(discovered.map(d => ({ id: d.meta.id, path: d.path })))
);

if (discoveryErrors.length > 0) {
  const detail = discoveryErrors.map(e => `  ${e.path} → ${e.field}: ${e.message}`).join('\n');
  throw new Error(
    `[registry] Invalid calculator definition(s) — build cannot continue:\n${detail}`
  );
}

const metadataById = new Map<string, BasicMetadata & { path: string }>(
  discovered.map(d => [d.meta.id, { ...d.meta, path: d.path }])
);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** All displayable entries: live definitions first, then coming-soon seeds. */
export function getAllCalculators(): DisplayEntry[] {
  const live: DisplayEntry[] = [...metadataById.values()].map(m => ({
    id: m.id,
    name: m.name,
    description: m.seo.description,
    category: m.category,
    tags: m.tags,
    status: m.status,
    path: routeFor(m.id),
    featured: FEATURED_IDS.has(m.id) || undefined,
  }));

  const seedEntries: DisplayEntry[] = seedCalculators
    .filter(seed => !metadataById.has(seed.id))
    .map(seed => ({
      id: seed.id,
      name: seed.name,
      description: seed.description,
      category: seed.category,
      tags: seed.tags,
      status: 'coming-soon' as const,
      path: '', // unpublished — no page is generated for coming-soon calculators
      featured: FEATURED_IDS.has(seed.id) || undefined,
    }));

  return [...live, ...seedEntries];
}

export function getFeaturedCalculators(): DisplayEntry[] {
  return getAllCalculators().filter(e => e.featured);
}

export function getComingSoonCalculators(): DisplayEntry[] {
  return getAllCalculators().filter(e => e.status === 'coming-soon');
}

/** Synchronous display metadata for a live calculator. */
export function getMetadata(id: string): (BasicMetadata & { path: string }) | undefined {
  return metadataById.get(id);
}

/**
 * Load a FULL definition (including compute). Lazy — pulls the definition's
 * chunk and its engine dependency only when actually needed.
 */
export async function loadDefinition(id: string): Promise<CalculatorDefinition> {
  // Prefer the loader keyed next to the known metadata path so ids and files
  // stay linked even across directories.
  const loaderKey = Object.keys(definitionLoaders).find(
    key =>
      sourcePathOf(key) === metadataById.get(id)?.path.replace(/metadata\.ts$/, 'definition.ts')
  );
  if (loaderKey) return (await definitionLoaders[loaderKey]()).default;

  // Fallback: scan loaders by exported id (handles relocated modules).
  for (const load of Object.values(definitionLoaders)) {
    const def = (await load()).default;
    if (def.id === id) return def;
  }
  throw new Error(`[registry] No definition found for calculator "${id}"`);
}

/**
 * Route convention (A3): generated pages live at /calculators/<id>.html.
 * Derived purely from the id — no manual route table exists anywhere.
 */
function routeFor(id: string): string {
  return `/calculators/${id}.html`;
}
