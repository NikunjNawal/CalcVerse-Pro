# Phase A3 Report — Build-Time Page Generation

**Date:** 2026-08-24
**Scope:** A3 only (page/sitemap generation, route convention, whole-tree validation). No FormShell, Quantities, search, tax, analytics, CI, or new calculators.
**Commits:** NONE — working tree left for review.
**Baseline:** PHASE_A2_REPORT.md (120/120 tests, auto-assembled registry, interim route map flagged as A3 debt).

---

## 1. Objective — IMPLEMENTED & VERIFIED

Eliminate hand-maintained calculator pages/routes/sitemaps. Pages, redirects, and the sitemap now derive from validated calculator metadata/definitions via a Node prebuild step, with Vite consuming a generated manifest for per-calculator code-split entries.

## 2. Previous Page Architecture

- Hand-authored `basic-calculator.html` + bespoke `main-basic.ts` bootstrap; every future calculator would need its own copy of both.
- `vite.config.ts` listed rollup inputs manually.
- `sitemap.xml` maintained by hand at repo root (and — pre-A3 undiscovered — was never copied into `dist/`, so dist deployments would have lost robots/sitemap entirely).
- Route table lived in `src/registry/seeds.ts` (`interimRoutes`) — explicitly flagged A2 debt.

## 3. New Page Architecture — IMPLEMENTED

```
src/domains/**/metadata.ts ──fs-walk──▶ Node prebuild (validate whole tree)
src/domains/**/definition.ts ┘            ├─ .generated/site.json   (Vite inputs manifest)
                                          ├─ calculators/<id>.html  (route-mirrored pages)
                                          ├─ <legacy>.html          (temporary redirects)
                                          └─ public/sitemap.xml     (regenerated)
        ▼
vite build (inputs from manifest) → dist mirrors routes exactly:
dist/index.html · dist/calculators/basic.html · dist/basic-calculator.html (redirect)
dist/robots.txt · dist/sitemap.xml · dist/assets/*
        ▼
Runtime: generic src/main-calculator.ts bootstrap reads <meta name="calculator-id">,
lazily loads definition + domain mount module, mounts the calculator.
```

## 4. Build-Time Generation Mechanism — IMPLEMENTED & VERIFIED

- **Discovery:** pure filesystem walk (`scripts/lib/generator.ts:discoverMetadataFiles`) over `src/domains/**` collecting `metadata.ts`/`definition.ts`. No `import.meta.glob` in Node (impossible, per ARCHITECTURE_REVIEW) — glob remains Vite-side only.
- **Import:** modules loaded through the tsx loader inside the script.
- **Validation:** shared `src/registry/validator.ts` (reused, not duplicated) validates metadata everywhere + full definitions for every `live` calculator.
- **Generation:** pages rendered from metadata into `calculators/<id>.html` at project root (gitignored), so Vite's preserved input paths make served URLs match routes byte-for-byte.
- **Manifest:** `.generated/site.json` feeds `vite.config.ts → generatedInputs()` which expands rollup inputs dynamically.
- **Wiring:** npm `prebuild` runs the script automatically before `vite build`; `dev` = prebuild + vite.
- Verified end-to-end with a clean-slate build (`rm -rf .generated calculators dist && npm run build`).

## 5. Node/Vite Boundary — IMPLEMENTED & DOCUMENTED

| Phase | Responsibilities |
|-------|------------------|
| **Node prebuild** | fs discovery · tsx imports · whole-tree validation · page HTML rendering · redirect rendering · sitemap rendering · manifest emission |
| **Vite** | module transformation · in-app `import.meta.glob` (registry/mounts) · bundling · per-page code splitting · publicDir copy (robots.txt) |
| **Runtime** | theme init · registry lazy `loadDefinition(id)` · mount-module resolution · calculator rendering/computation · all user interaction |

No boundary violations: the generator library never uses Vite APIs; app code never walks the filesystem.

