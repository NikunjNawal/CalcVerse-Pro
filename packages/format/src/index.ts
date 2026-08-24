// CalcVerse Pro — centralized formatting layer (A4).
//
// PRESENTATION ONLY. Calculation semantics live in packages/calc-engine and
// domain compute functions; this package never alters mathematical values —
// it only decides how an authoritative result is displayed.
//
// Purity contract: no DOM, no UI imports, no browser globals, no unsafe
// evaluation (enforced via ESLint overrides for packages/format/**).
//
// Precision contract: values arrive as Decimal | exact decimal string | number.
// Strings/Decimals are processed through Decimal.js arithmetic/string methods;
// JavaScript numbers are never used as intermediaries for string inputs, and
// Number(value) is never applied to a Decimal.

import Decimal from 'decimal.js';
export { Decimal };

export type DecimalInput = Decimal | string | number;

/** Convert any accepted input to Decimal without precision loss. */
export function toDecimal(value: DecimalInput): Decimal {
  if (value instanceof Decimal) return value;
  if (typeof value === 'string') return new Decimal(value); // exact decimal text
  return new Decimal(value.toString()); // numbers are already binary floats; stringify, don't re-float
}

// ---------------------------------------------------------------------------
// Locale separator seam (localization readiness — full i18n is NOT in scope)
// ---------------------------------------------------------------------------

interface SeparatorStyle {
  group: string;
  decimal: string;
}

const SEPARATORS: Record<string, SeparatorStyle> = {
  'en-US': { group: ',', decimal: '.' },
  'en-IN': { group: ',', decimal: '.' }, // Indian grouping pattern handled by groupDigitsIndian
  'de-DE': { group: '.', decimal: ',' },
  'fr-FR': { group: '\u202f', decimal: ',' },
};

const DEFAULT_LOCALE = 'en-US';

function separatorsFor(locale?: string): SeparatorStyle {
  if (!locale) return SEPARATORS[DEFAULT_LOCALE];
  return SEPARATORS[locale] ?? SEPARATORS[DEFAULT_LOCALE];
}

/** Standard 3-digit grouping: 1234567 → 1,234,567 */
function groupDigits(integerPart: string, group: string): string {
  const sign = integerPart.startsWith('-') ? '-' : '';
  const digits = sign ? integerPart.slice(1) : integerPart;
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, group);
}

/** Indian 2-then-3 digit grouping: 12345678 → 1,23,45,678 */
function groupDigitsIndian(integerPart: string, group: string): string {
  const sign = integerPart.startsWith('-') ? '-' : '';
  const digits = sign ? integerPart.slice(1) : integerPart;
  if (digits.length <= 3) return sign + digits;
  const last3 = digits.slice(-3);
  let rest = digits.slice(0, -3);
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, group);
  return `${sign}${rest}${group}${last3}`;
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

export interface FormatNumberOptions {
  /** Locale key selecting grouping/decimal separators. Default 'en-US'. */
  locale?: string;
  /** Fixed number of fraction digits. Conflicts with significantFigures. */
  decimals?: number;
  /** Round to N significant figures. Conflicts with decimals. */
  significantFigures?: number;
  /** Insert grouping separators into the integer part. Default true. */
  grouping?: boolean;
  /** Strip trailing zeros in the fraction ("2.50" → "2.5"). Default false when decimals is set, true otherwise. */
  trimTrailingZeros?: boolean;
  /** Use Indian 2-then-3 grouping (applies with en-IN style locales). Internal. */
  indianGrouping?: boolean;
}

/**
 * Format a value for display in ordinary (positional) notation.
 *
 * - Very large/small magnitudes stay positional here; use formatScientific
 *   when exponential presentation is wanted. This function never forces
 *   scientific notation.
 * - The input's mathematical value is preserved except for explicitly
 *   requested rounding (decimals / significantFigures).
 */
