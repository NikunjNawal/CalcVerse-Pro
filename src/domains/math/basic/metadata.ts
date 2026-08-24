// BasicCalculator METADATA — everything except the compute implementation.
// Split per CALCVERSE_MASTER_ARCHITECTURE.md §9/§37: the registry bundles this
// file eagerly for discovery/listing WITHOUT pulling calc-engine into pages
// that only display calculator information (e.g. the landing page).
// The full CalculatorDefinition (metadata + compute) lives in definition.ts.
import type { CalculatorDefinition } from '../../../registry/calculator-definition';

type BasicMetadata = Omit<CalculatorDefinition, 'compute'>;

const basicMetadata: BasicMetadata = {
  id: 'basic',
  name: 'Basic Calculator',
  category: 'mathematics',
  tags: [
    'arithmetic',
    'basic',
    'addition',
    'subtraction',
    'multiplication',
    'division',
    'percentage',
  ],
  status: 'live',

  ui: {
    kind: 'keypad',
    buttons: [
      [
        { children: 'C', variant: 'control' },
        { children: 'CE', variant: 'control' },
        { children: '±', variant: 'control' },
        { children: '÷', variant: 'operator' },
      ],
      [
        { children: '7' },
        { children: '8' },
        { children: '9' },
        { children: '×', variant: 'operator' },
      ],
      [
        { children: '4' },
        { children: '5' },
        { children: '6' },
        { children: '−', variant: 'operator' },
      ],
      [
        { children: '1' },
        { children: '2' },
        { children: '3' },
        { children: '+', variant: 'operator' },
      ],
      [
        { children: '0', size: 'lg' },
        { children: '%', variant: 'control' },
        { children: '.' },
        { children: '=', variant: 'equal' },
      ],
    ],
    keyboardMap: {
      Enter: '=',
      Backspace: 'CE',
      Escape: 'C',
      '/': '÷',
      '*': '×',
      '-': '−',
      '+': '+',
    },
  },

  formula: {
    text: 'result = expression, evaluated with standard order of operations (BODMAS)',
    variables: {
      expression: 'the sequence of numbers and operators entered',
      '%': 'percent — base-relative after + − (a±b% = a±a·b/100); fractional after × ÷ and standalone (b/100)',
    },
    source:
      'Standard arithmetic conventions; percentage semantics ratified in §12.1 of the Master Architecture.',
  },

  explanation: {
    summary:
      'Performs everyday arithmetic — addition, subtraction, multiplication, division, percentages, powers via repeated multiplication, and combined expressions — showing every intermediate step so the calculation can be followed, not just trusted.',
    assumptions: [
      'Input is a single well-formed arithmetic expression.',
      'Percentages follow the ratified keypad convention (base-relative after + and −).',
    ],
    limitations: [
      'No parentheses or scientific functions on this calculator — use the Scientific Calculator for those.',
      'Results of non-terminating division are rounded to the working precision.',
      'Multiple percentages in one expression chain against the preceding operand expression (e.g. 50 + 10% - 20% = 54), not against the running result.',
    ],
  },

  examples: [
    { name: 'Addition', inputs: { expression: '2 + 2' }, expectedOutputs: { value: '4' } },
    { name: 'Subtraction', inputs: { expression: '10 - 3' }, expectedOutputs: { value: '7' } },
    { name: 'Multiplication', inputs: { expression: '6 × 7' }, expectedOutputs: { value: '42' } },
    { name: 'Division', inputs: { expression: '20 ÷ 4' }, expectedOutputs: { value: '5' } },
    {
      name: 'Decimal precision',
      inputs: { expression: '0.1 + 0.2' },
      expectedOutputs: { value: '0.3' },
    },
    {
      name: 'Operator precedence',
      inputs: { expression: '2 + 3 × 4' },
      expectedOutputs: { value: '14' },
    },
    {
      name: 'Percent standalone (fraction)',
      inputs: { expression: '50%' },
      expectedOutputs: { value: '0.5' },
    },
    {
      name: 'Percent additive is base-relative (ratified)',
      inputs: { expression: '50 + 10%' },
      expectedOutputs: { value: '55' },
    },
    {
      name: 'Percent subtractive is base-relative',
      inputs: { expression: '50 − 10%' },
      expectedOutputs: { value: '45' },
    },
    {
      name: 'Percent multiplicative is fractional',
      inputs: { expression: '200 × 10%' },
      expectedOutputs: { value: '20' },
    },
  ],

  seo: {
    title: 'Basic Calculator with Step-by-Step Explanation | CalcVerse Pro',
    description:
      'Free online basic calculator for addition, subtraction, multiplication, division and percentages — with step-by-step explanations of every calculation.',
  },

  disclaimerLevel: 'none',
};

export default basicMetadata;