## 6. Route Generation — IMPLEMENTED & VERIFIED

Convention: `/calculators/<id>.html`, derived solely from the definition id. `interimRoutes` deleted from seeds.ts; `routeFor()` now constructs routes arithmetically. Coming-soon entries carry empty paths and are never published.

Legacy compatibility (TEMPORARY, documented): `/basic-calculator.html` is emitted as a meta-refresh redirect page to `/calculators/basic.html` with canonical pointing at the new URL. Driven by the `LEGACY_ALIASES` map in the prebuild script; removed once external links migrate. No permanent manual route table exists.

## 7. Page Template — IMPLEMENTED & VERIFIED

Single generic template renders every live calculator: identity (`h1`, calculator-id meta), SEO head block (§8), no-JS static content section (summary/formula/variables/assumptions/limitations — §24.2), `#calculator-app` mount point, footer. BasicCalculator keeps its keypad UI unchanged (mount.ts wires it); no FormShell.

New convention: each calculator may provide `domains/<domain>/<calc>/mount.ts`; the bootstrap discovers mounts via Vite glob and calls the matching one — no central component registry to edit.

## 8. SEO Metadata Generation — IMPLEMENTED & VERIFIED

Per page, sourced strictly from metadata (verified in dist output): `<title>` from seo.title · meta description · canonical URL (`https://nikunjnawal.github.io/CalcVerse-Pro/calculators/basic.html`) · OG title/description/url/type · JSON-LD `WebApplication` (name/description/category/free offer). No filler content generated; explanatory prose comes only from the definition's own explanation fields. Schema needed no extension for this phase.

## 9. Sitemap Generation — IMPLEMENTED & VERIFIED

`public/sitemap.xml` regenerated every prebuild from live routes (+ landing). Root hand-written sitemap.xml DELETED. Validated: well-formed XML, landing + `/calculators/basic.html` present, zero duplicates, zero coming-soon leakage (programmatic check), robots behavior unchanged (moved to `public/robots.txt` — fixing a latent gap where root robots.txt never reached dist).

## 10. Whole-Tree Validation — IMPLEMENTED & VERIFIED

A2's deferred debt closed: for every `live` metadata entry the prebuild requires a sibling `definition.ts`, imports it, and runs full `validateDefinition`. Failure modes tested: missing definition module, invalid fields, duplicate ids. All validation errors print path → field → reason and exit non-zero. The A2-era "metadata-only" startup validation remains as a second gate.

## 11. Legacy Pages Removed — DONE & VERIFIED

Deleted after generated replacement was built AND behaviorally verified: `basic-calculator.html`, `main-basic.ts`. Also removed: root `sitemap.xml` (now generated), `interimRoutes`, stale-comment sweep clean (grep: `interimRoutes|PAGES_DIR|.generated/pages` → none in source).

## 12. Tests

**142 passed / 0 failed / 0 skipped** across 6 files (was 120 at A2 close).
New A3 coverage (`scripts/generator.test.ts`, 14 tests): tree discovery · complete-live-definition acceptance · missing-definition rejection for live status · invalid-field rejection · duplicate-id rejection · route convention · identity/SEO/canonical/OG/JSON-LD embedding · no-JS prerender content · bootstrap reference · HTML escaping of hostile metadata · absolute-URL building · legacy redirect rendering · sitemap dedup/exclusion.
Plus `src/__tests__/generated-page.test.ts` (8 tests): behavioral verification executing the real mounting chain against the actual `dist/calculators/basic.html` artifact (see §17).
One A2 test updated for the ratified new invariant (coming-soon ⇒ empty unpublished path); nothing weakened.

## 13–16. Build / TypeScript / ESLint / Formatting

Build PASS (exit 0, 241 ms; clean-slate rebuild verified) · tsc PASS (exit 0; @types/jsdom added for the new behavioral test) · ESLint PASS (exit 0) · Prettier PASS (exit 0).

