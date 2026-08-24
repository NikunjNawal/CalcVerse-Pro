# Phase V3 Report — Landing Page & Product Experience

**Date:** 2026-08-24
**Scope:** V3 only (landing/front-of-house transformation + discovery infrastructure). No V4 domain themes, no V5 workspace restyle, no A6 FormShell, no new calculators, no AI.
**Commits:** NONE — awaiting review per change-management policy.
**Baseline:** `d8f10b7` (clean), PHASE_V2_AUDIT_REPORT verdict READY.

---

## 1. Objective

Transform the generic pre-A3 landing page into a polished, product-quality front-of-house that communicates "a universe of specialized calculators" — using ONLY the V2 design system (tokens/primitives/theme) and registry data, with discovery architecture ready for future AI/fuzzy matching.

## 2. Implementation Summary (by ordered sub-phase)

| Stage | Delivered |
|-------|-----------|
| V3.1 Shell/nav | Semantic `<header>/<nav>/<main>/<footer>`; sticky translucent header w/ brand mark ("=" glyph), anchor nav, theme toggle; skip-to-content link |
| V3.2 Hero | "Every calculation. One universe." eyebrow/title/sub; graph-paper dot-grid backdrop + soft radial accent glow (CSS-only); dual CTA (Browse / Explore by domain) |
| V3.3 Ask/search | Generic `SearchBox` combobox primitive (ARIA combobox/listbox, ↑↓/Enter/Escape, clear button, empty-state guidance) + `searchEntries()` local matcher over registry metadata (scoring: exact>name-prefix>name>id>tag>category>description; live ranked above coming-soon). Suggestion chips wired to the input |
| V3.4 Domain rail | All 13 ratified categories as tiles (icon+label+availability count), each carrying `data-domain` hooks for V4 |
| V3.5 Featured bento | Registry-driven bento: wide flagship tile (live), tall secondary tiles, honest "Coming soon" dashed/disabled variants (no links), category labels, hover-lift via elevation tokens |
| V3.6 Coming-soon exploration | Chip marquee (CSS-only, pause-on-hover, reduced-motion → static wrapped row); clearly distinct from available tools |
| V3.7 Benefits + footer | 4 evidence-backed benefits (Accurate/Explained/Private/Specialized); 4-column footer (brand, Popular→generated page, Planned chips, Project/GitHub/suggest-link); dynamic year |
| V3.8 A11y/responsive | Skip link, landmarks, heading order, focus-visible rings, ≥44px targets, breakpoint-specific bento/header/footer layouts, no horizontal overflow patterns |

## 3. Architecture Changes

| Change | Rationale |
|--------|-----------|
| NEW `src/landing/{categories.ts, search.ts, landing.ts}` | Landing composition isolated from bootstrap; testable without DOM shell duplication |
| `main-index.ts` slimmed to theme init + `mountLanding()` | Static SEO/no-JS copy moved INTO index.html (crawlable without JS — §24.2 pattern from calculator pages now applied to landing) |
| `SearchBox` added to ui-components | Generic primitive owns interaction/ARIA only; matcher injected — AI/NL upgrade path needs no page rewrite |
| Icon sprite extended (+13 icons incl. domain glyphs, github, close) | Replaces last emoji; single stroke-language system |
| Legacy landing CSS removed (`.hero/.features/.feature*/.upcoming/.feedback-link/.calculator-card*` old rules + orphaned dark-fix blocks) | Audit-listed debt retired after consumer verification |
| `vite.config.ts` base made conditional (`'/CalcVerse-Pro/'` on build, `'/'` in dev) — carried over from deployment fix | Required for correct production asset paths |

## 4–6. UI / Accessibility / Responsive

