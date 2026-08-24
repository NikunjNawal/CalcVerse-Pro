# CalcVerse Pro — Master Architecture

**Document Status:** Architectural blueprint. Describes the CURRENT verified foundation and the TARGET architecture to be built upon it. Nothing in the TARGET sections is implemented unless explicitly stated.
**Baseline:** FOUNDATION_DEBT_CLOSURE.md (2026-08-24) — FOUNDATION READY: build/typecheck/lint/format PASS, 55/55 tests, engine verified, legacy removed.
**Primary Audience:** Future maintainers and contributors of CalcVerse Pro.

---

## 1. Product Vision

> "If someone needs to calculate something, CalcVerse should be one of the first places they think of."

CalcVerse Pro is a universal calculation platform: a single coherent ecosystem of calculators, converters, solvers, and domain calculation systems spanning mathematics, science, health, finance, taxation, business, engineering, computing, education, everyday life, and specialized professions — unified by shared engines, shared UI, shared explanation infrastructure, and consistent correctness standards.

Success is measured not by page count but by:
1. **Trustworthy correctness** (tested formulas, precision discipline)
2. **Comprehension** (users learn *how*, not just *what*)
3. **Discoverability** (find the right calculator in seconds)
4. **Sustainable expansion** (the 500th calculator costs less effort than the 10th)

## 2. Product Scope

**In scope:** any deterministic or rule-based calculation a person regularly needs — from `2 + 2` to jurisdiction-specific income tax, from unit conversion to subnetting.

**Out of scope (permanent):** medical diagnosis, legal advice, financial advice. Calculators in regulated domains produce estimates with mandatory disclaimers distinguishing computation from professional advice.

**Explicitly deferred (not current scope):** symbolic algebra system (CAS), user accounts/cloud sync, backend API, native apps. See §36–37.

### 2.1 Domain Coverage Map (long-term)

| Tier | Domains | Rationale for tiering |
|------|---------|----------------------|
| Core | Arithmetic, percentages, unit conversion, dates/time, everyday | Universal demand; exercises every platform capability |
| Scientific | Geometry, algebra, statistics, physics, chemistry | High volume, high formula density |
| Applied | Health, finance, business | Form-heavy; precision-critical (money) |
| Regulated | Taxation (multi-jurisdiction), payroll | Rule-pack architecture required |
| Professional | Engineering, computing/networking, data science/AI | Niche depth, parameter-heavy |
| Long-tail | Specialized domains (aviation, photography, agriculture…) | Continuous discovery |

## 3. Architectural Principles

1. **Formulas are pure; UI is thin.** Every calculation lives in a pure, framework-free function that accepts typed inputs and returns typed outputs + steps + warnings. UI never contains arithmetic.
2. **One definition per calculator.** A calculator is *data* (a definition object), colocated with its compute function and its tests. The registry assembles itself; nobody edits a central list.
3. **Precision is a decision, not an accident.** Money and math → Decimal.js. Native floats only where documented safe (display-only intermediate graphics). No bare float arithmetic on user-facing results — enforced by convention and review.
4. **Examples are executable specifications.** Every calculator ships worked examples; CI replays them against `compute()`. Docs that lie fail the build.
5. **Explanations are first-class output.** Steps, formula, assumptions, units, warnings are part of the computation result type, not UI afterthoughts.
6. **Generalize on the third occurrence.** Shared capabilities (formatting, units, form fields) get promoted to packages only when three calculators need them — avoiding speculative abstraction.
7. **The registry is the single source of truth** for pages, navigation, search index, sitemap, SEO metadata, and test discovery.
8. **MPA over SPA.** Static multi-page with per-calculator URLs preserves SEO, GitHub Pages compatibility, and zero-JS graceful degradation. No client-side router dependency.
9. **Jurisdiction data is data.** Country/tax-year rules live in versioned rule packs consumed by generic engines — never hardcoded inside calculators.
10. **Foundation evolves, does not rewrite.** New capabilities extend the existing engine/UI/registry contracts; breaking changes require migration notes in this document.

## 4. Current-State Architecture (verified 2026-08-24)

```
CalcVerse-Pro/
├── index.html                      landing page → /src/main-index.ts
├── basic-calculator.html           calculator page → /src/main-basic.ts
├── src/
│   ├── main-index.ts               theme init + registry-driven landing cards
│   ├── main-basic.ts               bootstrap BasicCalculator
│   ├── CalculatorBase.ts           abstract shell (header/footer reuse, display,
│   │                               keypad buttons, keyboard map, history persistence,
│   │                               steps orchestration)
│   ├── CalculatorRegistry.ts       hand-maintained manifest array (9 entries, 8 comingSoon);
│   │                               entries are KEYPAD-shaped (buttons[][], keyboardMap)
│   ├── calculators/BasicCalculator.ts
│   └── styles/main.css             design-token CSS (custom props, .dark, @media 900/600px)
├── packages/
│   ├── calc-engine/src/            tokenizer → Shunting-Yard parser → AST evaluator;
│   │                               Decimal.js (50-digit); step generator; Unicode operator aliases
│   ├── theme/src/                  centralized dark-mode state + localStorage + matchMedia guard
│   └── ui-components/src/          Button, Display, History, Steps (+setStepsVisible), ThemeToggle
│                                   — imperative DOM factory functions
└── (tests)                         36 engine unit tests + 19 jsdom integration tests
Tooling: Vite 5 MPA build · TypeScript strict · Vitest+jsdom+v8 coverage · ESLint/Prettier/Stylelint · .gitignore complete
```

**What the foundation already provides (capabilities):**
- C-01 Safe expression evaluation (no eval) with BODMAS precedence, parentheses, Unicode operators
- C-02 Arbitrary-precision decimal arithmetic
- C-03 Step-by-step derivation from AST
- C-04 Theme system (persistent, deduplicated)
- C-05 Reusable display/history/steps/button components
- C-06 Abstract calculator shell with keyboard support and persisted history
- C-07 Registry concept (currently keypad-centric, manually assembled)
- C-08 Multi-page Vite build + design-token stylesheet
- C-09 Test infrastructure incl. jsdom component integration

