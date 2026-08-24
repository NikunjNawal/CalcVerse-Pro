// Page/sitemap generation core — PURE library, no CLI, no direct fs writes.
// Consumed by scripts/build-pages.mts (Node) and by generator tests.
//
// Node/Vite boundary (CALCVERSE_MASTER_ARCHITECTURE.md §9/§12):
//   Node prebuild : discovery (fs walk) → validation → artifact strings
//   Vite          : bundling of the generated HTML entries + app modules
//   Runtime       : rendering/computation via main-calculator.ts bootstrap
import type { BasicMetadata } from '../../src/registry/validator';
import {
  validateMetadata,
  validateDefinition,
  validateUniqueIdentities,
} from '../../src/registry/validator';
import type { ValidationError } from '../../src/registry/validator';
import fs from 'node:fs';
import path from 'node:path';

/** Canonical site origin + base path — single deployment constant. */
export const SITE_ORIGIN = 'https://nikunjnawal.github.io';
export const SITE_BASE_PATH = '/CalcVerse-Pro';

export const CALCULATOR_ROUTE_PREFIX = 'calculators';

/** Architecture route convention: /calculators/<id>.html */
export function calculatorRoute(id: string): string {
  return `${CALCULATOR_ROUTE_PREFIX}/${id}.html`;
}

export function absoluteUrl(route: string): string {
  return `${SITE_ORIGIN}${SITE_BASE_PATH}/${route.replace(/^\//, '')}`;
}

// ---------------------------------------------------------------------------
// Discovery (filesystem)
// ---------------------------------------------------------------------------

export interface DiscoveredFile {
  /** Path relative to the project root, e.g. src/domains/math/basic/metadata.ts */
  path: string;
  absolutePath: string;
}

export function discoverMetadataFiles(domainsDir: string): DiscoveredFile[] {
  const results: DiscoveredFile[] = [];

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.name === 'metadata.ts' || entry.name === 'definition.ts') {
        const rel = path.relative(process.cwd(), abs).split(path.sep).join('/');
        results.push({ path: rel, absolutePath: abs });
      }
    }
  };

  walk(domainsDir);
  return results;
}

export interface LoadedMetadata {
  meta: BasicMetadata;
  /** Path relative to project root, e.g. src/domains/math/basic/metadata.ts */
  path: string;
  /** Directory containing the module (used to locate sibling definition.ts). */
  absoluteDir?: string;
}

/** Import a metadata module under the tsx loader and return its default export. */
export async function importMetadataModule(file: DiscoveredFile): Promise<BasicMetadata> {
  const mod = await import(file.absolutePath);
  return mod.default;
}

/** Whole-tree validation: metadata for every entry; full definitions for live ones. */
export async function validateTree(
  loaded: LoadedMetadata[]
): Promise<{ errors: ValidationError[]; valid: LoadedMetadata[] }> {
  const errors: ValidationError[] = [];

  errors.push(...validateUniqueIdentities(loaded.map(l => ({ id: l.meta.id, path: l.path }))));

  for (const entry of loaded) {
    errors.push(...validateMetadata(entry.meta, entry.path));

    if (entry.meta.status === 'live') {
      // Whole-tree rule (A2 debt item): LIVE calculators must have a complete,
      // validated definition — not just display metadata.
      const defRelPath = entry.path.replace(/metadata\.ts$/, 'definition.ts');
      const defAbsPath =
        entry.absoluteDir !== undefined
          ? path.join(entry.absoluteDir, 'definition.ts')
          : path.join(process.cwd(), defRelPath);
      if (!fs.existsSync(defAbsPath)) {
        errors.push({
          path: entry.path,
          field: 'definition',
          message: `live calculator "${entry.meta.id}" is missing its definition module (${defRelPath})`,
        });
        continue;
      }
      const def = await import(defAbsPath);
      errors.push(...validateDefinition(def.default, defRelPath));
    }
  }

  const invalidPaths = new Set(errors.map(e => e.path));
  return { errors, valid: loaded.filter(l => !invalidPaths.has(l.path)) };
}

// ---------------------------------------------------------------------------
// Artifact renderers
// ---------------------------------------------------------------------------

export interface GeneratedPage {
  /** Output file name relative to dist root. */
  file: string;
  html: string;
  /** Vite rollup input key. */
  entryName: string;
  isRedirect?: boolean;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render one calculator page. Static content (formula/explanation/assumptions/
 * limitations) is prerendered for crawlers and no-JS visitors per §24.2;
 * the generic runtime bootstrap hydrates interactivity.
 */
export function renderCalculatorPage(meta: BasicMetadata): GeneratedPage {
  const route = calculatorRoute(meta.id);
  const canonical = absoluteUrl(route);
  const title = escapeHtml(meta.seo.title);
  const description = escapeHtml(meta.seo.description);
  const name = escapeHtml(meta.name);

  const explanation = meta.explanation;
  const staticSections = `
    <section class="calculator-info">
      <h2>About this calculator</h2>
      ${explanation ? `<p>${escapeHtml(explanation.summary)}</p>` : ''}
      <h3>Formula</h3>
      <p><strong>${escapeHtml(meta.formula.text)}</strong></p>
      ${
        meta.formula.variables && Object.keys(meta.formula.variables).length > 0
          ? `<ul>${Object.entries(meta.formula.variables)
              .map(([v, d]) => `<li><code>${escapeHtml(v)}</code> — ${escapeHtml(d)}</li>`)
              .join('')}</ul>`
          : ''
      }
      ${
        explanation?.assumptions?.length
          ? `<h3>Assumptions</h3><ul>${explanation.assumptions.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>`
          : ''
      }
      ${
        explanation?.limitations?.length
          ? `<h3>Limitations</h3><ul>${explanation.limitations.map(l => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`
          : ''
      }
    </section>`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: meta.name,
    description: meta.seo.description,
    applicationCategory: meta.category,
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }).replace(/</g, '\\u003c');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="calculator-id" content="${escapeHtml(meta.id)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <script type="application/ld+json">${jsonLd}</script>
</head>
<body>
    <header class="header">
        <h1>${name}</h1>
        <p class="tagline">${escapeHtml(explanation?.summary ?? '')}</p>
    </header>

    <main class="calculator-main" id="calculator-app">
    </main>

    ${staticSections}

    <footer class="footer">
        <p>&copy; <span id="year"></span> CalcVerse Pro</p>
    </footer>

    <script type="module" src="/src/main-calculator.ts"></script>
</body>
</html>
`;

  return { file: route, html, entryName: meta.id };
}

/** Temporary compatibility redirect from a legacy URL to its new route. */
export function renderLegacyRedirect(metaId: string, legacyFile: string): GeneratedPage {
  const target = calculatorRoute(metaId);
  const canonical = absoluteUrl(target);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <link rel="canonical" href="${canonical}" />
    <title>Redirecting…</title>
</head>
<body>
    <p>This page has moved. Continue to <a href="${target}">the calculator</a>.</p>
</body>
</html>
`;
  return {
    file: legacyFile,
    html,
    entryName: `legacy-${legacyFile.replace(/[/.]/g, '-')}`,
    isRedirect: true,
  };
}

/** Sitemap from live-calculator routes only (coming-soon excluded upstream). */
export function renderSitemap(routes: string[]): string {
  const urls = ['/', ...routes];
  const unique = [...new Set(urls)];
  const body = unique
    .map(r => {
      const loc = r === '/' ? `${SITE_ORIGIN}${SITE_BASE_PATH}/` : absoluteUrl(r);
      return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
