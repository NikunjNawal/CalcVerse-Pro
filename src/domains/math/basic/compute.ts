// Pure compute layer for the Basic Calculator.
// Purity contract (§8.2): deterministic, no side effects, no I/O, no DOM.
// Delegates expression parsing/evaluation to packages/calc-engine — no duplicated engine logic.
import { calculate } from '@calc-engine';
import type { CalcOutput, InputRecord } from '../../../registry/calculator-definition';

/**
 * Resolve `%` in a display-style expression per the ratified percentage
 * semantics (CALCVERSE_MASTER_ARCHITECTURE.md §12.1):
 *
 * - `N%` with no pending binary operator  → `(N/100)`            e.g. `50%`      → `0.5`
 * - `a + b%` / `a − b%` (base-relative)   → `a ± (a*b/100)`      e.g. `50+10%`   → `55`
 * - `a × b%` / `a ÷ b%` (fractional)      → `a × (b/100)`        e.g. `200×10%`  → `20`
 *
 * Operates left-to-right until no `%` remains. Throws on misplaced `%`.
 */
export function resolvePercentages(expression: string): string {
  let expr = expression;
  let guard = 0;

  while (expr.includes('%')) {
    if (guard++ > 100) throw new Error('Expression too complex to resolve');

    const idx = expr.indexOf('%');
    const before = expr.slice(0, idx);

    const numMatch = before.match(/(\d+\.?\d*)$/);
    if (!numMatch) {
      throw new Error("Misplaced '%' — must directly follow a number");
    }
    const bStr = numMatch[1];
    // Normalize: drop trailing whitespace so the operator is always the last
    // character before slicing. This makes both lookaheads deterministic
    // regardless of spacing ("50+10%", "50 + 10%", "50+ 10%").
    const trimmedHead = before.slice(0, before.length - bStr.length).replace(/\s+$/, '');

    const opMatch = trimmedHead.match(/([+−\-×÷])$/);
    let replacement: string;

    // ASCII '-' and Unicode '−' are the same subtractive operator (inputs may
    // arrive via keyboard mapping, direct API calls, or earlier rewrites).
    const isAdditive =
      opMatch !== null && (opMatch[1] === '+' || opMatch[1] === '−' || opMatch[1] === '-');

    if (isAdditive && opMatch) {
      // Base-relative: find operand `a` preceding the additive operator.
      // The operand may be a plain number (optionally negative via ± key) or
      // a parenthesized sub-expression produced by an earlier resolution of
      // another '%' in the same expression ("50 + 10% - 20%").
      // Ratified spec multiplies the ABSOLUTE base (§12.1):
      //   -50 + 10% → -50 + (50·10/100) = -45.
      const headBeforeOp = trimmedHead.slice(0, trimmedHead.length - 1);
      const aMatch = headBeforeOp.match(/(-?\d+\.?\d*|\([^()]*\))\s*$/);
      if (!aMatch) {
        replacement = `(${bStr}/100)`;
      } else {
        const rawBase = aMatch[1];
        const absBase = rawBase.startsWith('-') ? rawBase.slice(1) : rawBase;
        replacement = `(${absBase}*${bStr}/100)`;
      }
    } else {
      replacement = `(${bStr}/100)`;
    }

    expr = expr.slice(0, idx - bStr.length) + replacement + expr.slice(idx + 1);
  }

  return expr;
}

/** Evaluate a Basic Calculator expression and return value + steps + warnings. */
export function calculateBasic(input: string | InputRecord): CalcOutput {
  if (typeof input !== 'string') {
    throw new Error('Basic calculator expects an expression string');
  }
  const normalized = resolvePercentages(input);
  const result = calculate(normalized);
  return {
    value: result.value,
    steps: result.steps,
    warnings: [],
  };
}