**Known foundation limitations blocking scale (drives Target Architecture):**
- L-01 Registry schema is keypad-only — cannot represent BMI/EMI-style form calculators
- L-02 Compute logic and UI orchestration are coupled inside `CalculatorBase.evaluateExpression` flow; no standalone "pure formula" layer for non-expression calculators
- L-03 No number/unit formatting module (currency, grouping, significant figures, unit symbols)
- L-04 No dimension-aware unit system
- L-05 No declarative input/form rendering or validation framework
- L-06 Pages are hand-written HTML; adding calculator #20 means hand-copying shells, meta tags, sitemap entries
- L-07 Steps model is expression-oriented (flat list); no rich blocks (formula card, substitution table, assumption/warning blocks)
- L-08 No SEO automation (meta/JSON-LD/sitemap from registry), no client-side search
- L-09 No localization seam (number formatting hardwired)
- L-10 No jurisdiction/rule-pack mechanism

## 5. Target Architecture (overview)

```
                        ┌────────────────────────────────────────────┐
                        │              REGISTRY (generated)          │
                        │  import.meta.glob over domains/**/*.def.ts │
                        └──────┬───────────┬───────────┬─────────────┘
              generates ↓      ↓           ↓           ↓            ↓
        per-calc HTML    sitemap.xml   nav/search   JSON-LD     test discovery
                        └──────┬────────────────────────────────────────┘
                               ↓ bootstraps
   ┌───────────────────────────────────────────────────────────────────┐
   │ UI LAYER                                                          │
   │  KeypadShell (today's CalculatorBase lineage)                     │
   │  FormShell (declarative fields → validate → compute → render)     │
   │  shared: Display·ResultCard·StepsPanel·HistoryPanel·FieldControls │
   └──────────────┬────────────────────────────────────────────────────┘
                  ↓ calls pure functions only
   ┌───────────────────────────────────────────────────────────────────┐
   │ CALCULATION LAYER (all pure, all tested)                          │
   │  ExpressionEngine (existing calc-engine)                          │
   │  Formula modules: math/ health/ finance/ physics/ chemistry/ …    │
   │  UnitSystem · Formatting · JurisdictionRulePacks (tax)            │
   │  Result envelope: { value(s), steps[], warnings[], meta }         │
   └───────────────────────────────────────────────────────────────────┘
```

Layer rule: **dependencies point downward only.** UI may import calculation; calculation never imports UI. Registry imports definitions; definitions import calculation + units + formatting.

## 6. System Architecture (target)

Six subsystems, each independently testable:

| Subsystem | Responsibility | Package home (planned) |
|-----------|---------------|------------------------|
| Engine | Expression tokenize/parse/eval/steps | `packages/calc-engine` (exists) |
| Quantities | Units, dimensions, formatting, parsing user numbers | `packages/quantities` (new) |
| Definitions | Per-calculator definition + pure compute + examples | `src/domains/<domain>/<calc>/` (new layout) |
| Registry & Build | Auto-assembly, page generation, sitemap, SEO, nav/search index | `scripts/build-registry.mts` + virtual modules (new) |
| UI Kit | Shells + field controls + result rendering | `packages/ui-components` (exists, grows) |
| Platform | Theme, storage, analytics hooks, i18n seam, disclaimers | `packages/theme` (exists) + `src/platform/` (new) |

## 7. Calculation Engine Architecture

**Current (kept):** tokenizer → parser → evaluator → step generator, Decimal.js precision 50, ROUND_HALF_UP, Unicode aliases (`×÷−–—`).

**Planned extensions (in dependency order):**
1. **Variables binding:** `evaluate(expr, { x: Decimal })` — enables equation solvers without string substitution. Parser gains identifier→variable resolution; unknown identifiers become errors unless bound.
2. **Angle-mode context** (deg/rad) passed via evaluation options, not globals.
3. **Extended constants/functions** added as data tables (never code branches): more trig/hyperbolic, nCr/nPr, gcd/lcm, log bases.
4. **Numeric utilities module** alongside engine: root-finding (bisection/Newton), numeric integration (Simpson), finite differences — for solvers/calculus-lite without CAS. These are numerical approximations and iterative methods (§15.1 classes 3–4); results carry `approximate: true` warning metadata, never silently.
5. **Non-goals:** symbolic differentiation/integration, equation simplification (CAS territory — revisit only if Education demand justifies it).

Step generation stays AST-derived; richer presentation handled by §17 block model so engine steps remain machine-readable.

## 8. Calculator Architecture (target)

A calculator = **one directory**, self-contained:

```
src/domains/finance/compound-interest/
├── definition.ts      // CalculatorDefinition (metadata, inputs, outputs, seo…)
├── compute.ts         // pure calculateCompoundInterest(inputs): CalculationOutput
├── compute.test.ts    // unit tests incl. golden values
└── README.md          (optional deep-dive: derivations, sources)
```

**Definition contract (v2):**

```ts
interface CalculatorDefinition {
  id: string;                       // stable, kebab-case, never renamed (URLs depend on it)
  name: string;                     // human title
  category: CategoryId;             // from fixed taxonomy (§33)
  tags: string[];                   // search keywords
  status: 'live' | 'coming-soon';
  ui:
    | { kind: 'form'; inputs: FieldSpec[]; submitLabel?: string }
    | { kind: 'keypad'; buttons: ButtonSpec[][]; keyboardMap: Record<string,string> };
  compute: InputRecord => CalcOutput;      // PURE — no DOM, no Intl side effects
  formula: { text: string; variables?: Record<string,string>; source?: string };
  explanation?: { summary: string; assumptions?: string[]; limitations?: string[] };
  examples: WorkedExample[];        // ≥1 mandatory; replayed by CI (principle 4)
  seo: { title: string; description: string };   // feeds <head> + JSON-LD
  disclaimerLevel?: 'none' | 'health' | 'financial' | 'tax';
}
```

