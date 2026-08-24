# Phase A2 Report — Validated Auto-Assembled Registry

**Date:** 2026-08-24
**Scope:** A2 only (registry). No page generation, sitemap, FormShell, Quantities, search, tax, CI, or new calculators.
**Commits:** NONE — working tree left for review.
**Baseline:** PHASE_A1_REPORT.md (A1 complete with minor debt, 97/97 tests).

---

## 1. Objective

Replace the manually maintained `CalculatorRegistry` with a validated, definition-driven registry discovered automatically from the domain tree; remove the A1 compatibility adapter; eliminate the landing-page bundle regression by separating registry metadata from calculator implementations.

---

## 2. Current Registry Before A2

- `src/CalculatorRegistry.ts`: hand-maintained array — one entry derived via the temporary adapter + 8 hand-written coming-soon entries carrying fake `CalculatorConfig` shapes (`buttons: []`, `supportsSteps: true`) that pretended implementations existed.
- `src/registry/compat.ts`: temporary definition→config bridge (marked for A2 removal).
- Landing chunk `CalculatorRegistry-*.js` = **45.79 kB** because registry → definition → compute → calc-engine was statically bundled for mere card listing.

## 3. Registry Architecture After A2

```
src/domains/**/metadata.ts    ← eager glob   → validated at startup → DisplayEntries
src/registry/seeds.ts         ← coming-soon display rows (NO ui/compute pretence)
src/registry/validator.ts     ← shared pure validators (Vite + Node compatible)
src/domains/**/definition.ts  ← lazy glob    → full definition + engine, loaded only on demand
src/calculators/keypadConfig.ts ← UI-layer adaptation metadata→CalculatorBase config
```

Deleted: `src/CalculatorRegistry.ts`, `src/registry/compat.ts`.

## 4. Discovery Mechanism

Verified against the actual toolchain before implementing: Vite's `import.meta.glob` executes inside **Vite-compiled modules only** — it cannot run inside a plain Node script. Since A3 owns the Node prebuild/artifact step, A2 uses the architecture-consistent in-Vite mechanism:

- **Metadata (eager):** `import.meta.glob('/src/domains/**/metadata.ts', { eager: true })` — compile-time resolved, inlined into the importing chunk. Metadata files import no engine code, so listing pages never pull calculation implementations.
- **Definitions (lazy):** `import.meta.glob('...definition.ts', { eager: false })` — loaders only; full definitions (+ engine) load on demand via `loadDefinition(id)`.
- **Validation timing:** module-initialization of the registry throws a descriptive multi-error report if any metadata is invalid → breaks dev server, vitest, and any page importing the registry. The Node-side prebuild validator for whole-tree *definition* validation arrives with A3 and reuses this exact validator module (already Node-compatible).
- Adding calculator #N: create its directory with `metadata.ts` (+ `definition.ts` when implemented). Zero registry edits.

## 5. Validation Rules

Enforced per definition/metadata (each failure reports `{ path, field, message }`):

| Rule |
|------|
| id required, non-empty, kebab-case |
| name required, non-empty |
| category must be one of the 13 ratified taxonomy ids |
| tags: non-empty array of non-empty strings |
| status ∈ {live, coming-soon} |
| ui present; discriminated union valid: keypad ⇒ non-empty buttons rows of `{children:string}` + keyboardMap object; form ⇒ inputs array of `{id,label,type:number\|text\|select}` |
| formula.text required, non-empty |
| examples: non-empty array of `{name, inputs, expectedOutputs}` |
| seo.title / seo.description required, non-empty |
| disclaimerLevel ∈ {none, health, financial, tax} when supplied |
| compute is a function (full definitions) |
| duplicate ids across tree rejected, citing both source paths |

Invalid definitions **fail loudly** — never silently skipped.

## 6. Registry API

| Function | Behavior |
|----------|----------|
| `getAllCalculators()` | Live entries (from metadata) then coming-soon seeds; each `{id,name,description,category,tags,status,path,featured?}` |
| `getFeaturedCalculators()` | Filtered view |
| `getComingSoonCalculators()` | Seeds only — guaranteed to have no implementation behind them |
| `getMetadata(id)` | Sync display metadata incl. UI spec (no engine cost) |
| `loadDefinition(id)` | Async lazy load of full definition + compute; throws for unknown ids |

Consumers migrated: `main-index.ts` (listing), `BasicCalculator.ts` (sync metadata → keypadConfig; compute override unchanged via direct definition import on its own page).

## 7. Source-of-Truth Verification

