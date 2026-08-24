# Phase A1 Report — Definition Contract v2 + Directory Convention + BasicCalculator Migration

**Date:** 2026-08-24
**Scope:** A1 only. No Phase B, no new public calculators, no Quantities/FormShell/page-generation/search/tax/CI.
**Commits:** NONE (working tree left for review).

---

## 1. Objective

Move BasicCalculator into the ratified definition-driven architecture (`src/domains/math/basic/` with `definition.ts` / `compute.ts` / `compute.test.ts`) without changing verified user-facing behavior — except the deliberately ratified percentage-semantics correction — and wire it through a clearly isolated compatibility adapter.

---

## 2. Files Created

| File | Purpose |
|------|---------|
| `src/registry/calculator-definition.ts` | Authoritative CalculatorDefinition v2 contract types (CategoryId taxonomy, UiSpec keypad/form union, FieldSpec shape, WorkedExample, CalcOutput, Warning, SeoMeta, DisclaimerLevel) |
| `src/domains/math/basic/compute.ts` | Pure compute layer: `resolvePercentages()` + `calculateBasic()`, delegating evaluation to `@calc-engine` |
| `src/domains/math/basic/definition.ts` | First v2 definition: metadata, keypad UI spec, formula, explanation, 10 worked examples, SEO |
| `src/domains/math/basic/compute.test.ts` | 38 tests, Node-environment purity tripwire |

## 3. Files Modified

| File | Change |
|------|--------|
| `src/CalculatorRegistry.ts` | Inline basic entry replaced by adapter output from the definition; other entries untouched |
| `src/CalculatorBase.ts` | Added `computeExpression()` hook (default adapts engine directly); `evaluateExpression` now flows through it; removed dead legacy `percentage()` method |
| `src/calculators/BasicCalculator.ts` | `%` button now appends the marker (`appendPercent()`); overrides `computeExpression` to route through `definition.compute` |
| `src/__tests__/smoke.test.ts` | Percentage tests updated to ratified semantics (+4 net new UI tests) |
| `.eslintrc.cjs` | Purity override for `compute.ts` (banned DOM/browser globals + UI/theme imports per §8.2) |
| `vitest.config.ts` | `environmentMatchGlobs` pins `compute.test.ts` files to Node environment (§8.2 tripwire) |

## 4. Files Removed

None. (Legacy trio was already removed in debt closure; dead `percentage()` *method* removed as part of this phase.)

---

## 5. Definition Contract

Implemented exactly per CALCVERSE_MASTER_ARCHITECTURE.md §8:

- **Metadata:** `id`, `name`, `category` (typed `CategoryId`), `tags`, `status`
- **UI spec:** discriminated union — `{ kind:'keypad', buttons, keyboardMap }` (form variant typed but unimplemented until FormShell/A6)
- **Pure compute:** referenced function, not inline arithmetic
- **Formula:** text + variables legend + source
- **Explanation:** summary + assumptions + limitations
- **Examples:** 10 worked examples incl. every ratified percentage case
- **SEO:** title/description
- **Disclaimer level:** `'none'`

No competing schema introduced; existing `CalculatorManifest` retained and fed by the adapter.

---

## 6. Pure Compute Layer

`compute.ts` contains zero DOM/UI/storage/theme code. It:
1. Rewrites display-style percentages into engine syntax via `resolvePercentages()` (pure string transform), then
2. Delegates entirely to `@calc-engine calculate()` — **no duplicated tokenizer/parser/evaluator**.

Purity enforcement active (§8.2): ESLint bans browser globals & UI imports in `domains/**/compute.ts`; its test file is forced into Node environment where any DOM access would crash.

---

## 7. Test Migration

- Existing smoke suite preserved in full; the one obsolete assertion (legacy `50→0.5` immediate rewrite) was **replaced** — not weakened — with ratified-behavior tests.
- New pure-layer coverage: golden arithmetic matrix, all §12.1 percentage patterns, whitespace/negative/decimal/multi-percent/malformed edge cases, output-structure checks (steps order, final-answer flag, error propagation).
- Suite totals: **97 tests, all passing** (was 55 pre-A1).

---

## 8. Registry Compatibility

`src/registry/compat.ts` — explicitly marked TEMPORARY/A2-REMOVAL:
- Maps definition → `CalculatorConfig` (buttons/keyboardMap/name/category/description only)
- **Never touches compute** — throws on non-keypad definitions
- Consumed solely by `CalculatorRegistry` for the basic entry