`WorkedExample = { name, inputs, expectedOutputs }` — doubles as documentation and golden test input.

### 8.1 Module requirements

| File | Status | Purpose |
|------|--------|---------|
| `definition.ts` | **REQUIRED** | Metadata, inputs, outputs, SEO, examples |
| `compute.ts` | **REQUIRED** | Pure calculation function |
| `compute.test.ts` | **REQUIRED** | Unit tests incl. golden values; must run in Node environment (see §8.2) |
| `README.md` | OPTIONAL | Deep-dive: derivations, sources |

**Adding calculator #N becomes:** create directory (3 required files) → done. Page, URL, nav entry, search indexing, sitemap line, JSON-LD, and example-replay test registration are all generated.

### 8.2 Purity enforcement — practical mechanism

"Purity" here means the working convention: **deterministic, no side effects, no I/O, no DOM access.** It cannot be mathematically proven by registry validation or any tooling; registry validation checks *structure* (exports exist, examples present), never behavioral purity. Purity is enforced by four reinforcing layers:

1. **Layer/dependency boundaries (structural):** `compute.ts` may import only from `packages/calc-engine`, `packages/quantities`, and sibling pure modules within its own calculator/domain. Importing `packages/ui-components`, any shell, theme, or platform module from a compute file is an architectural violation.
2. **ESLint restrictions (mechanical):**
   - Per-file override for `**/compute.ts`: DOM/browser globals banned (`no-restricted-globals`: `document`, `window`, `localStorage`, `navigator`, `fetch`), and `no-restricted-imports` blocking UI/theme/platform paths per rule 1.
   - ESLint config sets `env.browser: false` for these overrides so bare browser global usage errors.
3. **Environment-based testing (behavioral tripwire):** `compute.test.ts` files MUST run under Vitest's **Node environment** (file-level `// @vitest-environment node` docblock, enforced via lint rule/config glob). In Node there is no DOM/localStorage — if a compute function secretly touches either, its own unit tests crash. The jsdom integration suite remains reserved for shells/components.
4. **Code review + ADRs:** the PR checklist includes a purity item; any exception (e.g., deliberate clock injection for date calculators) requires an ADR documenting the injected-dependency pattern used instead of hidden global access.

No single layer is sufficient alone; together they make accidental impurity loud (lint), crashing (tests), visible (review), and structurally awkward (imports).

## 9. Registry Architecture (target)

Replace the hand-maintained array with build-time assembly. The mechanism uses **two distinct execution contexts over one source of truth** (the definition files) — it is important not to conflate them:

### 9.1 Execution contexts

| Context | Tool | Runs | Capabilities | Limitations |
|---------|------|------|--------------|-------------|
| **Vite compile-time** | `import.meta.glob('/src/domains/**/definition.ts', { eager: true })` inside an application module (`src/registry.ts`) | During `vite build` / dev-server transform, per entry point | Bundles definition modules directly into app chunks; glob is resolved and inlined by Vite's plugin pipeline — **not** available to plain Node scripts | Cannot emit files; cannot validate across artifacts (sitemap, HTML); runs once per build, results are runtime modules |
| **Node script** | `scripts/build-registry.mts`, executed by npm `prebuild` hook via `tsx` | Plain Node, before Vite starts | Filesystem traversal of `src/domains/**`; imports each `definition.ts` through tsx loader; performs full validation; **emits static artifacts**: per-page HTML shells, `sitemap.xml`, `search-index.json`, JSON-LD snippets, generated registry report | Cannot produce the running application's module graph — that remains Vite's job |

### 9.2 Division of responsibility

- **Node script (prebuild):** validation gate + artifact generator. Validation failures exit non-zero → build fails. Artifacts land in `dist/` alongside Vite output (and `public/` inputs where needed). Nothing generated is committed to git except nothing — all artifacts are build outputs.
- **Vite glob (runtime app code):** `src/registry.ts` uses `import.meta.glob` to assemble the live registry object the shells consume. It re-runs a *shared* lightweight schema check (same validator module imported by both contexts) so even direct dev-server use cannot bypass integrity checks.
- **Shared validator:** one module (e.g., `src/registry/validate.ts`) imported by both the Node script and `src/registry.ts` — single source of truth for what makes a definition valid.

### 9.3 Pipeline order

```
npm run build =
  1. scripts/build-registry.mts   (Node: validate definitions, emit HTML shells,
  │                                 sitemap.xml, search-index.json, JSON-LD)
  ├─ fails → abort
  2. vite build                   (Vite: bundles app; import.meta.glob inlines
                                    definitions into chunks; shells from step 1
                                    are used as rollup inputs)
  3. tsc typecheck                (gate)
```

Registry validation failures (duplicate id, missing example, bad category, missing seo) **fail the build** at step 1. This turns registry integrity into a build-time guarantee rather than review-time hope.

Migration path: current `CalculatorRegistry.ts` content moves into `domains/math/basic/definition.ts`; `comingSoon` placeholders become definition-less registry seed rows (data-only file) until implemented.

## 10. Domain Architecture (target)

```
src/domains/
├── math/          percentage/ fractions/ geometry/ algebra/ statistics/ matrices/
├── conversion/    length/ mass/ temperature/ … (thin wrappers over quantities pkg)
├── datetime/      age/ date-diff/ business-days/
├── everyday/      tip/ discount/ bill-split/ fuel/
├── health/        bmi/ bmr/ tdee/ bodyfat/ heart-rate-zones/
├── finance/       compound-interest/ loan-emi/ mortgage/ cagr/ npv-irr/ sip/
├── tax/           engines/ jurisdictions/ income-tax-generic/
├── business/      margin/ breakeven/ depreciation/ roas-cac-ltv/
├── physics/       mechanics/ electricity/ waves/ thermo/
├── chemistry/     moles/ molarity/ gas-laws/ ph/
├── engineering/   electrical/ mechanical/ civil/
├── computing/     base-conversion/ subnetting/ data-size/ bandwidth/
└── datascience/   classification-metrics/ regression-metrics/ sample-size/
```