- **Identity:** dot-grid substrate, radial accent wash, "=" brandmark, mono numerals — CalcVerse-native, zero borrowed visuals.
- **A11y:** skip-link · combobox ARIA pattern with active-descendant-style highlighting · all interactive elements keyboard-reachable · aria-hidden decorative icons · semantic landmarks/headings (h1 implicit via title? — h2 hierarchy maintained; h1 reserved for logo context) · contrast via AA-checked token pairs.
- **Responsive:** ≤900px nav collapses (anchors remain reachable via scroll), bento →2-col; ≤600px single-column bento, stacked CTAs, centered footer columns, hero padding tuned. No horizontal-overflow patterns introduced.
- **Motion:** marquee (pausable, static under reduced-motion), hover-lift, result/search transitions — all on V2 duration/easing tokens; global reduced-motion kill-switch already active.

## 7. Tests

New `src/__tests__/landing.test.ts` — **16 tests**, behavior-oriented:
static shell (skip-link, landmarks, no-JS noscript, emoji-free) · dynamic mounting (rail/bento/chips/search presence) · registry-sourced bento with live-vs-soon honesty (coming-soon cards have NO links) · rail covers ALL ratified domains with `data-domain` hooks and honest "planned" labeling · search ranking (live above coming-soon; tag matching; empty/no-match states) · SearchBox interaction (type→results, click→navigates via injectable handler, Escape clears) · injected-navigation spy (jsdom cannot navigate).

## 8–10. Gates / Performance / Security

| Gate | Result |
|------|--------|
| TypeScript / ESLint / Stylelint / Prettier | All exit 0 |
| Tests | **251 passed / 0 failed**, 10 files (was 235) |
| Build | PASS (exit 0) |
| Routes | prod `/CalcVerse-Pro/*` all 200 (page, calculators/basic, redirect, sitemap) · dev `/` + `/calculators/basic.html` 200 |
| Security sweep | CLEAN |

Bundle: landing listing chunk unchanged at **10.27 kB (3.83 gz)**; new icons chunk 2.15 kB (0.86 gz) shared; engine/quantities/format grep-proven ABSENT from every landing chunk. CSS +~3 kB raw for the full landing design.

Dependency advisories investigated: all 5 trace to the dev toolchain (esbuild GHSA-67mh dev-server exposure → vite≤6.4/vitest≤3.2 chain). Fix requires vite@8 major upgrade = breaking. **Decision: deferred to a controlled task** — zero impact on deployed site (advisory is dev-server-only).

## 11. Remaining Technical Debt

1. Vite/esbuild/vitest advisory chain — needs planned vite@8 migration (dev-only risk).
2. `FEATURED_IDS` curation list still manual (registry-level, small).
3. Search is substring/scoring — fuzzy + NL matching intentionally future (architecture accepts injected matchers).
4. Recently-used section deferred (needs cross-calculator history plumbing).
5. Visual QA executed via HTTP + jsdom behavioral suites; pixel-level browser QA not performed (no browser tooling available) — noted honestly.

## 12. Intentionally Deferred — V4
Domain accent VALUES/motifs per category (scopes + `data-domain` hooks shipped and tested) · DomainHero treatment · domain-specific imagery.

## 13. Intentionally Deferred — V5
Workspace variants (form/converter/visual) · ResultCard consumption inside keypad flow · steps/history visual polish · recently-used section.

## 14. Intentionally Deferred — A6
FormShell field framework · validation UX wiring into shells.

## 15. Exit Criteria — ALL SATISFIED

Old presentation replaced ✅ · identity established ✅ · responsive ✅ · hero ✅ · ask/search ✅ · domain discovery ✅ · bento ✅ · coming-soon redesigned ✅ · benefits ✅ · footer ✅ · legacy classes removed ✅ · skip-link ✅ · a11y verified (structure/ARIA/keyboard/reduced-motion) ✅ · light/dark verified via suite + tokens ✅ · calculator functionality intact (235 prior assertions + generated-page suite green) ✅ · registry sole source of truth ✅ · no unsafe eval ✅ · landing engine-free ✅ · V3 tests added ✅ · all quality gates PASS ✅ · routes verified ✅ · security PASS ✅ · no V4/V5/A6 leakage ✅

# V3 COMPLETE

**Stopped per instruction: nothing committed or pushed; V4/V5/A6 untouched.**
