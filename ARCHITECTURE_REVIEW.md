# CalcVerse Pro — Architecture Review

**Date:** 2026-08-24
**Scope:** Clarification pass over CALCVERSE_MASTER_ARCHITECTURE.md following approval review. No source code modified. No Phase A implementation started. Nothing committed.
**Documents in force:** CALCVERSE_MASTER_ARCHITECTURE.md (clarified), FOUNDATION_DEBT_CLOSURE.md (baseline).

---

## 1. Approved Architectural Principles

The following principles of the Master Architecture are ratified without modification:

1. Formulas are pure; UI is thin — every calculation is a tested pure function; UI never contains arithmetic.
2. One definition per calculator — calculators are data + colocated compute + tests; registry assembles itself.
3. Precision is a decision — Decimal.js for money/math by policy, with honest classification of approximation (now sharpened per §15.1).
4. Examples are executable specifications — CI replays worked examples against compute.
5. Explanations are first-class output — steps/formula/assumptions/warnings are part of result types.
6. Generalize on the third occurrence.
7. Registry as single source of truth for pages, nav, search, sitemap, SEO, test discovery.
8. MPA over SPA — static multi-page, per-calculator URLs, GitHub Pages compatible.
9. Jurisdiction data is data — versioned rule packs consumed by generic engines.
10. Foundation evolves, does not rewrite.

## 2. Clarifications Made

All eight review points addressed in CALCVERSE_MASTER_ARCHITECTURE.md:

| # | Issue | Resolution location | Substance |
|---|-------|--------------------|-----------|
| 1 | Registry auto-assembly mechanism | §9.1–9.3 | Two execution contexts explicitly separated: **Node script** (`scripts/build-registry.mts` via `prebuild`, tsx loader) validates definitions and emits static artifacts (HTML shells, sitemap.xml, search-index.json, JSON-LD); **Vite compile-time** `import.meta.glob` inside `src/registry.ts` bundles definition modules into app chunks. Shared validator module used by both so dev-server use cannot bypass integrity. Pipeline order fixed: validate → vite build → typecheck. Generated artifacts are build outputs in `dist/`, never committed. |
| 2 | Purity enforcement honesty | §8.2 | Explicit statement: purity cannot be proven by registry validation (which checks structure only). Practical enforcement = four layers: dependency/layer boundaries; ESLint overrides banning DOM globals + UI imports in `compute.ts`; mandatory Node-environment unit tests (DOM access crashes its own tests); PR checklist + ADR-required exceptions. |
| 3 | Numerical precision terminology | §15.1–15.2 (+§7.4) | Four normative classes distinguished: exact decimal arithmetic (exact only within configured precision for +−×; ÷ rounds once at working precision); transcendental functions via Math.* capped at ~15–17 significant digits regardless of Decimal wrapping; numerical approximations with bounded truncation error; iterative methods governed by ε/max-iterations/failure modes. All non-exact user-facing results carry approximation warnings. |
| 4 | Percentage semantics | §12.1 RATIFIED | Complete normative table: % of N; standalone %→p/100; percentage change signed `(B−A)/|A|×100`; increase/decrease application formulas; symmetric percentage difference `|A−B|/((A+B)/2)×100`; markup on cost vs margin on price with the 80→100 → 25%-markup/20%-margin asymmetry made explicit; markup↔margin conversion. Keypad `%` convention ratified: pending additive context uses base-relative semantics (`50+10%=55`, correcting legacy TD-03 behavior) while multiplicative context uses `b/100`. Every row is a directly encodable golden test. |
| 5 | Calculator module requirements | §8.1 | Table states plainly: `definition.ts` REQUIRED, `compute.ts` REQUIRED, `compute.test.ts` REQUIRED, `README.md` OPTIONAL ("3 required files"). |
| 6 | MPA graceful degradation | §24.2 (+A3 roadmap line) | Interactive calculation requires JavaScript — stated plainly. Build-time page generator prerenders title/formula/variables/explanation/assumptions/limitations/metadata into every shell; JS enhances the same DOM with the interactive tool. No claim of calculation-without-JS anywhere. |
| 7 | SEO content rule | §24.1 | Word-count target replaced by six required meaningful elements (purpose, formula, variables, interpretation, assumptions, limitations) each mapped to its definition-field source. Length floor reduced to a ≥80-word anti-stub guardrail, explicitly never to be satisfied with filler. |
| 8 | Search trigger principle | §23 (+Phase F, M2) | Search introduced when discovery/navigation becomes genuinely difficult (named signals: multi-hop category reach, tag ambiguity, mislanding evidence). "~30 live calculators" retained only as heuristic milestone estimate, not technical requirement. |