Rules:
- Domain directories may contain shared domain helpers (`domains/tax/engines/`) but never reach across domains (no `health` importing `finance`). Cross-domain reuse goes through `packages/`.
- Each domain gets an `index.ts` re-exporting its definitions (convenience, not authority — glob assembly is authoritative).
- Domain-specific rules stay domain-local (e.g., BMI category thresholds live in `compute.ts`, not in global config).

## 11. Data Architecture (current + target)

**Current:** localStorage only — theme key, per-calculator history arrays.
**Target additions:**
- History schema versioned `{ v: 2, items: [{ expr, result, ts }] }` with migration-on-read.
- Search index: generated static `search-index.json` (id/name/tags/category) loaded once by the search component.
- Rule packs (tax): static TS modules (tree-shakeable, typed) keyed `jurisdictions/<COUNTRY>/<TAXYEAR>.ts`. Not fetched at runtime in phase 1.
- No PII ever stored. Analytics events carry calculator ids, never inputs/outputs (§28).

## 12. Formula Architecture

Every formula is expressed three ways, kept in sync mechanically:
1. **Code** — `compute.ts`, the executable truth.
2. **Display text** — `formula.text` in the definition (rendered on page).
3. **Examples** — `examples[]` proving 1 satisfies expected outputs.

CI enforces 3 against 1 automatically. Human review keeps 2 honest against 1. Where formulas cite standards (BMR equations, IRR conventions), `formula.source` records the reference — mandatory for regulated domains.

Numerical-method formulas (IRR, sample-size) must document convergence criteria and failure modes inside `explanation.limitations`.

### 12.1 Percentage semantics — RATIFIED (normative for Phase B)

All percentage behavior is fixed here; every implementation and test derives from these definitions. Each rule below is directly translatable into golden tests.

**Standalone operations**

| Operation | Definition | Worked example |
|-----------|-----------|----------------|
| Percentage **of** a number | `p% of N = N × p/100` | 15% of 500 = **75** |
| Percentage as standalone value | `p% → p/100` (keypad `%` with no pending binary operator) | typing `50` then `%` → **0.5** |

**Relative-change family** (from A to B, A ≠ 0):

| Operation | Formula | Worked example |
|-----------|---------|----------------|
| Percentage **change** (signed) | `(B − A) / \|A\| × 100` — direction-aware: increase positive, decrease negative | 40→50 = **+25%**; 50→40 = **−20%** |
| Percentage **increase** (amount to apply) | increasing N by p% → `N × (1 + p/100)` | 250 increased by 20% = **300** |
| Percentage **decrease** (amount to apply) | decreasing N by p% → `N × (1 − p/100)` | 250 decreased by 20% = **200** |
| Percentage **difference** (symmetric comparison) | `\|A − B\| / ((A + B)/2) × 100` — order-independent, no direction implied | 40 vs 50 = **22.2222…%** |

**Commercial family**

| Operation | Formula | Worked example |
|-----------|---------|----------------|
| **Markup** (on cost) | `markup% = (price − cost) / cost × 100`; price from markup: `cost × (1 + m/100)` | cost 80, price 100 → markup **25%** |
| **Margin** (on price) | `margin% = (price − cost) / price × 100`; price from margin: `cost / (1 − g/100)` | cost 80, price 100 → margin **20%** |
| Markup ↔ margin conversion | `g = m/(1+m)` ; `m = g/(1−g)` (fractions) | 25% markup = **20%** margin |

Note the asymmetry is the point: same 80→100 example yields 25% markup but 20% margin. UIs must label which base is used.

**Keypad `%` operator (resolves the open TD-03 decision):** adopt standard calculator convention, replacing legacy behavior:
- After a number only: `N %` → `N/100` (unchanged).
- In a pending binary context `a + b%` / `a − b%`: `b%` means `a × b/100` → `50 + 10%` = **55** (legacy gave 50.1 — corrected).
- Multiplicative context `a × b%` / `a ÷ b%`: `b%` means `b/100` → `200 × 10%` = **20**.
This is a deliberate behavioral change from the legacy calculator, documented here as the ratified spec; Phase B percentage tests encode all cases above.

## 13. Validation Architecture

Three validation layers:

| Layer | Where | Examples |
|-------|-------|----------|
| Field validation | `FieldSpec` constraints, enforced by FormShell before compute | min/max, integer, positive, regex, custom predicate, required-if |
| Semantic validation | inside `compute()` preconditions | BMI height range plausibility warning; EMI rate > 0 |
| Engine validation | existing tokenizer/parser errors | malformed expressions |

Validation outcomes are data, not exceptions, at field level: `{ valid: boolean, message?: string }`. `compute()` returns `warnings: Warning[]` (`{ code, message, severity }`) for soft issues while still producing best-effort output. Hard impossibilities (division by zero) remain thrown errors caught at shell level and rendered as error states — never silent zeros.

Standard warning codes catalog maintained centrally (e.g., `W_NONFINITE`, `W_IMPLAUSIBLE_INPUT`, `W_APPROXIMATE_RESULT`, `W_JURISDICTION_OUTDATED`) so UI can render consistent messaging.

## 14. Unit System (`packages/quantities` — planned)

Dimension-based model, not category-string model:

```ts
// SI-base dimension vectors; derived dims compose
Length = { m: 1 }; Speed = Length/Time; Energy = { kg:1, m:2, s:-2 }
defineUnit({ symbol: 'km', dimension: LENGTH, toBase: 1000 })
convert(value: Decimal, from: Unit, to: Unit): Decimal   // throws on dimension mismatch
```

Features: prefix handling (k/M/G/mi…), temperature offsets (affine transforms), parse-from-string (`"5 ft 6 in"`), display formatting with correct symbols. Conversion calculators become ~15-line definitions over this package. Physics/chemistry formulas accept `(value, unit)` pairs and normalize internally — eliminating an entire class of unit bugs.

## 15. Precision Strategy

