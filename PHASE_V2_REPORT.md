# Phase V2 Report — Core CalcVerse Design System

**Date:** 2026-08-24
**Scope:** V2 only (design-token architecture + core state/component primitives). No V3 landing redesign, no V4 domain theme values, no V5 shell restyle, no A6 FormShell.
**Commits:** NONE — working tree left for review.
**Baseline:** CALCVERSE_VISUAL_ARCHITECTURE.md (V1 ratified) · PHASE_A5_REPORT.md (221/221).

---

## 1. Scope Delivered

| V1 Requirement | Delivered |
|----------------|-----------|
| Three-tier tokens (primitive → semantic → domain-infra) | ✅ `src/styles/tokens.css` |
| Typography / spacing / radius / border / elevation / motion / breakpoints | ✅ token tiers added |
| prefers-reduced-motion global behavior | ✅ global kill-switch |
| Domain accent infrastructure (no per-domain themes yet) | ✅ default scope + documented override contract |
| SVG icon system (Icon.ts + sprite) | ✅ 11 icons, emoji replaced |
| Skeleton / Badge / EmptyState | ✅ factories + CSS + tests |
| ResultCard foundation | ✅ factory (value/unit/formula/warnings anatomy) |
| Raw-hex lint protection | ✅ Stylelint wired (`npm run lint:css`) |
| Theme ownership unchanged (`packages/theme`) | ✅ untouched |
| Imperative-DOM factories preserved | ✅ all new components are factories |
| Vite MPA + code splitting preserved | ✅ verified in build output |

## 2. Token Migration (structural verification performed)

- `src/styles/tokens.css` created as the SINGLE raw-value authority (stylelint-exempt file); `main.css` imports it via `@import url('./tokens.css')` and contains **zero** `:root`/`.dark` definitions.
- Exactly one authoritative `:root` block and one `.dark` block exist across the stylesheet set.
- Programmatic audit confirmed: **all original semantic token names retained** (zero lost/renamed), **all values moved verbatim** in both light and dark modes (spot-diff against pre-split snapshot), **zero unresolved `var()` references** anywhere in main.css or component factories.
- Pre-existing duplicate `.dark` block (identical bytes) discovered during migration and de-duplicated — recorded design debt from earlier phases, now closed.
- New token groups added additively: typography scale (--text-xs…--text-display), motion (--dur-instant/fast/normal/slow/ambient, --ease-out-soft/--ease-spring), elevation (--elevation-1/2/3), radius-full, breakpoint documentation constants, domain-accent defaults (`--domain-accent[-hover/-subtle/-on]`) with documented `data-domain` override contract for V4.
- New utility layer in main.css: tabular numerals on every numeric surface, ResultCard/Skeleton/Badge/EmptyState styles, `.icon` base + size variants, reduced-motion kill-switch.

## 3. Icon System

`packages/ui-components/src/icons.ts`: single-source sprite of 11 hand-authored 24px/1.5px-stroke/currentColor icons (calculator, sparkle, search, sun, moon, arrow-right, book, clock, alert-triangle, info, check). `Icon.ts` factory renders them (decorative by default via aria-hidden; meaningful via label). All UI emoji removed — card icons, feedback line, and the theme toggle now use sun/moon glyphs with text labels. Repo-wide emoji sweep: clean.

## 4. New Components

| Component | Notes |
|-----------|-------|
| `Icon.ts` | inline SVG factory; decorative-by-default a11y posture |
| `icons.ts` | typed sprite (`IconName` union), throws on unknown names |
| `StatePrimitives.ts` | `createSkeleton` (multi-line, reduced-motion aware shimmer), `createBadge` (4 variants, optional icon), `createEmptyState` (icon/title/message/action) |
| `ResultCard.ts` | foundation anatomy: value → unit/context → formula → warnings (`data-warning-code`, always-visible); `role=status` + aria-live |

All are imperative-DOM factories consuming only semantic tokens — consistent with the ratified architecture.

## 5. Style Governance

- Stylelint wired into npm (`lint:css`) after sitting configured-but-unrun since A-phase setup.
- **Raw-hex protection live:** `color-no-hex` enabled globally; ONLY `tokens.css` is exempt (plus modern-notation rules relaxed there), so any future component CSS must consume tokens.
- Legacy-tolerant exceptions scoped strictly to transitional `main.css`: `no-duplicate-selectors`/`no-descending-specificity` disabled there only (landing/button blocks share class names across sections pending V3 rewrite).
- Genuine issues fixed rather than suppressed: modern color-function notation on toggle surfaces, warning-text hex → new `--color-warning-text` token pair (light+dark), expanded single-line declaration blocks, kebab-case keyframe rename (`stepFadeIn`→`step-fade-in`, usage updated), duplicate identical `.btn-primary` blocks deduplicated where byte-identical, media-query range notation, BEM-compatible selector pattern configured globally.
- Final state: `stylelint exit 0` across both stylesheets.

