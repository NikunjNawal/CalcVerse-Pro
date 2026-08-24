// A3 prebuild CLI — Node phase of the page-generation pipeline.
//
//   1. discover metadata/definition modules under src/domains (filesystem)
//   2. validate the whole tree (metadata everywhere; full definitions for live)
//   3. generate calculator pages for LIVE calculators into calculators/ (route-mirrored)
//   4. emit legacy compatibility redirect(s) (temporary, documented)
//   5. emit .generated/site.json consumed by vite.config.ts for rollup inputs
//   6. regenerate public/sitemap.xml from live routes only
//
// Any validation error exits non-zero → build fails. Never silently skips.
//
// Run via tsx: `tsx scripts/build-pages.mts` (wired as npm "prebuild" and in "dev").

import fs from 'node:fs';
import path from 'node:path';
import {
  discoverMetadataFiles,
  importMetadataModule,
  validateTree,
  renderCalculatorPage,
  renderLegacyRedirect,
  renderSitemap,
  calculatorRoute,
} from './lib/generator';

const ROOT = process.cwd();
const CALCULATORS_DIRNAME = 'calculators';
const DOMAINS_DIR = path.join(ROOT, 'src', 'domains');
const OUT_DIR = path.join(ROOT, '.generated');
// Generated page paths MUST mirror their URL routes so Vite preserves them in
// dist exactly as served: <root>/calculators/<id>.html → dist/calculators/<id>.html
const ROUTES_DIR = path.join(ROOT, CALCULATORS_DIRNAME);
const PUBLIC_DIR = path.join(ROOT, 'public');

/** Legacy manually-authored URLs kept alive as redirects (temporary). */
const LEGACY_ALIASES: Record<string, string> = {
  'basic-calculator.html': 'basic',
};

async function main(): Promise<void> {
  // 1–2. Discover + import + whole-tree validation
  const files = discoverMetadataFiles(DOMAINS_DIR);
  if (files.length === 0) {
    console.error('[build-pages] No calculator metadata found under src/domains — aborting.');
    process.exit(1);
  }

  const loaded = [];
  const loadErrors: string[] = [];
  for (const file of files.filter(f => f.path.endsWith('metadata.ts'))) {
    try {
      const meta = await importMetadataModule(file);
      if (!meta) {
        loadErrors.push(`${file.path}: metadata module must default-export its metadata`);
        continue;
      }
      loaded.push({ meta, path: file.path, absoluteDir: path.dirname(file.absolutePath) });
    } catch (err) {
      loadErrors.push(
        `${file.path}: failed to import — ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const { errors } = await validateTree(loaded);
  const allErrors = [
    ...loadErrors.map(m => ({ path: '(import)', field: 'module', message: m })),
    ...errors,
  ];

  if (allErrors.length > 0) {
    console.error(`[build-pages] VALIDATION FAILED — ${allErrors.length} error(s):`);
    for (const e of allErrors) {
      console.error(`  ${e.path} → ${e.field}: ${e.message}`);
    }
    process.exit(1);
  }
  console.log(`[build-pages] Validated ${loaded.length} calculator definition tree(s).`);

  const live = loaded.filter(l => l.meta.status === 'live');

  // 3–4. Generate pages + legacy redirects
  fs.mkdirSync(ROUTES_DIR, { recursive: true });
  const manifestPages: { name: string; file: string }[] = [];

  for (const entry of live) {
    const page = renderCalculatorPage(entry.meta);
    const pageAbs = path.join(ROOT, page.file);
    fs.mkdirSync(path.dirname(pageAbs), { recursive: true });
    fs.writeFileSync(pageAbs, page.html);
    manifestPages.push({
      name: page.entryName,
      file: page.file,
    });
    console.log(`[build-pages] generated /${page.file}`);
  }

  for (const [legacyFile, id] of Object.entries(LEGACY_ALIASES)) {
    if (!live.some(l => l.meta.id === id)) continue;
    const redirect = renderLegacyRedirect(id, legacyFile);
    const redirectAbs = path.join(ROOT, redirect.file);
    fs.writeFileSync(redirectAbs, redirect.html);
    manifestPages.push({
      name: redirect.entryName,
      file: redirect.file,
    });
    console.log(`[build-pages] legacy redirect /${legacyFile} → ${calculatorRoute(id)}`);
  }

  // 5. Manifest for Vite inputs
  const siteManifest = {
    pages: manifestPages,
    sitemapRoutes: live.map(l => calculatorRoute(l.meta.id)),
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'site.json'), JSON.stringify(siteManifest, null, 2));

  // 6. Sitemap (live routes only — coming-soon excluded by construction)
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), renderSitemap(siteManifest.sitemapRoutes));
  console.log('[build-pages] wrote public/sitemap.xml');

  // Remove stale generated pages from previous runs (e.g. deleted calculators).
  const validFiles = new Set(manifestPages.map(p => p.file));
  const walkHtml = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walkHtml(abs);
      else if (entry.name.endsWith('.html')) {
        const rel = path.relative(ROOT, abs).split(path.sep).join('/');
        if (!validFiles.has(rel)) {
          fs.unlinkSync(abs);
          console.log(`[build-pages] removed stale generated page ${rel}`);
        }
      }
    }
  };
  walkHtml(path.join(ROOT, CALCULATORS_DIRNAME));
}

main().catch(err => {
  console.error('[build-pages] FATAL:', err);
  process.exit(1);
});