## 17. Runtime Smoke Test — VERIFIED

Production preview server (vite preview):
- Landing 200 · `/calculators/basic.html` 200 · legacy redirect serves meta-refresh to new route · sitemap.xml served · robots.txt 200
- Generated page carries correct calculator-id; referenced assets resolve 200
- Behavioral suite executes the genuine page wiring (meta id → `loadDefinition` → mount → BasicCalculator) against the dist artifact:
  - **50 + 10% = 55 ✅**
  - arithmetic 6×7=42 ✅ · keyboard input `12−5` → Enter → 7 ✅ (expression asserted mid-typing incl. Unicode minus)
  - history entry recorded ✅ · steps rendered with final answer ✅ · theme toggle + persistence ✅
  - zero console errors captured across the session ✅

## 18. Bundle / Code-Splitting Analysis

| Chunk | Size | Role |
|-------|------|------|
| `index-*.js` (landing listing) | 10.27 kB | metadata/seeds only — engine-free (grep-verified) |
| `main-*.js` (page bootstrap) | 2.63 kB | generic runtime |
| `mount-*.js` | 9.86 kB | shell wiring |
| `definition-*.js` | 38.90 kB | engine + compute — loaded ONLY on calculator pages |

Landing regression from A2 not re-introduced (engine absent from landing chunks, grep-proven). Each calculator page pulls only its own definition chunk — scales linearly per calculator without cross-contamination.

## 19. Security Scan

Repo-wide `Function(`/`eval(`/`new Function` sweep across src/packages/scripts/HTML (excluding `popFunction` false-positive): **CLEAN**, including newly generated artifacts' source templates.

## 20. Architecture Audit

1. Manual page/route/sitemap maintenance eliminated ✅
2. Definition/metadata sole source of truth for pages+SEO+sitemap ✅
3. Calculator #N = add directory (metadata/definition/mount) — zero central edits ✅
4–5. Invalid/duplicate definitions fail the build with path+field+reason ✅ (tested)
6–7. compat.ts + CalculatorRegistry.ts remain deleted; no duplicate metadata ✅
8. BasicCalculator still computes via definition.compute ✅
9. Landing stays engine-free; implementations stay code-split ✅
10. All A1/A2 behavior intact (120 prior tests green) ✅
11. No future-phase systems implemented ✅

## 21. Remaining Technical Debt

1. `LEGACY_ALIASES` map in the prebuild is intentional temporary backward-compat; prune when inbound links migrate.
2. `FEATURED_IDS` set in the registry is a small manual list (display-only curation, not routing metadata); acceptable, revisit if curation grows rules.
3. Dev-server flow requires the prebuild before first run (wired into `npm run dev`; fresh clones running raw `vite` directly see no calculator pages until then).
4. Generated pages are gitignored build outputs; PR previews of NEW pages need a deploy-preview integration (future CI milestone A8).
5. Pre-existing working-tree modifications still await commit decision.

## 22. A3 Exit Criteria

| Criterion | Status |
|-----------|--------|
| Pages derived from validated definitions; scalable to hundreds | ✅ |
| No manual route table; interim map removed | ✅ |
| Whole-tree validation fails builds with actionable errors | ✅ |
| Sitemap generated, valid, exclusive to live calculators | ✅ |
| Legacy URL preserved via documented redirect | ✅ |
| Generic template + per-calculator code splitting | ✅ |
| Ratified behavior intact on generated page (`50+10%=55`) | ✅ |
| All gates green (tsc/lint/fmt/test/build/security) | ✅ 142/142 |
| No future-phase scope creep | ✅ |

## A3 COMPLETE WITH MINOR DEBT

*(Debt items are small, explicitly scoped, and none affect correctness, URLs, SEO, or scalability. Items 3–4 dissolve naturally at the A8 CI milestone.)*

**Stopping per instruction: no A4+ work, nothing committed.**