## 6. Bug Fixed Along the Way (found by verification)

**Keydown listener leak** (A1-era debt item): `CalculatorBase.destroy()` removed a freshly-bound handler instead of the registered one, and nothing called it — jsdom integration tests accumulated stale document listeners whose detached instances logged spurious calculation errors. Fix: stable bound reference stored at construction; `destroy()` removes the actual listener; smoke suite now destroys instances between tests. Post-fix run shows error-path console output reduced to exactly one intentional log (the designed division-by-zero test).

## 7–11. Verification Results (exit codes)

| Gate | Command | Result |
|------|---------|--------|
| TypeScript | `npm run typecheck` | PASS (0) |
| ESLint | `npm run lint` | PASS (0) |
| Stylelint | `npm run lint:css` | PASS (0) |
| Prettier | check across src/packages/scripts | PASS |
| Tests | `npm test` | **235 passed / 0 failed**, 9 files |
| Build | `rm -rf dist && npm run build` | PASS (exit 0) |
| Runtime | vite preview | landing 200 · `/calculators/basic.html` 200 |
| Behavioral | generated-page + smoke suites re-run post-fix | 31/31 (incl. ratified `50+10% = 55`) |
| Security | unsafe-eval sweep | CLEAN |

Independent unfiltered `npm test` was run twice after final fixes; both runs concluded `Test Files 9 passed (9) · Tests 235 passed (235)`. The single remaining console log is the intentional division-by-zero negative-path assertion (shell's designed `console.error` in its catch), not a failure.

## 12. Bundle Impact vs V1 Budgets

| Artifact | Before V2 | After V2 | Budget |
|----------|-----------|----------|--------|
| Landing listing JS | 10.27 kB | 10.27 kB | ≤14 kB total landing JS ✓ |
| Landing total JS | ~14.25 kB | ~14.25 kB (+2.15 kB icons chunk shared, loaded by listing) | ✓ within budget |
| Page CSS | 14.30 kB | 17.15 kB (tokens+new primitives; single bundled sheet) | CSS budget n/a — acceptable growth |
| Engine/definition chunk | 38.91 kB | 38.91 kB | unchanged; still absent from landing ✓ |

Landing remains free of calc-engine, quantities, and compute implementations; formatter/icon additions ride only with calculator-page chunks that render results.

## 13. Architecture Audit

1. Token tiers primitive→semantic→domain-infra established; single raw-value authority ✅
2. Raw colors impossible outside tokens.css (Stylelint-enforced) ✅
3. Icon sprite replaces emoji everywhere ✅
4. State primitives (Skeleton/Badge/EmptyState) + ResultCard foundation delivered ✅
5. Reduced-motion global gate active ✅
6. Dark mode intact (single .dark token block; toggle behavior unchanged, tests green) ✅
7. Theme package untouched this phase ✅
8. Factories remain imperative-DOM; zero framework/deps added ✅
9. A1–A5 behavior unchanged: 221 prior assertions +14 new = 235/235 ✅
10. No V3/V4/V5/A6 implementation present (landing classes/domains/workspace untouched beyond token plumbing) ✅

## 14. Remaining Technical Debt

1. Legacy landing classes (`.hero/.features/.upcoming/.feature*`) intentionally retained — consumed until V3 rebuild.
2. Scoped lint relaxations on `main.css` (duplicate selectors/specificity) retire with the V3 rewrite.
3. `--bp-*` documentation tokens are non-functional constants (CSS custom properties cannot drive media queries) — kept as documented contract.
4. Domain accents currently alias global primary; V4 supplies real values via `data-domain` scopes (mechanism already live).
5. Pre-existing working-tree modifications still await commit decision.

## 15. Exit Criteria — ALL GATES GENUINELY GREEN

TypeScript PASS · ESLint PASS · **Stylelint PASS** · Prettier PASS · **Tests 235/235 (independently re-run, unfiltered)** · Build PASS · Runtime 200/200 · Security CLEAN.

# V2 COMPLETE WITH MINOR DEBT

*(Debt = scheduled retirements tied to V3/V4 + the commit-pending working tree. Nothing blocks V3.)*

**Stopping per instruction: V3 not started, nothing committed.**