### 15.1 Terminology (normative)

These four classes must not be conflated — Decimal.js does **not** make every computation exact or arbitrary-precision:

1. **Exact decimal arithmetic** — `+ − ×` on decimals are exact whenever the result fits the configured precision (50 digits); comparisons are exact. Division and non-integer exponents produce repeating/infinite expansions, so they are computed to working precision and rounded once (e.g., `1/3 → 0.333…3`, correctly rounded at digit 50).
2. **Transcendental functions** (`sin`, `cos`, `tan`, `log`, `ln`, `exp`) — the current engine evaluates these via JavaScript `Math.*` (IEEE-754 double). Accuracy is therefore ~15–17 significant digits, **not** extended by wrapping results in Decimal. Wrapping only prevents further *decimal* error propagation in downstream arithmetic; it cannot recover precision the double never had. If a use case ever demands more, the upgrade path is high-precision series implementations inside the engine — deliberately not built now.
3. **Numerical approximation** — closed-form-free estimates with bounded truncation error: Simpson integration, finite differences, Taylor evaluation. Error is a function of step size; results carry method metadata.
4. **Iterative numerical methods** — converge toward a root/value within tolerance: IRR via bisection/Newton, distribution inverses. Governed by explicit ε, maximum iteration count, and documented failure modes (non-convergence → error, never a silently wrong value).

Any result from classes 2–4 that is user-facing carries `W_APPROXIMATE_RESULT` (or equivalent metadata) so the UI can render "≈" honestly.

### 15.2 Data-class policy

| Data class | Representation | Rationale |
|------------|---------------|-----------|
| Money, percentages of money | Decimal.js (+ − × ÷) | cents-exact for the four arithmetic ops; rounding policy explicit |
| General math/engineering | Decimal.js via engine | consistency; cost negligible at this scale |
| Trig/log/exp | Math.* wrapped in Decimal (~15–17 sig figs); upgrade path to series if ever needed | pragmatic accuracy; honest about the ceiling |
| Statistical distributions | specialized implementations w/ documented tolerance + approximation warning | normal/chi-sq need tail algorithms |
| Iterative methods (IRR etc.) | Decimal accumulator + explicit ε + max-iteration + `W_APPROXIMATE_RESULT` | honesty about approximation |
| Display-only visuals (chart coords) | native float permitted | performance; never user-facing values |

Rounding policy: computations never round early; rounding happens once at render via Formatting with per-output declared precision.

## 16. Error-Handling Strategy

| Class | Mechanism | User sees |
|-------|-----------|-----------|
| Syntax/parse (expression calcs) | thrown `EngineError{code}` | inline "Cannot parse: …" |
| Division-by-zero/domain | thrown with standard codes | friendly message + why |
| Invalid field input | field-level validation result | per-field helper text, focus moved to first invalid (a11y) |
| Implausible-but-computable | `warnings[]` in result | amber note beside result; result still shown |
| Approximation | `W_APPROXIMATE_RESULT` + method metadata | "≈" prefix + method note |
| Unexpected | caught at shell boundary, logged to console (no telemetry yet) | generic retry message |

Rule: **errors explain cause in one sentence** — matching the educational product principle even in failure.

## 17. Explanation / Step System (target)

Extend the flat step list into a typed block stream:

```ts
type ExplanationBlock =
  | { kind:'formula'; text:string }
  | { kind:'substitution'; expr:string }        // values placed into formula
  | { kind:'step'; description:string; value?:string }   // existing engine steps
  | { kind:'note'; text:string }
  | { kind:'warning'; code:string; message:string }
  | { kind:'result'; label:string; value:string; unit?:string }
  | { kind:'assumption'; text:string };
```

Engine continues emitting `step` blocks; formula-driven calculators compose the other kinds in `compute()`. `StepsPanel` renders blocks generically. This preserves today's working behavior (steps auto-open, final-answer highlight) while enabling rich pedagogy ("Your inputs → formula → substitution → intermediate values → result → what it means").

## 18. Internationalization Architecture (seam now, i18n later)

Phase-now seams (cheap to add, expensive to retrofit):
- All user-visible number rendering through `packages/quantities/format.ts` wrapping `Intl.NumberFormat` with explicit locale param defaulting to `'en-US'`.
- All strings currently live in components/definitions; a future extraction pass maps them to keys without logic changes.
- RTL: layouts use logical CSS properties already feasible in token sheet (grid/flex); audit deferred until a RTL locale ships.
Explicitly NOT built now: translation files, locale switcher, translated content. The seam prevents rework; the content waits for demand signals.

## 19. Country / Jurisdiction Architecture (target)

```ts
interface JurisdictionRulePack {
  jurisdictionId: 'IN' | 'US' | 'GB' | … ;
  taxYear: string;                    // e.g. '2025-26'
  effectiveFrom/To?: date bounds;
  currency: string;
  rules: Record<string, RuleTable>;   // e.g. incomeBrackets, standardDeduction, cessRate…
  notes: string[];                    // displayed assumptions/caveats verbatim
}
```

- Generic engines (`income-tax-generic`) consume packs; calculators expose jurisdiction + year as normal select fields sourced from a pack index.
- Packs are pure data + typed accessors; version-controlled per year (history preserved for comparisons — a natural future calculator: "compare FY2024 vs FY2025").
- Every tax result renders: pack identity, `notes`, disclaimerLevel 'tax', and "estimate — verify with authority" banner.
- Accuracy protocol: each pack ships golden cases from official examples/circulars where published; unverifiable values marked `confidence: 'unverified'` and surfaced as warnings.
This same pattern later generalizes to VAT/GST rates, payroll, property tax.

## 20. Tax-Rule Architecture

Subcase of §19 with tax-specific engines:
- Bracket walker (marginal calculation), surcharge/cess composition, deduction ordering rules — implemented once, tested once, consumed by every jurisdiction.
- Regressive/progressive/refundable-credit primitives as composable functions.
- Anti-pattern ban: no `if (country === 'IN')` anywhere outside pack selection.