All BasicCalculator metadata now lives ONLY in `domains/math/basic/metadata.ts`. The test `sources listing metadata from the definition side` asserts the registry serves the raw metadata module's exact content (spread + path annotation; `meta.tags` is the same array reference). No second manual copy exists anywhere.

## 8. Compatibility Adapter

✅ `src/registry/compat.ts` DELETED along with all imports of it. Its conversion logic moved, re-scoped, and re-homed to `src/calculators/keypadConfig.ts` (UI-layer adaptation of metadata→CalculatorBase config), explicitly marked for retirement at FormShell (A6).

## 9. Bundle Analysis

| Chunk | Before A2 | After A2 | Change |
|-------|-----------|----------|--------|
| Landing registry/listing JS | **45.79 kB** (17.31 gzip) | **10.15 kB** (3.70 gzip) | −78% |
| Landing total JS | ~50 kB | ~14.4 kB | ~−70% |
| Calculator page chunk | 47.62 kB | 48.95 kB | +1.3 kB (registry glue) |

Grep proof: engine signature strings (`ROUND_HALF_UP`, `resolvePercentages`) appear in `basic-calculator-*.js` ONLY — absent from every landing chunk. calc-engine is no longer pulled onto the landing page; BasicCalculator loads correctly with ratified semantics intact.

## 10. Tests

- Total: **120 passed / 0 failed / 0 skipped** (4 files) — all 97 A1-era tests remain green.
- New: `src/registry/registry.test.ts` — 23 tests covering discovery, every validation rule (missing id/name/compute/formula/examples, malformed SEO/UI union, invalid category/status/disclaimer/id-format), duplicate-id detection with path attribution, API behavior (featured/coming-soon/lazy load with ratified `50+10%=55`/unknown-id rejection), and single-source-of-truth verification.

## 11–14. Build / TypeScript / ESLint / Formatting

Build PASS (227 ms) · tsc PASS · ESLint PASS (0 errors/warnings) · Prettier PASS.

## 15. Runtime Smoke Test

Landing 200 · calculator page 200 · vite log clean · percentage semantics verified through UI-level integration tests · history/steps/theme green in suite.

## 16. Security Scan

Repo-wide `Function(` / `eval(` / `new Function` sweep excluding known false-positive `popFunction`: **CLEAN**.

## 17. Architecture Audit

1. Manual metadata list eliminated ✅
2. Definition/metadata = single source of truth ✅ (identity-tested)
3. New calculators discoverable without registry edits ✅ (glob)
4–5. Invalid/duplicate definitions fail validation ✅ (23 validator tests)
6. compat.ts removed ✅
7. No duplicate calculator metadata ✅
8. BasicCalculator still uses definition.compute ✅
9. Landing does not load calc-engine ✅ (grep-proven)
10. Existing behavior intact ✅ (97 prior tests green)
11. No future-phase systems implemented ✅ (no page gen/sitemap/search/etc.)

## 18. Remaining Technical Debt

1. Whole-tree *definition* (not just metadata) build-failure validation requires the A3 Node prebuild — validator is ready and shared; only the script invocation is pending.
2. `interimRoutes` map in seeds.ts is explicit interim tech-debt, deleted by A3 page generation.
3. Lazy `loadDefinition` path-matching relies on sibling filename convention (`definition.ts` next to `metadata.ts`) with an id-scan fallback; acceptable until A3 formalizes artifact generation.
4. Coming-soon seeds remain data-only by design but are still manually listed in seeds.ts — they intentionally do NOT auto-generate pages; revisit when first seed graduates.
5. Pre-existing working-tree modifications (README/LICENSE/robots/etc.) still await commit decision.

## 19. A2 Exit Criteria

| Criterion | Status |
|-----------|--------|
| Registry derived from v2 definitions, auto-discovered | ✅ |
| Adding a calculator needs no registry edit | ✅ |
| Invalid/duplicate definitions fail loudly with path+field+reason | ✅ |
| Legacy API surface preserved for all consumers | ✅ |
| compat.ts removed; no dead compatibility infrastructure | ✅ |
| Coming-soon representable without fake implementations | ✅ seeds are display-only |
| Landing bundle regression fixed; engine off landing page | ✅ 45.79→10.15 kB |
| All prior tests green + registry coverage added | ✅ 120/120 |
| Security clean; no future-phase scope creep | ✅ |

## A2 COMPLETE WITH MINOR DEBT

*(Debt items 1–3 are explicitly scoped into A3 by the architecture's own sequencing — the validator and lazy-loading infrastructure built here is exactly what A3 consumes. Nothing blocks starting A3.)*

**Stopping per instruction: no A3 work started, nothing committed.**
