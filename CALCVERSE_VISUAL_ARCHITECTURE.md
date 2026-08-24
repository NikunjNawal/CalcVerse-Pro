# CalcVerse Visual Architecture

**Phase:** V1 — Visual Architecture & Design System Research
**Status:** PROPOSED — awaiting ratification. Nothing in this document is implemented unless marked otherwise.
**Baseline:** PHASE_A5_REPORT.md (221/221 tests; A1–A5 complete with minor debt).
**Scope rule:** This phase produces documentation only. No UI rewrite, no dependencies, no framework changes.

---

## 1. Executive Summary

CalcVerse's calculation core is now trustworthy: a validated definition-driven registry, generated pages, exact decimal formatting, and a quantities engine. Its *visual* layer, however, is a functional prototype — one blue accent, generic hero, no domain identity.

This document defines the V1 visual architecture: a CalcVerse-native design language ("the Instrument Panel of the Calculator Verse") built on three moves:

1. **Deepen, don't replace** — evolve the existing CSS-custom-property token system into a three-tier token architecture (global → semantic → domain), consumed by the existing imperative-DOM components.
2. **Domain identity without fragmentation** — each category gets an accent hue + motif treatment subordinate to one global system, delivered as CSS class-scoped theme scopes loaded per-page.
3. **Restrained borrowed motion** — patterns extracted from Aceternity/Magic UI/Spectrum (spotlight grids, bento layouts, count-ups) are re-implemented natively in vanilla TS/CSS/SVG under a strict performance budget and `prefers-reduced-motion` guarantees — zero new runtime dependencies.

External references were mined for *principles*, not pasted. The result must be unmistakably CalcVerse.

## 2. Product Visual Vision

> "A visual world of calculators — every domain has its own identity; everything feels like one instrument."

CalcVerse should feel like walking into a well-designed observatory/lab: precise, calm, confident, quietly futuristic. Communication targets:

| Quality | Expression |
|---------|-----------|
| Intelligence | generous whitespace, monospaced numerals, subtle grid motifs |
| Precision | hairline borders, aligned baselines, tabular figures everywhere numbers render |
| Exploration | domain color identities, gentle ambient background motion on heroes only |
| Trust | high contrast, visible focus, honest states (warnings shown, not hidden) |
| Modern technology | restrained depth (soft shadows, no glass), crisp radii |
| Accessibility | AA contrast minimum, keyboard-first, reduced-motion respected |

Explicitly avoided: generic SaaS gradients · crypto/cyberpunk neon · heavy glassmorphism · constant looping animation · childish clip-art education styling · corporate finance grayness applied product-wide.

## 3. Current UI Audit

Inspected: `src/styles/main.css` (834 lines, full read), all six `packages/ui-components/src/*` modules, `index.html`, generated calculator page template (`scripts/lib/generator.ts` renderer), theme package API, responsive blocks.

### Strengths (keep)
- Real token foundation already exists: `--color-*`, spacing scale (4–48px), radius (6–16px), two transitions, z-index tiers, `.dark` override block — the V1 system extends this rather than replacing it.
- Consistent BEM-ish flat class inventory (~60 classes, no collisions).
- Semantic state colors (success/warning/danger/info) already present in both themes.
- Accessible primitives exist: `aria-live` display, `aria-expanded` steps toggle, `.sr-only`, `:focus-visible` outlines, keyboard-complete keypad.
- Component factories (Button/Display/History/Steps/ThemeToggle) centralize markup generation — restyling is centralized too.
- Theme persistence + `prefers-color-scheme` fallback already correct.

### Weaknesses (V1+ addresses)
- Single blue identity; zero domain differentiation despite 13 ratified categories.
- Landing = generic centered hero + uniform card grid + static "Coming Soon" list; no search, no discovery narrative, no visual hierarchy between featured/regular.
- Typography relies on Inter alone; numerals not tabular; no display-scale hierarchy.
- Motion limited to two durations + one keyframe; no easing vocabulary, no entrance choreography, no reduced-motion handling.
- Depth system is 2 ad-hoc rgba shadows, unused consistently.
- Empty/error/loading states barely exist (history empty string only).
- Iconography: emoji (🧮💡📘🕘) — inconsistent cross-platform, unscalable, off-brand.
- No domain-aware page header/treatment on calculator pages (all identical blue).