## 21. UI Architecture (target)

Two shells over one shared kit:

| Shell | For | Reuses |
|-------|-----|--------|
| KeypadShell (evolved CalculatorBase) | basic/scientific/programmer keypads | Display, History, Steps, ThemeToggle, keyboard routing |
| FormShell (new) | everything else (~90% of future calcs) | ResultCard, StepsPanel, HistoryPanel, FieldControls, DisclaimerBanner |

FormShell contract: receives `FieldSpec[]` → renders accessible controls (label+input+helper+error, `aria-describedby`) → validates → calls `compute()` on submit (and optional live mode) → renders ResultCard + StepsPanel + warnings. Zero per-calculator UI code in the common case.

Component style stays imperative-DOM factories (matches foundation; zero framework risk). Web-component migration is possible later behind identical factory signatures — UI consumers never touch internals directly today except through shells, which keeps that door open cheaply.

## 22. Design-System Architecture

Existing token sheet (`--color-*`, spacing, radius, fonts, transitions) extends into named semantic roles: success/warning/danger/info surfaces already exist; add `--font-size-*` scale and elevation tokens. Components consume tokens only — no raw hex outside `:root`/`.dark` blocks (Stylelint-enforceable). Dark mode = token override, verified pattern from foundation.

## 23. Search / Discovery Architecture (target)

**Trigger principle:** client-side search is introduced when calculator discovery/navigation becomes genuinely difficult — not at an arbitrary count. Indicative signals: category browsing requires more than one screen/page-hop to reach plausibly relevant tools; tag overlap makes home-page grouping ambiguous; analytics or feedback shows users landing on wrong calculators. The earlier "~30 live calculators" figure remains a useful **heuristic milestone estimate**, not a technical requirement — if discovery degrades at 20 calculators, search comes early; if taxonomy still serves at 45, it waits.

Tier 1: header search box querying generated `search-index.json` — fuzzy match on name+tags+category, keyboard-navigable results, `/` shortcut. Category landing sections on home generated from taxonomy.
Tier 2: related-calculators cross-links ("People who use EMI also use Amortization") from tag co-occurrence computed at build time.
No server dependency at any tier.

## 24. SEO Architecture (target)

Generated per page from definition: unique `<title>`, `<meta description>`, canonical URL, Open Graph/Twitter tags, JSON-LD `WebApplication` (+ `FAQPage` where explanation includes Q&A), and `<h1>` matching definition name. `sitemap.xml` regenerated from live-status definitions. Existing Google site-verification retained.

### 24.1 Meaningful-content requirement (replaces word-count rule)

Every calculator page must substantively communicate, sourced from definition fields — never filler generated to hit a length target:

| Required element | Source |
|------------------|--------|
| Purpose — what question this answers, for whom | `explanation.summary` |
| Formula | `formula.text` (+ variables legend) |
| Variables — meaning of every symbol/input | `formula.variables`, FieldSpec labels/helpers |
| Interpretation — what the result means, how to read it | `explanation.summary` / result notes |
| Assumptions | `explanation.assumptions` |
| Limitations | `explanation.limitations` |

A modest length floor (≥80 words total prose) remains as a quality guardrail against empty stub pages only. If a calculator's genuine explanation is short, the correct fix is a better-explained calculator, not padded sentences.

### 24.2 No-JavaScript graceful degradation

Interactive calculation **requires JavaScript** — no claim or behavior suggests otherwise. However, because the page generator (§9, Node step) has access to all static definition data at build time, every calculator HTML shell must embed prerendered static content visible without JS:

- title (`<h1>`), formula with variable legend
- purpose/explanation prose, assumptions, limitations
- metadata (category, tags), disclaimers where applicable

The app script then enhances the same DOM: renders the form/keypad into a designated container, computes, displays results/steps/history. Crawlers and no-JS users get the full explanatory content; JS users additionally get the working tool.

## 25. Testing Architecture

| Level | Tool | Scope |
|-------|------|-------|
| Formula unit | Vitest | every `compute.test.ts`; golden values; edge/boundary matrix |
| Example replay | Vitest (generated spec) | CI replays every definition's `examples[]` vs `compute()` — docs-as-tests |
| Engine | existing suite (grows with features) | tokenizer/parser/evaluator/steps |
| Component integration | Vitest + jsdom (existing pattern) | shells: render, interact, persist, a11y attrs |
| Visual/E2E | Playwright (future milestone) | smoke per category + responsive snapshots |
| Property-based | fast-check (selective) | unit conversions round-trip, formatter invariants |
| Coverage gates | v8 | engine ≥90% maintained; compute functions 100% branch target |

Rule: **a formula without tests cannot merge** — enforced socially now, structurally later (example-replay failing = missing examples).

## 26. Security Architecture

- No dynamic code execution (verified clean; keep it that way — lint-bannable via `no-new-func`).
- All content rendered via `textContent`/factory APIs (current pattern) — no `innerHTML` with interpolated user data; existing two `innerHTML` template literals on landing page render registry-controlled data only, flagged for refactor to factories during Phase A.
- Static site: attack surface = supply chain. Lockfile committed; Dependabot-equivalent review cadence; `npm audit` in CI (non-blocking advisory, blocking on critical).
- localStorage: non-sensitive data only (theme, history) — codified.
- Third-party scripts: none today; analytics introduced later must be privacy-preserving, cookieless preferred (§28).

## 27. Performance Architecture

Current budget: total JS ≤ 50KB gzip/page — preserve it. Strategy:
- Per-page entries import only their calculator's chunk (Vite code-splitting already yields this shape).
- Engine + quantities + UI kit as shared chunks; registry data split per-page.
- No framework runtime; fonts preconnect + `display=swap` (already).
- Targets: LCP < 1.5s mid-tier mobile, TTI < 2s, CLS ≈ 0 (reserve display heights — known CLS risk in dynamic steps panel; fix at FormShell build time).
- 500-calculator horizon: page count scales linearly but per-page weight stays constant; build time managed by parallelized generation.

