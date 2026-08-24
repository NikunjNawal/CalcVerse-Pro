import { Token, Operator } from './types';

const OPERATORS: Record<Operator, { precedence: number; associativity: 'left' | 'right' }> = {
  '+': { precedence: 1, associativity: 'left' },
  '-': { precedence: 1, associativity: 'left' },
  '*': { precedence: 2, associativity: 'left' },
  '/': { precedence: 2, associativity: 'left' },
  '^': { precedence: 3, associativity: 'right' },
  '%': { precedence: 2, associativity: 'left' },
};

const FUNCTIONS = [
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'log',
  'ln',
  'sqrt',
  'abs',
  'floor',
  'ceil',
  'round',
];
const CONSTANTS = ['pi', 'e', 'π'];

const OPERATOR_ALIASES: Record<string, Operator> = {
  '×': '*',
  '÷': '/',
  '−': '-',
  '–': '-',
  '—': '-',
};

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = input.length;
  let lastTokenType: Token['type'] | null = null;

  while (i < len) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/\d/.test(ch) || ch === '.') {
      let num = '';
      let hasDot = false;
      while (i < len && (/\d/.test(input[i]) || input[i] === '.')) {
        if (input[i] === '.') {
          if (hasDot) break;
          hasDot = true;
        }
        num += input[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      lastTokenType = 'number';
      continue;
    }

    if (/[a-zA-Zπ]/.test(ch)) {
      let ident = '';
      while (i < len && /[a-zA-Zπ]/.test(input[i])) {
        ident += input[i].toLowerCase();
        i++;
      }
      if (FUNCTIONS.includes(ident)) {
        tokens.push({ type: 'function', value: ident });
        lastTokenType = 'function';
      } else if (CONSTANTS.includes(ident)) {
        tokens.push({ type: 'constant', value: ident });
        lastTokenType = 'constant';
      } else {
        throw new Error(`Unknown identifier: ${ident}`);
      }
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'paren_open', value: '(' });
      lastTokenType = 'paren_open';
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'paren_close', value: ')' });
      lastTokenType = 'paren_close';
      i++;
      continue;
    }

    const aliasOp = OPERATOR_ALIASES[ch];
    const effectiveChar = aliasOp ?? ch;

    if (
      effectiveChar === '-' &&
      (lastTokenType === null || lastTokenType === 'operator' || lastTokenType === 'paren_open')
    ) {
      tokens.push({ type: 'number', value: '-1' });
      tokens.push({ type: 'operator', value: '*', precedence: 2, associativity: 'left' });
      lastTokenType = 'operator';
      i++;
      continue;
    }

    if (
      effectiveChar === '+' &&
      (lastTokenType === null || lastTokenType === 'operator' || lastTokenType === 'paren_open')
    ) {
      i++;
      continue;
    }

    if ('+-*/^%'.includes(effectiveChar)) {
      const op = effectiveChar as Operator;
      tokens.push({
        type: 'operator',
        value: op,
        precedence: OPERATORS[op].precedence,
        associativity: OPERATORS[op].associativity,
      });
      lastTokenType = 'operator';
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${ch} at position ${i}`);
  }

  return tokens;
}