### Reusable components (verified)
Button (7 variants/sizes) · Display (expression+result, aria-live) · History panel · StepsPanel (+setStepsVisible) · ThemeToggle · Card styles · feature-list grid · footer/header patterns · stepFadeIn keyframe.

### Design debt
Legacy `.upcoming`/.hero/.features classes from pre-A3 landing · duplicated dark-mode overrides scattered across later sections of main.css · `--header-height/--sidebar-width` layout tokens defined but partially unused · emoji icons · no icon strategy.

### Architectural constraints (binding)
Vite MPA + TS strict · imperative-DOM factory components (no framework) · A3-generated pages embed static SEO/no-JS content · registry metadata eager / definitions lazy · per-page code splitting · theme package owns light/dark state on `<html>` · landing must stay engine-free (~10 kB listing chunk today).

## 4. Design Principles

1. **One instrument, many dials.** Global chrome is identical everywhere; domains change accent/motif, never layout grammar or interaction patterns.
2. **Numbers are sacred.** Tabular figures, right-aligned results, no decorative distortion of values; formatting belongs to @format, never CSS transforms.
3. **Calm surfaces, sharp data.** Backgrounds quiet; data/results carry the visual weight.
4. **Motion explains, never performs.** Animation may show where a value came from (count-up, step reveal); anything looping longer than one ambient cycle is rejected.
5. **Progressive disclosure.** Inputs first; steps/explanation/history revealed on demand; education below the fold.
6. **Every state designed.** Empty, loading, error, warning are first-class screens, not afterthoughts.
7. **Theme scope, not theme fork.** Domain theming via scoped custom properties (`data-domain="physics"`), never separate stylesheets per domain.
8. **Boring tech, distinctive result.** Vanilla CSS/TS/SVG/Canvas; distinctive through craft, not libraries.

## 5. CalcVerse Brand Language

**Name treatment:** "CalcVerse" wordmark, lowercase 'c' ligature optional; suffix "Pro" dropped from product voice (docs keep it).
**Logo concept:** equals-sign glyph inside a rounded square whose right stroke extends beyond the frame — "calculation exceeds the box". Renderable as pure SVG at any size.
**Motif language:** a faint dot-grid/graph-paper substrate (CSS radial-gradient tile) evoking graph paper — the universal calculation surface. Used at ≤4% opacity behind heroes/heroes-only; never on content panels.
**Iconography:** inline SVG stroke icons (24px grid, 1.5px stroke, currentColor) hand-authored per domain (Σ, atom, flask, chart-line, heart-pulse, blueprint, terminal…). One `icons.ts` sprite module; no icon-font dependency. Emoji removed from UI.
**Illustration:** none photographic; geometric SVG line-art per domain theme (see §12), same stroke language as icons.
**Voice:** precise, friendly, zero exclamation marks in UI copy.

## 6. Global Design Tokens

Three tiers: **primitive** (raw value) → **semantic** (role) → **component/domain** (scoped override). Existing `:root`/`.dark` blocks become tier 2; primitives live in `@theme`-style comment-documented blocks. All tokens remain CSS custom properties (no build-time preprocessing needed).

### 6.1 Color

