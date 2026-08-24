# CalcVerse Pro — Phase V2 Readiness Audit

**Date:** 2026-08-24
**Audited state:** commit `d8f10b7` ("feat: establish CalcVerse platform and GitHub Pages deployment") — pushed to `origin/main`, working tree clean (0 pending changes).
**Method:** Independent re-verification of every gate and claim. No prior report trusted without command-level evidence. AUDIT ONLY — nothing modified.

---

## 1. Executive Summary

CalcVerse-Pro at `d8f10b7` is a **verified, deployable platform**: 235/235 tests, all six quality gates green (typecheck/lint/stylelint/prettier/test/build), production build correct under `/CalcVerse-Pro/`, deployment workflow prepared, remote in sync. Architecture is clean: package dependency direction holds with zero circular imports; security surface is minimal and clean.

The weak flank is **front-of-house**: the landing page is still the pre-A3 generic template consuming legacy CSS classes, four V2-planned components (SearchBox/CountUp/Tooltip/DomainHero) were deferred, and the six new V2 primitives have **zero production consumers** yet (tests only) — expected, since their consumers are exactly V3/V5 work. Deployment to live GitHub Pages additionally requires the manual Settings → Pages source switch, which tooling cannot perform.

**V3 READINESS: READY** (no hard blockers; a short optional-cleanup list improves the V3 starting point).

## 2. Current Repository State — VERIFIED