## 28. Accessibility Architecture

Baseline (already partially true): semantic landmarks, labeled controls, `aria-live` results, visible focus, keyboard-complete interaction, `aria-expanded` disclosures.
Systematic additions at FormShell build: field error association (`aria-describedby`/`aria-invalid`), result announcement patterns, focus management on validation failure, skip-links, reduced-motion respect for `stepFadeIn` animation.
WCAG 2.1 AA is the standing target; automated axe checks enter CI at Playwright milestone; manual screen-reader spot-checks each new shell (not each calculator).

## 29. Analytics Architecture (deferred, designed now)

Event model only — no vendor choice yet: `calc_view {id}`, `calc_compute {id, durationMs}` (never inputs/outputs/results), `search {query?, resultCount}`, `theme_toggle`. Privacy-preserving, cookieless vendor preferred (Plausible-class). Decision deferred until traffic exists; the event names above are the contract so instrumentation isn't retrofitted blindly.

## 30. Deployment Architecture

Keep GitHub Pages as primary (zero-cost, already verified domain in robots/sitemap). Build produces fully static `dist/`. Add GitHub Actions: install → lint → typecheck → test → build → deploy on main; PR preview via artifact or Netlify/Vercel draft if desired later. Custom-domain readiness: canonical URLs parameterized by single base-constant in one config file (change once when/if apex domain acquired).

## 31. Versioning Strategy

- Site content: continuous deployment, no user-facing versioning.
- Packages (`calc-engine`, `quantities`, `ui-components`, `theme`): internal SemVer via Changesets-style notes once ≥2 calculators depend on engine behavior nuances; before that, changes guarded purely by test suite.
- Definition contract (`CalculatorDefinition`): versioned field `schemaVersion` from day one — cheap insurance for future migrations like the history-schema precedent.
- Rule packs: immutable per (jurisdiction, year) — corrections ship as new revision with changelog entry in pack `notes`.

## 32. Content Architecture

Per-calculator prose lives IN definitions (`explanation.summary/assumptions/limitations`) — single source, rendered on page, feeding SEO. Deep-dive derivations optionally in colocated README (linked, not duplicated). Glossary (future): shared term definitions referenced by id to avoid drift. Tone standard: plain-language first sentence, technical detail second — serve beginners and advanced users simultaneously.

## 33. Documentation Architecture

| Document | Role |
|----------|------|
| CALCVERSE_MASTER_ARCHITECTURE.md | this document — the constitution |
| AUDIT.md | historical baseline (frozen) |
| FOUNDATION_STATUS.md / FOUNDATION_DEBT_CLOSURE.md | verification evidence chain |
| CONTRIBUTING.md (future milestone) | how to add a calculator — the 4-file recipe |
| ADRs/ (future) | lightweight decision records when a principle-level choice reverses |

## 34. Extensibility Model

Extension points, ranked by frequency of use:
1. **New calculator** = new directory (daily act) — zero core edits.
2. **New domain** = new directory tree + taxonomy entry (occasional).
3. **New unit family** = data rows in quantities package.
4. **New jurisdiction** = new rule pack file.
5. **New field type** = FieldControl + FieldSpec union member (rare).
6. **New shell kind** (e.g., graph-interactive) = rare; must reuse kit components.
Deprecation: definitions gain `status:'deprecated'` → hidden from nav/search, URL kept serving with notice → removal after grace period. URLs are permanent commitments.

## 35. Future API / Backend Considerations

Deliberately not built. The pure-compute layer makes later API exposure nearly free (`compute` functions are serverless-ready). Trigger conditions for revisiting: saved-state sync demand, heavy server-side needs (live tax tables beyond static packs, rate-limited premium calcs), or programmatic embedding API. Until then: static-only keeps security/perf/cost profiles optimal.

## 36. Calculator Taxonomy (controlled vocabulary)

Fixed top-level categories (registry-validated):
`Mathematics · Conversion · Date & Time · Everyday · Health · Finance · Business · Tax · Physics · Chemistry · Engineering · Computing · Data Science`
Subcategories are free-form tags within these. Adding a top-level category requires an ADR — taxonomy churn breaks nav/search/SEO structure.

## 37. Dependency Map

```
Format(numbers) ──┐
Units ────────────┼─→ Quantities pkg ──→ [physics, chemistry, conversion, finance, engineering defs]
Engine ───────────┘
Engine + Quantities ─→ compute functions (all domains)
FieldSpec + Validation ─→ FormShell ─→ [every non-keypad calculator]
KeypadShell ─→ [basic, scientific]
Definitions ─→ Registry(build) ─→ pages, sitemap, SEO, search index, example-replay specs
Theme ─→ all shells
Tax packs ─→ tax engines ─→ tax definitions          (depends on: nothing new — pure data)
ExplanationBlocks ─→ StepsPanel v2 ─→ both shells    (depends on: nothing — extends types)
Search index ← Registry;  SearchBox → index          (needs: ≥30 live calculators to be worth building)
Playwright E2E → built pages                         (needs: page generator first)
Analytics → shells                                   (needs: traffic; contract defined §29)
i18n extraction → Format seam + strings-in-definitions (needs: demonstrated non-en demand)
Backend/API → pure compute layer                     (needs: demand trigger §35)
```

Critical-path insight: **Quantities + FormShell + Registry-generation unblock ~90% of all planned calculators.** Everything else is incremental.

## 38. Development Phases (dependency-aware roadmap)

