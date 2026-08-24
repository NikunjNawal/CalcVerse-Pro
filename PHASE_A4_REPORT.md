# Phase A4 Report — Centralized Formatting Layer

**Date:** 2026-08-24
**Scope:** A4 only (shared formatting package + shell display migration). No Quantities engine, unit conversion, FormShell, search, tax, i18n, CI, or new calculators.
**Commits:** NONE — working tree left for review.
**Baseline:** PHASE_A3_REPORT.md (142/142 tests).

---

## 1. Objective

Establish a framework-independent, presentation-only formatting package (`packages/format`) providing number, scientific, percentage, and currency display with a locale seam for future i18n — without moving any calculation semantics — and demonstrate it by migrating the calculator shell's result rendering.

## 2. Existing Formatting Audit (pre-A4)

| Location | Logic | Disposition |
|----------|-------|-------------|
| `packages/calc-engine/src/evaluator.ts → formatDecimal()` | Internal canonical result stringification (`toFixed(10)` + trim) | RETAINED — engine-internal canonical form feeding `CalcOutput.value`; not presentation |
| Display/History/Steps components | Rendered strings verbatim | Unchanged; they now receive shell-formatted values |
| Everything else | None | — |

No true duplicates existed; the audit confirmed presentation had no formatting layer at all.

## 3. New Formatting Architecture

```
packages/format/
├── src/index.ts      pure formatters (Decimal.js based)
└── test/format.test.ts   44 tests (Node env)

Wired as alias `@format` in vite.config.ts / tsconfig.json / vitest.config.ts.
Dependency direction: UI shells → @format; @format imports nothing internal
(no UI, theme, calc-engine); compute layer does NOT import @format.
```

## 4. Formatter API

| Function | Contract |
|----------|----------|
| `formatNumber(value, opts?)` | Ordinary positional notation. Opts: `locale`, `decimals`, `significantFigures`, `grouping`(default true), `trimTrailingZeros`(default true unless decimals set), `indianGrouping`. Rejects conflicting precision opts. Never forces scientific notation. |
| `formatScientific(value, opts?)` | Opt-in exponential: `0.00000123 → "1.23 × 10⁻⁶"` (Unicode superscripts default; ascii mode available). Zero renders plain `"0"`. Explicit `decimals` kept verbatim; default trims mantissa zeros. |
| `formatPercentage(v, opts?)` | DISPLAY ONLY — v is already in percent units (`12.5 → "12.5%"`). Performs **no ×100**; converting ratios stays calculation logic (ratified §12.1 untouched). |
| `formatCurrency(v, {currency, locale?, decimals?})` | ISO-code driven via `Intl.NumberFormat` (USD/EUR/GBP/INR/JPY…). Single Decimal→Number conversion at the Intl edge only. Magnitudes ≥1e15 fall back to digit-preserving ISO-code text (`USD 1,234…`) since Intl would silently round through float. |
| `formatUnitValue(v, symbol, opts?)` | A5 preparation primitive: value + symbol with thin-space joining (`9.81 m/s²`). No unit database, no conversion. |
| `toDecimal(v)` | Normalizes `Decimal \| string \| number` inputs; strings parsed exactly, never through binary float. |

## 5. Number Formatting — VERIFIED

0 · integers · negatives · decimals · trailing-zero preservation vs trimming · grouping on/off · negative-zero normalization · 36-digit integers exact · positional small decimals · decimal-based rounding (`2.675→2.68` where float gives 2.67) · significant figures · locale separators (de-DE, en-IN Indian 2-then-3 grouping) · conflict rejection.

## 6. Scientific Formatting — VERIFIED

Positive/negative exponents · Unicode superscript + ascii modes · zero passthrough · negative mantissas · default-trim vs explicit-decimals behavior.

## 7. Percentage Formatting — VERIFIED

`0% / 10% / 100% / 12.5% / -3.75%` · optional space variant · explicit non-multiplication test locks the separation from ratified calculation semantics.

## 8. Currency Formatting — VERIFIED

INR(₹) USD($) EUR(€, de-DE placement) GBP(£) JPY(zero-decimal convention) · locale-sensitive placement · decimals override · >1e15 digit-preserving ISO fallback tested with a 24-digit amount.

## 9. Unit Formatting Preparation — IMPLEMENTED (interface only)

`formatUnitValue` + `FormatUnitOptions` are the only unit-adjacent pieces delivered. No conversion, no dimensions, no unit database — A5 builds directly atop this primitive per plan.

## 10. Precision Handling — VERIFIED