Primitives (new): neutral ramp `--cv-neutral-0…1000`, primary ramp `--cv-blue-50…900` (current #2563eb becomes `--cv-blue-600`), plus one hue ramp per domain (§12) at identical lightness steps so cross-domain luminance is consistent.

Semantic (evolves existing names, keeps backward compatibility during migration):
```
surface: bg / bg-elevated / bg-sunken(new)
text: primary / muted / inverted
border: default / strong / focus
accent: primary + hover + subtle + on-accent   ← domain-overridable
state: success/warning/danger/info (+light/-text variants, existing)
data-viz: 8 categorical hues, AA-checked pairs (future charts)
```
Contrast rule: body text ≥4.5:1, large/UI ≥3:1, both themes, verified per domain accent pairing.

### 6.2 Typography

| Token | Value | Use |
|-------|-------|-----|
| --font-sans | Inter (existing) | UI copy |
| --font-mono | JetBrains Mono (existing) | expressions, results, code |
| Display sizes | --text-display-xl/ld: clamp(2.5→4rem) etc. | hero only |
| Scale | --text-xs 12 · sm 14 · base 16 · lg 18 · xl 20 · 2xl 24 · 3xl 30 | standard |
| Weight | 400/500/600/700 only | |
| Numerals | `font-feature-settings:"tnum"` on ALL numeric outputs | precision feel |

Line-height: 1.6 body, 1.1 display. Measure ≤72ch.

### 6.3 Spacing
Existing 4-base scale retained (xs4 sm8 md16 lg24 xl32 2xl48) + `--space-3xl:64px` + section rhythm `--section-y: clamp(48px,8vw,96px)`.

### 6.4 Radius
Existing sm6 md8 lg12 xl16 + `--radius-full:9999px` (pills). Rule: interactive controls md; containers lg; cards xl; pills full. No sharp corners anywhere.

### 6.5 Borders
`--border-width-hairline:1px`; border color semantic tokens; inner-highlight convention: `box-shadow: inset 0 1px 0 var(--color-border-inset)` on elevated cards (subtle top-light).

### 6.6 Elevation
Formalized 3-level system replacing ad-hoc rgba shadows:
```
--elevation-1: 0 1px 2px rgb(0 0 0/.06), 0 1px 3px rgb(0 0 0/.08)      /* cards */
--elevation-2: 0 4px 12px rgb(0 0 0/.10)                                /* raised/hover */
--elevation-3: 0 12px 32px rgb(0 0 0/.16)                               /* overlays */
```
Dark mode: elevation expressed via surface lightening + 1px borders instead of shadows (existing pattern, formalized).

### 6.7 Motion
Duration: `--dur-instant 80ms · fast 160ms · normal 240ms · slow 400ms · ambient 1200ms`.
Easing: `--ease-out-soft cubic-bezier(.22,.61,.36,1)` (default) · `--ease-spring cubic-bezier(.34,1.56,.64,1)` (playful, results only) · linear (ambient loops).
Named motions: hover-lift (translateY(-2px)+elevation-2) · focus-ring · result-pop (scale .97→1 spring) · step-reveal (fade+rise, staggered 40ms) · count-up · skeleton-shimmer · ambient-drift (background motifs, heroes only).
Global gate: `@media (prefers-reduced-motion: reduce){ *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important} }`.

### 6.8 Breakpoints
Existing 600/900 formalized + `sm 480 · md 768 · lg 1024 · xl 1280`. Container-based queries preferred inside workspace components where supported.

## 7. Component Architecture

Existing factories remain the implementation vehicle. V2 adds to `packages/ui-components`: `Icon.ts` (SVG sprite loader), `Skeleton.ts`, `Badge.ts`, `EmptyState.ts`, `SearchBox.ts` (V-search), `DomainHero.ts`, `ResultCard.ts` (wraps Display+formula+warnings), `CountUp.ts` (rAF number tween honoring reduced-motion), `Tooltip.ts`. Each factory consumes ONLY semantic tokens; zero raw hex outside token files. New lint rule: raw hex forbidden outside token definitions (Stylelint `declaration-property-value-allowed-list`).

## 8. Homepage Architecture

Sections (evaluated against product value — adopted/rejected):

| Section | Verdict | Rationale |
|---------|---------|-----------|
| Hero + Ask bar | ADOPT | headline + unified input promising "describe or calculate"; AI slot reserved (§18) but renders as plain search until then |
| Domain discovery rail | ADOPT | 13 category tiles with domain accents/icons — the "world of calculators" moment |
| Popular/featured calculators | ADOPT | curated via existing FEATURED_IDS; bento-style emphasis on 2–3 flagship tools (pattern: MagicUI bento) |
| Search-results dropdown | ADOPT (with search) | instant filtering over generated search-index |
| Recently used | DEFER | needs history-across-calculators plumbing (localStorage exists per-calc only) — V-search follow-up |
| Why CalcVerse | MERGE | fold into hero sub-copy; delete standalone features grid (design debt) |
| Educational strip | DEFER to post-A7 | requires explanation-system content |
| Coming-soon wall | REDESIGN | compact chips under discovery rail, not a list section |

Performance rules unchanged: listing metadata only; zero engine/compute imports; ambient background = one CSS animation on a pseudo-element, disabled on mobile+reduced-motion.

## 9. Calculator Page Architecture

Generated template evolves (structure locked for all domains):

```
GlobalNav (slim, sticky: logo · domain breadcrumb · search · theme toggle)
DomainStrip (accent hairline + domain icon + category label — the domain identity moment)
Workspace (two-column ≥lg: [inputs/result] | [steps/history]; single column <md, sidebar collapses below)
Explanation (static prerendered §24.2 content, styled)
RelatedCalculators (same-category links from registry — cheap, metadata-only)
Footer
```

DomainStrip + accent variables come from the domain theme scope set on `<body data-domain="physics">` by the page generator (metadata already knows the category — zero runtime cost).

## 10. Calculator Workspace

Interaction-density matrix solved by ONE workspace grid with density variants, not per-domain frameworks:

| Variant | For | Layout |
|---------|-----|--------|
| `keypad` | basic/scientific | display above button grid (existing), steps/history side rail |
| `form` (A6 target) | finance/health/everyday | labeled field stack left, sticky ResultCard right |
| `converter` | unit conversion | dual-unit panes + swap control, live conversion |
| `visual` (future) | geometry/plots | canvas pane + control column |

All variants share: Display/ResultCard components, field/button primitives, focus order top-to-bottom, Enter=compute, Escape=clear.

## 11. Result Experience

ResultCard anatomy (top→bottom): **value** (mono, tnum, count-up on change ≤400ms) · unit/context line · formula line (mono, muted) · warnings (amber inline, always visible when present) · actions (copy, explain-toggle). Steps panel remains the deep-dive (existing component, restyled: numbered mono rows, stagger reveal). Assumptions/limitations render as collapsible details beneath explanation content. Result pop uses `--ease-spring` once per computation; warnings never animate (gravity).

## 12. Domain Theme Architecture

Mechanism: `[data-domain="<id>"] { --accent-*: … }` scope setting 4 overridable tokens (accent, accent-hover, accent-subtle, accent-on) + `--domain-motif` (SVG url) + `--domain-icon`. Generator emits `data-domain` from definition.category. Themes ship as ONE small CSS file per domain, lazy-loaded via the existing per-page chunking (a domain's theme rides with that domain's page — homepage loads none until hover-interaction ships, and then only on interaction).

| Domain | Accent (light/dark tuned) | Motif direction | Motion flavor |
|--------|--------------------------|-----------------|---------------|
| mathematics | Indigo #4f46e5 | graph-paper grid, Σ/π glyphs | step-reveal proofs |
| physics | Cyan #0891b2 | vectors/arcs/orbits | orbit drift ambient |
| chemistry | Emerald #059669 | hex lattices, bonds | bond-draw on load |
| finance | Amber #d97706 | sparklines, delta glyphs | count-up emphasis |
| health | Rose #e11d48 | pulse line, rounded warmth | gentle pulse (once) |
| engineering | Slate-blue #475569 + blueprint tint | dashed dimension lines, grid | draw-in strokes |
| computing | Violet #7c3aed | binary/columns, terminal hints | caret blink micro |
| business | Teal #0d9488 | bars, flow arrows | bar-grow |
| tax | Neutral slate + red accent flags | brackets, forms | none extra |
| data-science | Fuchsia #c026d3 | scatter dots, matrices | scatter-jitter ambient |
| everyday | Warm sky #0284c7 | soft circles | minimal |

Rule: domain tokens may set accent/motif/icon ONLY — never typography, spacing, radius, layout, or global state colors.

## 13. Dark / Light Theme Architecture

Unchanged ownership: `packages/theme` toggles `.dark` on `<html>` (existing). Domain scopes define BOTH modes via nested custom properties:
```css
[data-domain="physics"] { --domain-accent: #0891b2; }
.dark[data-domain="physics"] { --domain-accent: #22d3ee; }
```
Contrast re-verified per pair. No per-calculator theme logic; no FOUC (theme init already synchronous in head-adjacent bootstrap).

## 14. Responsive Architecture

Mobile-first. Keypad: buttons min-height 48px (touch), grid stays 4-col ≥320px. Workspace collapses to single column <1024px with ResultCard sticky-top while scrolling inputs. Navigation condenses to logo+search+theme (breadcrumb hidden <768px). Discovery rail horizontal-scrolls with snap. Breakpoint tokens §6.8; container queries inside workspace where baseline supports.

## 15. Accessibility Architecture

Binding requirements: WCAG 2.1 AA · full keyboard paths (search `/` shortcut, skip-link to workspace, arrow-key keypad navigation) · visible `:focus-visible` ring (2px accent offset 2) everywhere · aria-live polite on results, assertive on errors · form labels always visible (no placeholder-as-label) · touch targets ≥44×44 · error text tied via `aria-describedby` · reduced-motion global kill-switch · contrast pairs verified per domain/theme combination (automatable later via Playwright+aaxe). Status: current keypad/display/steps primitives largely comply; gaps tracked for V2/V5 implementation.

## 16. Motion Architecture

Consolidated in §6.7 + §11. Governance: max ONE ambient animation per viewport, heroes only; entrance animations ≤ once per element per session; nothing animates while typing; `prefers-reduced-motion` kills all non-essential motion (count-up resolves instantly to final value).

## 17. Performance Architecture

Budgets (gzip, per page): landing JS ≤14 kB total (today ~14 ✓), calculator page shell ≤16 kB + definition chunk, domain-theme CSS ≤2 kB/page, fonts unchanged (Inter/JetBrains Mono, display=swap). Ambient backgrounds: CSS-only (gradients/SVG), Canvas allowed only for future `visual` workspaces. Images: none required by V1 (SVG motifs inline). Every new visual feature must state its chunk destination before merge; landing regression = build fails (size-budget check added to CI at A8).

## 18. AI / RAG Future Integration

Reserved seam: the homepage hero input IS the future "Ask CalcVerse" bar. Contract now: input submits to local search; later, an async router may resolve NL → calculator id + prefilled inputs → navigate to `/calculators/<id>.html?in=<params>`. Visual provisions: input width accommodates sentence-length queries; a subtle sparkle affordance slot exists right-aligned (hidden until feature flag); result pages accept query-string input prefill (harmless today). No AI code, deps, or endpoints in V1.

## 19. External UI Reference Research

### Spectrum UI (arihantcodes/spectrum-ui)
Stack: Next.js 14 + shadcn + Tailwind + Motion; 44 copy-paste components + blocks + templates; MCP server + registry.json for AI sourcing.
**Useful patterns:** block composition (hero/pricing/footer as composable sections); registry-as-data for AI discovery; live-preview-plus-source docs pairing.
**Adapt:** block-section mindset for homepage; machine-readable component catalog idea (our registry already does this for calculators — extend to UI kit later).
**Not suitable:** React/Radix/Motion stack wholesale; auth/payment scaffolding.
**Implementation approach:** native TS factories consuming tokens; a future `ui-kit.registry.json` mirrors the sourcing concept.
**Dependencies:** none transferred. **Performance:** their Motion runtime rejected; we keep CSS/rAF.

### Aceternity UI (studied via AnayDhawan catalog; named repo URL 404s)
Signature effects: spotlight, background-beams, wavy/lamp backgrounds, text-generate, grid card-hover spotlight, infinite moving cards, 3d-card/macbook-scroll.
**Useful patterns:** cursor-tracking spotlight (radial-gradient following pointer); grid-hover spotlight for card fields; staggered text reveal; beam/path decoration.
**Adapt (natively):** hero spotlight = one absolutely-positioned radial gradient updated via pointermove rAF on landing hero only; card-grid hover spotlight = shared mousemove handler writing `--mx/--my` custom props; staggered reveal = CSS transition-delay choreography.
**Not suitable:** framer-motion dependency; WebGL/heavier effects; license note — Aceternity source is usable-but-not-resalable, so we REIMPLEMENT patterns from scratch (cleanest legally and technically).
**Performance:** pointer handlers throttled to rAF; disabled touch/reduced-motion.

### Magic UI (magicuidesign/magicui)
22k★, MIT, shadcn-compatible: marquee, bento-grid, animated-beam, meteors, particles, shimmer-button, dock, globe.
**Useful patterns:** bento asymmetric grid for featured calculators; marquee for coming-soon ticker (paused, reduced-motion aware); shimmer on primary CTA (subtle, once-per-hover); meteors/particles rejected as noise for a calculation product.
**Adapt:** bento layout (pure CSS grid); CSS-keyframe marquee/shimmer equivalents (~30 lines each).
**Not suitable:** globe/WebGL; dock.
**Performance:** all CSS; zero JS for these patterns.

### Components (AnayDhawan/Components)
An *agent-sourcing skill*: fetch proven components live, adapt to brand tokens, enforce attribution + anti-patterns.
**Useful patterns:** the anti-pattern canon (never raw-paste; adapt tokens; wrap reduced-motion; one showpiece per viewport; galleries aren't sources) — adopted VERBATIM as CalcVerse policy; live-registry sourcing workflow; per-entry license recording.
**Adapt:** our DESIGN.md-style governance (this document + future DESIGN.md) + token adaptation checklist in PR template.
**Not suitable:** React/Tailwind assumption; installing the skill itself (targets different stack).

### Peoplebase Directory (bymilon/peoplebase-directory)
React/Vite dashboard scaffold whose value is PROCESS: explicit `DESIGN.md`, `.wiki/` knowledge base, human approval gates on tokens/navigation/design docs, "context lives next to code".
**Useful patterns:** approval gates (adopted: changes to token files/DESIGN.md require review); knowledge-base-next-to-code (adopted: this document + planned `DESIGN.md`); Lucide icon consistency (adopted concept: single stroke-icon system).
**Not suitable:** Recharts/dashboard-shell specifics; missing-license cautionary tale (we keep our proprietary LICENSE).

### Matrix (nocoo/matrix)
Cyberpunk dashboard kit: 40+ components, strict MVVM, custom Tailwind v4 theme with a NAMED tonal scale (`matrix-primary/bright/muted/dim/panel`), palette showcase page, single maximalist theme, quality gates.
**Adopted principles:** named intensity ladder within an accent (bright/base/muted/dim) → adopted for domain accents (`--domain-accent-bright/base/muted/dim` gives designers 4 safe steps instead of one color); a `/palette` token-reference page idea (future internal tool); MVVM-ish separation mirrors our compute/format/UI split — external validation.
**Rejected:** green-on-black cyberpunk aesthetic, scanlines, ASCII borders, single-theme maximalism, sharp corners.

## 20. Recommended Native CalcVerse Patterns

Distilled, implementable in vanilla TS/CSS/SVG:
1. **DotGridBackdrop** — CSS radial-gradient tile, opacity ≤4%, hero-scoped.
2. **PointerSpotlight** — rAF-throttled `--mx/--my` radial gradient (hero, desktop, motion-ok).
3. **HoverGridSpotlight** — shared listener writing per-card `--mx/--my`.
4. **BentoFeatured** — CSS grid with span-tuned flagship cards.
5. **CountUpValue** — rAF tween on ResultCard, respects reduced-motion, formats via @format.
6. **StaggerReveal** — transition-delay cascade for steps/list items.
7. **MarqueeChips** — paused-until-hover coming-soon ticker (reduced-motion: static wrap).
8. **DomainAccentScope** — `data-domain` custom-property injection (generator-side).
9. **ShimmerCTA** — single sweep on primary CTA hover.
10. **TokenPalettePage** — internal `/design` route rendering live tokens (governance tool, ungated/noindex).

## 21. Patterns Explicitly Rejected

WebGL globes/particle engines/fluid cursors · hyperspeed tunnels · glitch/scramble text walls · matrix rain/scanlines/ASCII chrome · permanent looping backgrounds · glassmorphism panels · neon glow text · scroll-hijack storytelling · parallax layers · auto-playing carousels · framework adoption (React/Vue/Svelte) · Tailwind introduction · icon fonts · animation libraries (framer-motion/motion-one) · copying Aceternity source under its no-redistribution license.

Rejection reasons uniformly: performance budget, dependency policy, accessibility, brand coherence.

## 22. Dependency Policy

Zero new runtime dependencies in V1–V5 visual phases. Allowed additions only via ADR demonstrating: no native equivalent, <5 kB gzip, tree-shakeable, accessible, license-compatible (MIT/Apache). Current approved runtime set: decimal.js (engine/format/quantities). Fonts via Google Fonts CDN (existing). Dev-deps unrestricted by this policy but reviewed.

## 23. Implementation Roadmap

| Phase | Content | Depends on |
|-------|---------|-----------|
| **V1** | this document | — ✅ |
| **V2** Core design system | token tiers in main.css, Icon sprite, Skeleton/Badge/EmptyState, motion tokens + reduced-motion gate, Stylelint raw-hex rule, remove legacy classes/emoji | V1 ratification |
| **V3** Landing page | hero+ask bar, DotGrid+Spotlight, domain rail, BentoFeatured, MarqueeChips, redesigned footer; delete debt classes | V2 |
| **V4** Domain themes | 13 accent scopes, DomainStrip in generator template, motif SVGs, per-domain QA of contrast | V2 (parallelizable with V3 tail) |
| **V5** Calculator shell | workspace variants (keypad restyle first), ResultCard+CountUp, steps restyle, related-calculators strip | V2, A6 FormShell for `form` variant |
| A6 → A8 unchanged | FormShell, explanations, examples/CI | V5 for their visual halves |

Adjusted ordering rationale: domain themes (V4) precede full calculator-shell restyle because the generator template change is small and unlocks domain identity across every existing/future page immediately.

## 24. Design-System Governance

Adopting Peoplebase's gate model: changes to token definitions, this document, or the icon sprite require explicit review (human approval gates). Every visual PR must state: tokens touched, chunk impact, a11y checks performed, reduced-motion behavior. A future `DESIGN.md` distills day-to-day rules from this architecture (this doc stays constitutional). Planned `/design` palette page makes tokens self-documenting and testable.

## 25. Architecture Audit

- Stack preserved: Vite/TS/Vitest/imperative DOM — zero framework/library additions proposed ✅
- A1–A5 untouched: registry, page generation, lazy definitions, formatting, quantities all unaffected; visual work consumes them ✅
- Performance budgets quantified and enforcement path defined (CI size gate at A8) ✅
- Accessibility elevated to binding requirement with concrete mechanisms ✅
- External references reduced to principles + 10 named native patterns; license-risky copying explicitly rejected ✅
- All 26 requested coverage areas addressed (this section numbering maps 1:1 to the brief) ✅

## 26. V1 Exit Criteria

| Criterion | Status |
|-----------|--------|
| Current UI audited with evidence (files/classes/tokens inspected) | ✅ §3 |
| All six references studied; per-repo analysis complete | ✅ §19 |
| Patterns adopted vs rejected explicitly justified | ✅ §20–21 |
| Three-tier token architecture incl. domain scopes | ✅ §6, §12 |
| Homepage + calculator-page + workspace architectures defined | ✅ §8–10 |
| Result experience beyond INPUT→NUMBER | ✅ §11 |
| Motion system with reduced-motion guarantees | ✅ §16 |
| Accessibility binding | ✅ §15 |
| Performance/code-splitting constraints preserved | ✅ §17 |
| AI integration point reserved without implementation | ✅ §18 |
| Dependency policy (zero new runtime deps) | ✅ §22 |
| Implementation roadmap V2–V5 + A6–A8 sequenced by dependency analysis | ✅ §23 |

**V1 ready for ratification. Implementation begins at V2 only upon explicit instruction.**