### Phase A — Platform Capabilities *(build before scale; est. 2–3 weeks)*
Enables: everything downstream. No new public calculators except migrating existing ones.
| # | Deliverable | Unlocks | Depends on |
|---|-------------|---------|-----------|
| A1 | Definition contract v2 + directory convention; migrate BasicCalculator to `domains/math/basic/` | the entire model | — |
| A2 | Registry auto-assembly + validation (glob-based) | scale safety | A1 |
| A3 | Build-time page generation (shell HTML per live def, incl. prerendered no-JS content per §24.2) + sitemap + meta/JSON-LD | infinite calculators w/o hand HTML | A2 |
| A4 | Formatting module (Intl-backed numbers, currency, percent, precision control) | every domain's output quality | — |
| A5 | Quantities package: dimensions, units, convert, parse (start: length/mass/temp/time/data) | conversion domain + physics/chemistry later | A4 |
| A6 | FieldSpec + FormShell + field validation + ResultCard + DisclaimerBanner | ~90% of future calculators | A4 |
| A7 | ExplanationBlock model + StepsPanel v2 | rich explanations everywhere | A1 |
| A8 | Example-replay CI spec + coverage gates | correctness flywheel | A1,A2 |
Exit criteria: BasicCalculator works identically through new pipeline; one pilot form calculator (Percentage Suite) shipped end-to-end; build fails on bad definitions.

### Phase B — Core Math Breadth *(est. 2–3 weeks)*
Percentage suite implementing §12.1 ratified semantics exactly (of/increase/decrease/difference/change/markup/margin + keypad `%` convention) · Fraction calculator (engine extension: rational ops) · Unit Converter full families (A5 payoff) · Statistics descriptive (mean/median/mode/variance/sd/quartiles) · Geometry area/perimeter/volume set · Quadratic solver (engine variables) · GCD/LCM/primes.
Exercises: FormShell variety, Quantities breadth, first engine variable binding.

### Phase C — Everyday + Health + Finance Core *(est. 2–3 weeks)*
Tip/discount/bill-split/fuel · Age/date-difference/business-days (datetime mini-lib) · BMI/BMR/TDEE/body-fat/heart-rate-zones (disclaimerLevel:'health') · Compound interest/EMI+CAGR/NPV·IRR(approx+warnings)/SIP (disclaimerLevel:'financial').
Exercises: money formatting discipline, iterative methods + approximation warnings, disclaimer UX.

### Phase D — Science + Computing *(est. 2–4 weeks, parallelizable)*
Physics mechanics/electricity sets (Quantities-heavy) · Chemistry molarity/moles/gas laws/pH · Base conversion/subnetting/data-size/bandwidth.
Exercises: derived-dimension units, scientific notation formatting.

### Phase E — Taxation Framework *(est. 3–4 weeks)*
Rule-pack schema + pack loader/index · bracket-walker engine · ONE pilot jurisdiction (choose based on author confidence + official golden cases available; India FY-pack and US federal are both viable) · comparison calculator (two years) · THEN second jurisdiction proves generality.
Hard gate: no tax calculator ships without golden-case verification + disclaimers.

### Phase F — Discovery & Polish *(overlaps C–E)*
Search box + index (trigger: discovery difficulty per §23 principle; ~30 live calcs as heuristic) · category pages · related-calc links · Playwright smoke + axe CI · Lighthouse budgets · analytics vendor decision · PWA evaluation.

### Explicitly deferred (revisit triggers in parentheses)
CAS/symbolic math (Education demand evidence) · accounts/sync (retention data) · API/backend (§35 triggers) · i18n content (non-en traffic) · embeddable widgets (partner demand).

## 39. Milestones

| Milestone | Definition of Done |
|-----------|-------------------|
| M1 "Platform" | Phase A exit criteria |
| M2 "Math Hub" | 15+ live math/conversion calculators; search introduced if discovery triggers per §23 |
| M3 "Daily Use" | everyday+health+finance cores; disclaimers standardized |
| M4 "Science Desk" | physics/chemistry/computing suites |
| M5 "Multi-jurisdiction Tax" | 2+ jurisdictions, golden-case verified |
| M6 "The Verse" | 100+ calculators, E2E+a11y CI, analytics informing roadmap |

## 40. Risks

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Quantity/unit bugs propagate silently everywhere | Med | dimension system + round-trip property tests from day one |
| Tax correctness liability | High if rushed | Phase E gate: golden cases or no ship; conservative disclaimers |
| Definition schema churn after 50+ calculators | Med | `schemaVersion` now; additive-only changes policy |
| FormShell becomes kitchen sink | Med | field types limited to closed union; custom escape hatch routes around, not through |
| SEO pages-thin penalty | Low-Med | §24 content minimum enforced by registry validation |
| Foundation drift (rules violated under deadline) | Med | layer-direction lint + review checklist + ADRs for exceptions |
| Maintainer bus factor (solo project) | High | this doc + 4-file recipe + self-validating registry lower onboarding cost deliberately |

## 41. Architectural Tradeoffs (recorded decisions)

| Choice | Alternative rejected | Why |
|--------|---------------------|-----|
| MPA + generated pages | SPA router / Astro migration | SEO + simplicity + keeps verified Vite foundation; SSG frameworks add migration cost without solving our actual bottleneck (definitions) |
| Imperative DOM factories | React/Preact/Lit | zero runtime, matches proven foundation; escape hatch preserved via shell boundaries |
| Decimal.js everywhere | native float + display patching | correctness is brand; perf cost negligible at our scale |
| Data-driven rule packs | per-country coded calculators | O(1) new jurisdictions; testable; diffable year-over-year |
| Build-time registry glob | manual central array | deletes a whole class of "forgot to register" bugs |
| Examples-as-tests | separate fixture files | documentation can never silently rot |

## 42. Long-Term Evolution Strategy

The platform compounds through four loops:
1. **Correctness loop:** examples→CI→trust→traffic→more examples.
2. **Capability loop:** each generalized capability (units, forms, packs) lowers the marginal cost of whole calculator *categories*.
3. **Discovery loop:** more calculators → better search/tag graph → users find long-tail tools → demand signals steer roadmap.
4. **Foundation-stability loop:** layer rules + schemaVersion + ADRs mean evolution happens by extension, so the 2030 architecture still recognizes its 2026 ancestor.

North-star metric for architecture health: **time-to-ship a quality new calculator trending down quarter over quarter** while incident rate stays flat.

---

*End of Master Architecture. Implementation begins at Phase A only upon explicit instruction.*