- String inputs treated as authoritative decimal text; scale preserved byte-exact (`'2.500'` keeps its zeros when trimming disabled).
- Rounding exclusively via Decimal.js operations (`toFixed`, `toSignificantDigits`); `Number()` never applied to Decimals except once at the Intl currency boundary, guarded by the ≥1e15 fallback.
- Classic-float traps covered by tests: `0.1+0.2 → "0.3"` round-trip; `1080.42` currency without drift; 36-digit integer round-trip via positional `toFixed(0)` (not `toString()`, which goes exponential >e20 — that pitfall is now test-documented).
- One implementation bug found & fixed by these tests: initial design re-rendered strings through `Decimal.toFixed()`, silently normalizing meaningful trailing zeros.

## 11. BasicCalculator Migration — DONE

Single migration point: `CalculatorBase.evaluateExpression` now sets the displayed result via `formatNumber(result.value, { grouping: false })` (calculator display convention: plain positional). Visible behavior unchanged for all existing cases (engine canonical output already matched formatter output under these options); ratified semantics untouched; compute layers still format-free. History entries continue recording the computed value.

## 12–16. Tests / Build / TypeScript / ESLint / Prettier

| Gate | Result |
|------|--------|
| Tests | **186 passed / 0 failed / 0 skipped**, 7 files (was 142; +44 formatting tests) |
| Build | PASS (exit 0) |
| TypeScript | PASS (exit 0) |
| ESLint | PASS (exit 0; new purity override for `packages/format/**`: browser globals banned, `@ui/@theme/@calc-engine` imports banned) |
| Prettier | PASS |

## 17. Runtime Verification

Generated-page behavioral suite (real dist artifact, real mounting chain): **50 + 10% = 55 ✅** plus arithmetic, keyboard, history, steps, theme, zero console errors — all green post-migration. Production preview: landing 200, `/calculators/basic.html` 200 with correct calculator-id meta.

## 18. Bundle Impact

| Chunk | A3 | A4 | Δ |
|-------|----|----|---|
| Landing listing JS | 10.27 kB | 10.27 kB | unchanged — landing does not import `@format` |
| mount/shell chunk | 9.86 kB | 11.24 kB | +1.38 kB (formatter absorbed here, shared by all keypad calculators) |
| definition (engine) chunk | 38.90 kB | 38.91 kB | unchanged |

Landing remains engine-free AND formatter-free; the lightweight format module rides only with calculator pages that actually render results.

## 19. Security Scan

Repo-wide `Function(`/`eval(`/`new Function` sweep across src/packages/scripts/HTML: **CLEAN**.

## 20. Architecture Audit

1. Formatting package exists, framework-independent ✅
2. No UI/calculator/theme/engine imports in format layer ✅ (ESLint-enforced + dependency direction intact)
3. Compute layer does not depend on formatting ✅ (purity lint still green)
4. Presentation-only: percentage formatter provably does not multiply ✅ (dedicated test)
5. No DOM/browser globals ✅
6. No unsafe evaluation ✅
7. All prior behavior/tests intact ✅ 186/186
8. No future-phase systems implemented ✅ (unit piece is a formatting primitive only)

## 21. Remaining Technical Debt

1. Locale separator table is a hand-mapped subset (en-US/en-IN/de-DE/fr-FR); migrating to `Intl.NumberFormat`-resolved separators is the natural upgrade when real i18n demand lands (§18 of architecture).
2. Currency ≥1e15 fallback uses ISO-code style rather than localized symbols — deliberate digit-safety tradeoff, documented in code and tests.
3. Engine's internal `formatDecimal` remains separate by design (canonical step text); a future consolidation could route it through `@format` if step presentation ever needs locale/grouping — intentionally not done now to avoid touching verified engine output.
4. `@types/jsdom` added during A3's behavioral test hardening (recorded here for dependency-review completeness).
5. Pre-existing working-tree modifications still await commit decision.

## 22. A4 Exit Criteria

| Criterion | Status |
|-----------|--------|
| Shared, dependency-free formatting package with composable API | ✅ |
| Number/scientific/percentage/currency coverage incl. required matrices | ✅ 44 dedicated tests |
| Locale seam present without full i18n | ✅ |
| Unit-formatting primitives ready for A5 without implementing A5 | ✅ |
| Precision model respected (no float round-trips; string-scale preserved) | ✅ |
| Real-calculator demonstration with unchanged visible behavior | ✅ |
| Ratified percentage semantics untouched (`50+10%=55` re-verified) | ✅ |
| Landing bundle unaffected; security clean; all prior tests green | ✅ 186/186 |

## A4 COMPLETE WITH MINOR DEBT

*(Debt is limited to documented upgrade paths — Intl separator resolution, large-currency symbol styling, optional engine-cannonicalizer consolidation — none affecting current correctness or presentation.)*

**Stopping per instruction: no A5 work started, nothing committed.**