---

## 9. Percentage Semantics

Ratified §12.1 behavior fully implemented and tested:

| Expression | Result |
|-----------|--------|
| `50%` | 0.5 |
| `50 + 10%` | **55** (legacy 50.1 retired) |
| `250 + 20%` | 300 |
| `50 − 10%` | 45 |
| `250 − 20%` | 200 |
| `200 × 10%` | 20 |
| `10% × 200` | 20 |
| `200 ÷ 10%` | 2000 |
| `80 + 25%` | 100 |
| `10.5 + 20%` | 12.6 |
| `100 − 25%` | 75 |
| `-50 + 10%` | −45 (absolute base) |
| `-50 − 10%` | −55 (absolute base) |
| `50 + 10% - 20%` | 54 (chains against preceding operand expression — documented in definition limitations) |

---

## 10. Architecture Dependency Check

Execution path verified end-to-end:

```
UI click/key → BasicCalculator.processInput → '=' → CalculatorBase.evaluateExpression
  → this.computeExpression(expr)  [overridden]
  → basicDefinition.compute       [= calculateBasic]
  → resolvePercentages            [pure rewrite]
  → @calc-engine tokenize/parse/evaluate/steps
```

- Calculation imports UI: **none** (grep-audited)
- Percentage logic in UI layer: **none** (legacy `percentage()` deleted; single implementation in compute.ts)
- Unsafe eval/Function: **zero occurrences** repo-wide
- Future-phase systems implemented: **none**

---

## 11–15. Verification Results

| Gate | Command | Result |
|------|---------|--------|
| Build | `npm run build` | PASS (220 ms, clean) |
| TypeScript | `npm run typecheck` | PASS (exit 0) |
| ESLint | `npm run lint` | PASS (0 errors, 0 warnings) |
| Formatting | `npx prettier --check …` | PASS |
| Tests | `npm test` | **PASS — 97/97** (3 files) |
| Targeted | `npx vitest run src/domains/math/basic/compute.test.ts` | PASS — 38/38 |
| Runtime | Dev server HTTP + jsdom integration | index 200, calc page 200, vite log clean, UI produces `50+10% = 55` |

---

## 16. Runtime Smoke Test

- Landing + calculator pages load (HTTP 200), no broken imports (all module chain 200)
- Arithmetic, keyboard, history, steps, theme: covered green by the jsdom integration suite against the real component
- Percentage via actual button clicks: `50%=` → 0.5; `50+10%=` → **55** ✓
- No console/runtime errors observed

---

## 17. Remaining Technical Debt

1. **Bundle regression (A2/A3 scope):** landing-page registry chunk grew 4.17 kB → 45.79 kB because the registry now statically imports definition → compute → calc-engine. Fix belongs to A2 (lazy definition loading) / A3 (page generation splits chunks per calculator).
2. `CalculatorBase.computeExpression` default hook still routes legacy-style to the raw engine — intentional for not-yet-migrated calculators; disappears as definitions migrate.
3. Multi-percent chaining convention (preceding operand expression vs running result) is implemented + documented but should get a product-level sanity check when real users weigh in.
4. Registry helper functions remain under-tested (A2 rewrites this area anyway).
5. Pre-existing working-tree modifications (README/LICENSE/robots/etc.) still await the user's commit decision.

---

## 18. A1 Exit Criteria

| Criterion | Status |
|-----------|--------|
| BasicCalculator has a pure compute layer | ✅ |
| Definition exists following v2 contract | ✅ |
| Tests exist beside the calculator (Node-env) | ✅ 38 tests |
| UI contains no arithmetic belonging in compute | ✅ audited |
| No calculation code imports UI | ✅ ESLint-enforced + grep-audited |
| No unsafe eval/Function returned | ✅ repo-wide scan clean |
| Existing functionality intact | ✅ full prior suite green, extended |
| No future-phase systems implemented | ✅ |
| Ratified percentage semantics live (`50+10%=55`) | ✅ unit + UI levels |

## A1 COMPLETE WITH MINOR DEBT

*(Debt items are bounded, documented above, and belong to A2/A3 scope or later review — none affect correctness, safety, or the ratified architecture.)*

**Stopping here per instruction: no A2, no further phases, nothing committed.**