| Check | Result |
|-------|--------|
| typecheck | exit 0 |
| ESLint | exit 0 |
| Stylelint (`lint:css`) | exit 0 |
| Prettier | exit 0 |
| Tests | **235 passed / 0 failed**, 9 files |
| Production build | exit 0; dist contains index.html · calculators/basic.html · basic-calculator.html (redirect) · robots.txt · sitemap.xml · .nojekyll · assets/* |
| Git | local == remote == `d8f10b7`; clean tree |

Bundle (gzip): landing listing 3.83 + main 1.19 + icons 0.86 + index 0.74 ≈ **6.6 kB gz landing JS**; calculator page adds mount 3.63 + definition(engine) 15.16 + basic 0.64 + keypadConfig 0.31; CSS 3.81 kB gz total. Well inside V1 budgets.

## 3. A1–A5 Verification

| Phase | Verdict | Evidence (re-verified now) |
|-------|---------|---------------------------|
| A1 Definition contract | **PASS** | `src/domains/math/basic/{definition,metadata,compute}.ts` exist; contract types in `src/registry/calculator-definition.ts`; ratified % semantics tested (`50+10%=55` passes at engine + UI level); compute purity lint-enforced |
| A2 Auto registry | **PASS** | `src/registry/index.ts` globs `domains/**/metadata.ts` eager + definitions lazy; validator rejects bad/duplicate defs (23 tests); compat adapter confirmed deleted (`ls` fails); seeds are display-only |
| A3 Page generation | **PASS** | `scripts/build-pages.mts` (145 lines) + lib generator; prebuild wired; dist routes verified this audit; whole-tree live-definition validation present; sitemap generated, valid, no coming-soon leakage (programmatic check) |
| A4 Formatting | **PASS** | `packages/format` 100% statement coverage; string-scale preservation, Intl currency boundary guard, ≥1e15 fallback all test-verified; shell display migrated |
| A5 Quantities | **PASS** | 99.47% coverage; affine °F bug fixed & regression-guarded; dimension gates reject kg→m/m→s/°C→m/h→kg; 40-digit clone Decimal; extension dimensions (VELOCITY…) present |

Minor residual debt per phase (none blocking): A1 `CalculatorBase.destroy()` listener fix landed in V2 ✓; A2 `FEATURED_IDS` manual curation list remains; A3 `LEGACY_ALIASES` redirect map remains by design; A4 locale table is a hand-mapped subset; A5 compound-unit parsing deferred by design.

## 4. V1 Verification (visual architecture)

- `CALCVERSE_VISUAL_ARCHITECTURE.md`: 358 lines, all 26 sections present ✅
- V1 was documentation-only by definition — nothing to "deliver" beyond ratification ✅
- V1's *V2-scope component list* partially landed (see §5): Icon/Skeleton/Badge/EmptyState/ResultCard ✅ delivered; **SearchBox / CountUp / Tooltip / DomainHero ABSENT** — correctly deferred to V3/V5 where their consumers exist, but this makes V2 formally PARTIAL against V1 §7 wording.

**V1 verdict: PASS** (its own exit criteria were documentation criteria).

## 5. V2 Verification (design system)

Delivered & verified: three-tier tokens split into `tokens.css` (single :root/.dark authority, migration structurally audited — verbatim values, no lost names), typography/motion/elevation/breakpoint/domain-infra token groups, reduced-motion kill-switch, tabular numerals, icon sprite + factory (emoji-free repo sweep clean), Skeleton/Badge/EmptyState/ResultCard factories, Stylelint raw-hex protection wired as `lint:css` (exit 0), theme ownership untouched.

Gaps found THIS audit:
1. Four planned components absent (above) → **MEDIUM**
2. New primitives have zero production consumers → **expected/FUTURE** (their consumers are V3/V5)
3. `--radius-full` added late during implementation (was missing when first referenced) → fixed; noted as process reminder → **LOW**
4. Unused variant CSS already shipped (`badge--neutral`, `.icon--lg` have no callers) → **LOW**

**V2 verdict: PARTIAL** — core complete and verified; four consumer-driven components deferred with rationale.

## 6–7. Architecture & Dependency Audit

Import-graph analysis (all internal `from` statements inventoried):
- **Package direction holds:** calc-engine imports only itself; format imports decimal.js only; quantities imports decimal.js only; ui-components imports @theme only (ThemeToggle — sanctioned); theme imports nothing.
- **Zero circular dependencies detected** (grep-based graph is acyclic: app→ui/theme/format/engine; registry→definitions→compute→engine).
- **No cross-domain imports** between `src/domains/**` directories.
- Misplaced-responsibility scan: `keypadConfig.ts` correctly lives in calculator layer; registry stays metadata-only; generator library is Node-only.
- `.eslintrc.cjs` counted as 0%-covered noise in reports — config file, not code (exclude candidate).

## 8. UI/UX Audit (objective, CURRENT → PROBLEM → IMPACT → V3 ACTION)

| Current UI | Problem | Impact | Recommended V3 Action |
|-----------|---------|--------|----------------------|
| Generic hero + static features grid (index.html) | Off-brand, pre-A3 content, ✔ glyphs removed but section remains text-only | Weak first impression; doesn't communicate breadth | Replace with Hero+Ask bar + domain rail (V3 scope) |
| Uniform card grid, 🧮 replaced but single accent | All domains look identical | Discovery suffers | Domain accent scopes + bento featured layout |
| Static "Coming Soon" `<ul>` | Dead-end section | Wasted space | Marquee-chips pattern |
| Calculator pages share one blue identity | No domain awareness despite infra existing (defaults alias primary) | Missed product differentiator | Emit `data-domain` + real accent values (V4) |
| Emoji-free but icon-less headers on generated pages | Tagline-only header | Flat identity | DomainStrip w/ SVG icon (generator change) |
| No skip-link on any page | Keyboard users tab through nav | A11y gap | Add skip-link (V2 leftover → fold into V3) |
| History empty-state = plain `<li>` string | Inconsistent with new EmptyState primitive | Minor polish debt | Swap to createEmptyState in V5 shell restyle |
| Error display = raw 'Error' string in result line | Unexplained failure | Trust erosion | Error anatomy w/ cause sentence (A6/V5) |

Mobile/desktop/responsive: grid collapse at ≤900px verified in CSS; touch targets ≥48px keypad ✓; container queries not yet used (future). Motion: two-step system + reduced-motion gate active ✓.

## 9. Design-System Audit

Tokens.css = 129 lines, single-source raw values, stylelint-exempt by override (explicitly nulled rules — not broad suppression). Raw-hex impossible elsewhere (color-no-hex enforced; verified passing). Dark mode: one authoritative block + domain defaults; scattered legacy `.dark …` descendant rules remain in main.css (3 matches) — cosmetic debt for V3 rewrite. Duplicate-style scan: badge--neutral/icon--lg unused variants (LOW); `.card` vs `.result-card` overlap intentional (legacy vs new).

## 10. Calculator Architecture Audit

Adding calculator #N requires: directory (metadata/definition/compute/mount/test) — no central edits (registry glob + mount glob verified). Blockers for A6 identified: FormShell absent (by design), field validation layer absent, ResultCard not yet consumed by shells, workspace grid variants undefined. None are architectural blockers — they ARE A6/A6-adjacent deliverables.

## 11. Deployment Audit

Workflow permissions least-privilege (contents:read, pages:write, id-token:write) ✅ · concurrency cancel ✅ · node 22+npm cache ✅ · base `/CalcVerse-Pro/` production-only, verified in built HTML asset URLs ✅ · `.nojekyll` deployed ✅ · sitemap/robots generated into dist ✅ · dev/preview/prod path behavior verified (dev root; preview serves both / and /CalcVerse-Pro/) ✅.
**Open external dependency:** live site still serves commit-era static page until (a) Actions run completes post-push AND (b) **Settings → Pages → Source = GitHub Actions** (manual; unverifiable here — gh CLI absent). Risk: MEDIUM, owner: human.

## 12. Security Audit

| Area | Finding | Severity |
|------|---------|----------|
| Dynamic execution | Zero `Function(`/`eval(` occurrences (sweep incl. scripts+HTML) | — |
| innerHTML (8 sites) | All write authored/repo-owned markup or registry-controlled data; none interpolate user input | LOW (harden to factories during V3/V5 rewrites) |
| localStorage | Theme key + per-calc history only; JSON.parse wrapped in try/catch with warn | — |
| Browser APIs/network in pure layers | Banned via ESLint overrides (format/quantities/compute); Node-env tripwire tests | — |
| Secrets/.env | Not tracked; gitignore verified; staged-diff scan clean | — |
| Workflow permissions | Least-privilege + concurrency group ✅ | — |
| Dependency risk | 358 packages, 5 advisories reported at install (2 mod/high/critical mix) — **not yet remediated** | MEDIUM |

## 13. Test/Coverage Audit

84.42% stmts / 81.88% branch / 87.42% funcs overall. Strong: format 100%, quantities 99.5%, engine 93.5%, ui-components 94.6%. Gaps: entry points 0%, `main-index.ts` card rendering untested, SearchBox-class future components N/A, **deployment workflow untestable locally** (A8 CI), visual/responsive untested (Playwright milestone), theme matchMedia branches partial. High-value missing tests: landing-page render integration test, generator CLI end-to-end (tmp-tree → artifacts) test, destroy()-leak regression test (the fixed bug has no dedicated test).

## 14. Performance Audit

Landing JS ≈6.6 kB gz (budget ≤14 ✓) · engine confined to definition chunk (grep-proven) · quantities tree-shaken out entirely (no consumer) · icons chunk 2.15 kB shared · CSS 17.15 kB raw / 3.81 gz single sheet · fonts preconnected+swap. Findings only: CSS grew +2.85 kB raw in V2 (acceptable, monitor); icons chunk could merge into listing chunk later (micro).

## 15. Dead-Code/Legacy Audit

Unused-but-shipped CSS variants: `.badge--neutral`, `.icon--lg` (LOW). Legacy landing classes all still consumed (hero/features/upcoming/feature-list/feedback-link = 1 consumer each) — retire in V3. Unused exports: none beyond the intentionally-future primitives. `.eslintrc.cjs` flagged by coverage tooling as "uncovered" — add to coverage exclude (LOW).

## 16. Technical Debt (consolidated)

HIGH: none.
MEDIUM: dependency advisories unremediated · live-site Pages source switch pending (manual) · four deferred V2 components now owed to V3/V5 · landing-page render test missing.
LOW: skip-link absence · legacy `.dark` descendant scatter · FEATURED_IDS/LEGACY_ALIASES manual maps (by design) · coverage-exclude noise · destroy() lacks dedicated regression test · emoji-free but header icons absent on generated pages.

## 17. V3 Blockers

None hard. V3 can start immediately against current tokens/components.

## 18. Optional Pre-V3 Cleanup
1. `npm audit fix` review + remediation of the 5 advisories.
2. Add skip-link + landing render integration test while touching landing anyway.
3. Coverage-config exclude for `.eslintrc.cjs`.

## 19. Safe to Defer to V3
Hero/Ask bar · discovery rail · bento featured · marquee chips · search box · legacy landing class removal · skip-link · EmptyState swap-in · footer redesign.

## 20. Deferred to V4/V5
Domain accent values + motifs + generator DomainStrip (V4) · workspace variants/keypad restyle/ResultCard consumption/steps restyle (V5).

## 21. A6 Deferred Work
FormShell, FieldSpec validation UX, converter/form workspace variants, sticky result behavior — all depend on V5 shell foundations.

## 22. V3 Readiness Decision

# V3 READINESS: READY

Evidence summary: all gates green at HEAD==remote (`d8f10b7`); architecture acyclic and direction-clean; 84.4% coverage with strong core-package numbers; deployment pipeline prepared and pushed; no CRITICAL or HIGH findings open.

## 23. Exact Recommended Next Step

Begin **V3 Landing Page**: first task = replace legacy landing sections with Hero+Ask bar, domain rail, bento featured grid, marquee chips using existing tokens/primitives — adding the landing render integration test and skip-link in the same change-set. Remediate dependency advisories as a parallel pre-task.

---

*Audit complete. Nothing modified. Nothing committed.*