export function formatNumber(value: DecimalInput, options: FormatNumberOptions = {}): string {
  const d = toDecimal(value);

  if (options.significantFigures !== undefined && options.decimals !== undefined) {
    throw new Error('formatNumber: use either decimals or significantFigures, not both');
  }

  let str: string;
  if (options.decimals !== undefined) {
    str = d.toFixed(options.decimals);
  } else if (options.significantFigures !== undefined) {
    const r = d.toSignificantDigits(options.significantFigures);
    str = r.toFixed(r.dp()); // dp may be negative — still yields positional form
  } else if (typeof value === 'string') {
    // Strings are authoritative decimal text — preserve their exact scale
    // (Decimal construction would normalize away meaningful trailing zeros).
    str = value;
  } else {
    str = d.toFixed(d.dp()); // full authoritative expansion, never e-notation
  }

  // Trailing-zero policy: default trim only when no fixed decimals requested.
  const shouldTrim = options.trimTrailingZeros ?? options.decimals === undefined;
  if (shouldTrim && str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '');
  }
  if (str === '-0') str = '0';

  const sep = separatorsFor(options.locale);
  const groupingOn = options.grouping ?? true;

  const parts = str.split('.');
  let intPart = parts[0];
  const fracPart = parts[1];
  const negative = intPart.startsWith('-');
  if (negative) intPart = intPart.slice(1);

  if (groupingOn && intPart.length > 3) {
    const useIndian = options.indianGrouping || options.locale === 'en-IN';
    intPart = useIndian ? groupDigitsIndian(intPart, sep.group) : groupDigits(intPart, sep.group);
  }

  let out = (negative ? '-' : '') + intPart;
  if (fracPart !== undefined && !(shouldTrim && fracPart === '')) {
    out += sep.decimal + fracPart;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Scientific notation
// ---------------------------------------------------------------------------

export interface FormatScientificOptions {
  /** Digits after the decimal point in the mantissa. Default 6, trimmed. */
  decimals?: number;
  /** Render exponent with Unicode superscripts (10⁻⁶). Default true; else "e-6". */
  unicode?: boolean;
}

const SUPERSCRIPT: Record<string, string> = {
  '0': '\u2070',
  '1': '\u00b9',
  '2': '\u00b2',
  '3': '\u00b3',
  '4': '\u2074',
  '5': '\u2075',
  '6': '\u2076',
  '7': '\u2077',
  '8': '\u2078',
  '9': '\u2079',
  '-': '\u207b',
  '+': '',
};

function superscript(exponent: string): string {
  return [...exponent].map(ch => SUPERSCRIPT[ch] ?? ch).join('');
}

/**
 * Format in scientific notation: 0.00000123 → "1.23 × 10⁻⁶".
 * Zero renders as plain "0". Explicit opt-in — nothing here forces
 * scientific form on callers of formatNumber.
 */
export function formatScientific(
  value: DecimalInput,
  options: FormatScientificOptions = {}
): string {
  const d = toDecimal(value);
  if (d.isZero()) return '0';

  const decimals = options.decimals ?? 6;
  // decimal.js exponential: "1.23e-6"
  const expStr = d.toExponential(decimals);
  const expParts = expStr.split('e');
  let mantissa = expParts[0];
  const exp = expParts[1];
  if (options.decimals === undefined) {
    mantissa = mantissa.replace(/\.?0+$/, ''); // default-trim
  }
  // normalize "-0.5" style mantissas keep sign; strip leading zeros in exponent
  const expNum = parseInt(exp, 10);
  const expClean = String(expNum);

  if (options.unicode === false) return `${mantissa}e${expClean}`;
  const sign = expNum < 0 ? '\u207b' : '';
  return `${mantissa} \u00d7 10${sign}${superscript(expClean.replace('-', ''))}`;
}

// ---------------------------------------------------------------------------
// Percentage display (DISPLAY ONLY — calculation semantics stay ratified §12.1)
// ---------------------------------------------------------------------------

export interface FormatPercentageOptions extends Omit<FormatNumberOptions, 'indianGrouping'> {
  /** Append a space between number and % sign. Default false ("55%"). */
  spaceBeforeSign?: boolean;
}

/**
 * Render a value that is already expressed IN PERCENT UNITS:
 * formatPercentage(12.5) → "12.5%". This function performs NO ×100 —
 * converting a ratio to percent is calculation logic and stays outside.
 */
export function formatPercentage(
  valueInPercentUnits: DecimalInput,
  options: FormatPercentageOptions = {}
): string {
  const body = formatNumber(valueInPercentUnits, options);
  return `${body}${options.spaceBeforeSign ? '\u00a0' : ''}%`;
}

// ---------------------------------------------------------------------------
// Currency infrastructure (generic standards-based rendering only)
// ---------------------------------------------------------------------------

export interface FormatCurrencyOptions {
  /** ISO 4217 code: USD, EUR, GBP, INR, JPY… */
  currency: string;
  /** Locale controlling symbol placement/separators. Default 'en-US'. */
  locale?: string;
  /** Override fraction digits (defaults to ISO minor-unit convention, e.g. JPY→0). */
  decimals?: number;
}

/**
 * Standards-based currency rendering via Intl.NumberFormat.
 * Values pass through Decimal first so exact decimal amounts are not
 * re-rounded by floating point before display.
 */
export function formatCurrency(value: DecimalInput, options: FormatCurrencyOptions): string {
  const d = toDecimal(value);

  // Beyond Number-safe magnitude, Intl would silently round through float.
  // Fall back to unambiguous ISO-code presentation preserving every digit.
  if (d.abs().greaterThanOrEqualTo('1e15')) {
    return `${options.currency}\u00a0${formatNumber(d, { locale: options.locale })}`;
  }
  const formatter = new Intl.NumberFormat(options.locale ?? DEFAULT_LOCALE, {
    style: 'currency',
    currency: options.currency,
    ...(options.decimals !== undefined
      ? { minimumFractionDigits: options.decimals, maximumFractionDigits: options.decimals }
      : {}),
  });
  // Boundary conversion happens once, at the Intl edge, from the exact decimal.
  return formatter.format(Number(d));
}

// ---------------------------------------------------------------------------
// Unit-value primitives (preparation for A5 Quantities — no unit engine here)
// ---------------------------------------------------------------------------

export interface FormatUnitOptions extends FormatNumberOptions {
  /** Thin space (\u2009) between value and symbol. Default true. */
  spaceBeforeSymbol?: boolean;
}

/** Attach a unit symbol to a formatted value: formatUnitValue(9.81,'m/s²') → "9.81 m/s²". */
export function formatUnitValue(
  value: DecimalInput,
  symbol: string,
  options: FormatUnitOptions = {}
): string {
  const space = options.spaceBeforeSymbol === false ? '' : '\u2009';
  return `${formatNumber(value, options)}${space}${symbol}`;
}