## 3. Decisions Confirmed

- Architecture approved as direction; foundation reused, not rewritten.
- MPA + generated shells remains the page model; Vite stays the bundler; no framework introduction.
- Registry validation failures fail the build (integrity as build gate).
- Example-replay CI (docs-as-tests) stands.
- Tax rule-pack architecture (data packs + generic engines, golden-case gate before any tax calculator ships).
- Percentage keypad behavior change ratified (legacy `50+10%=50.1` corrected to `55`) — recorded as deliberate spec, not regression.
- WCAG 2.1 AA standing target; analytics event contract defined ahead of vendor choice; backend/API/i18n-content/CAS remain deferred with explicit triggers.

## 4. Decisions Intentionally Deferred

| Decision | Trigger for revisit |
|----------|--------------------|
| Search implementation | Discovery-difficulty signals (§23 principle) |
| Analytics vendor | Real traffic; contract already fixed (§29) |
| i18n content & locale switcher | Demonstrated non-English demand; seams already specified (§18) |
| Backend/API exposure | §35 triggers (sync demand, live tables, embedding API) |
| CAS/symbolic math | Education-domain demand evidence |
| PWA/offline | Phase F evaluation |
| High-precision transcendental series | Any calculator genuinely needing >double precision trig/log |

## 5. Remaining Architectural Questions

Non-blocking; to be resolved during Phase A/B with evidence rather than speculation:

1. **Date-calculator purity pattern:** date/time calculators need "today" — confirm the injected-clock convention (input field defaulting to now at render time, keeping `compute()` pure) during A6 FormShell design.
2. **Coming-soon representation:** whether definition-less seed rows or minimal stub definitions better serve generated placeholder pages — decide when first batch exists.
3. **Keypad `%` UX detail:** whether the display shows the substituted value immediately on `%` press or only after `=` — interaction-design choice within the ratified math; resolve in Basic-calculator polish.
4. **Search index format:** JSON structure fine now; revisit if fuzzy matching needs precomputed ngrams (~M2 timeframe).
5. **Playwright environment:** local CI vs hosted browser service — decide at Phase F, no architectural impact.

## 6. Phase A Readiness Assessment

| Prerequisite | Status |
|--------------|--------|
| Foundation verified (build/typecheck/lint/format/tests green) | ✅ FOUNDATION_DEBT_CLOSURE.md |
| Definition contract v2 fully specified | ✅ §8 incl. module requirements table |
| Registry mechanism unambiguous (contexts, artifacts, pipeline order) | ✅ §9.1–9.3 |
| Purity enforcement concretely enforceable (lint + env-tests + boundaries + review) | ✅ §8.2 |
| Formatting/Quantities/FormShell scopes defined with exit criteria | ✅ Phase A table |
| Explanation block model defined | ✅ §17 |
| Percentage semantics unambiguous and testable | ✅ §12.1 |
| SEO/no-JS/content requirements precise | ✅ §24.1–24.2 |
| Roadmap dependency-ordered with milestones and risks | ✅ §37–41 |

No open item blocks beginning Phase A.

---

## FINAL STATUS

# ARCHITECTURE RATIFIED — READY FOR PHASE A

*Next action upon instruction: implement Phase A deliverable A1 (Definition contract v2 + directory convention + BasicCalculator migration). No calculators beyond the pilot; no commits until reviewed.*
