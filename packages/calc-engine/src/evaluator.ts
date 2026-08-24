import { ASTNode, Operator, CalculationResult, CalculationStep } from './types';
import { tokenize } from './tokenizer';
import { parse } from './parser';
import Decimal from 'decimal.js';

Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP, toExpNeg: -20, toExpPos: 40 });

const CONSTANTS: Record<string, Decimal> = {
  pi: new Decimal(Math.PI),
  π: new Decimal(Math.PI),
  e: new Decimal(Math.E),
};

const OPERATORS: Record<Operator, (a: Decimal, b: Decimal) => Decimal> = {
  '+': (a, b) => a.plus(b),
  '-': (a, b) => a.minus(b),
  '*': (a, b) => a.times(b),
  '/': (a, b) => {
    if (b.isZero()) throw new Error('Division by zero');
    return a.div(b);
  },
  '^': (a, b) => a.pow(b),
  '%': (a, b) => a.mod(b),
};

const FUNCTIONS: Record<string, (args: Decimal[]) => Decimal> = {
  sin: ([x]) => new Decimal(Math.sin(x.toNumber())),
  cos: ([x]) => new Decimal(Math.cos(x.toNumber())),
  tan: ([x]) => new Decimal(Math.tan(x.toNumber())),
  asin: ([x]) => new Decimal(Math.asin(x.toNumber())),
  acos: ([x]) => new Decimal(Math.acos(x.toNumber())),
  atan: ([x]) => new Decimal(Math.atan(x.toNumber())),
  log: ([x]) => new Decimal(Math.log10(x.toNumber())),
  ln: ([x]) => new Decimal(Math.log(x.toNumber())),
  sqrt: ([x]) => {
    if (x.isNegative()) throw new Error('Square root of negative number');
    return new Decimal(Math.sqrt(x.toNumber()));
  },
  abs: ([x]) => x.abs(),
  floor: ([x]) => new Decimal(Math.floor(x.toNumber())),
  ceil: ([x]) => new Decimal(Math.ceil(x.toNumber())),
  round: ([x]) => new Decimal(Math.round(x.toNumber())),
};

function formatDecimal(d: Decimal): string {
  if (d.isNaN()) return 'NaN';
  if (!d.isFinite()) return d.isNegative() ? '-Infinity' : 'Infinity';
  const str = d.toFixed(10).replace(/\.?0+$/, '');
  return str || '0';
}

export function evaluate(node: ASTNode): Decimal {
  switch (node.type) {
    case 'number':
      return new Decimal(node.value as string);
    case 'constant':
      return CONSTANTS[node.value as string] || new Decimal(0);
    case 'binary':
      if (!node.operator || !node.left || !node.right) throw new Error('Invalid binary node');
      return OPERATORS[node.operator](evaluate(node.left), evaluate(node.right));
    case 'unary':
      if (!node.argument) throw new Error('Invalid unary node');
      return evaluate(node.argument).negated();
    case 'function': {
      if (!node.name || !node.argument) throw new Error('Invalid function node');
      const fn = FUNCTIONS[node.name];
      if (!fn) throw new Error(`Unknown function: ${node.name}`);
      return fn([evaluate(node.argument)]);
    }
    default:
      throw new Error(`Unknown node type: ${(node as ASTNode).type}`);
  }
}

export function generateSteps(node: ASTNode): CalculationStep[] {
  const steps: CalculationStep[] = [];
  let stepNum = 0;

  function walk(n: ASTNode): Decimal {
    if (n.type === 'number' || n.type === 'constant') {
      return evaluate(n);
    }

    if (n.type === 'binary' && n.operator && n.left && n.right) {
      const leftVal = walk(n.left);
      const rightVal = walk(n.right);
      const result = OPERATORS[n.operator](leftVal, rightVal);

      stepNum++;
      steps.push({
        step: stepNum,
        description: `${formatDecimal(leftVal)} ${n.operator} ${formatDecimal(rightVal)} = ${formatDecimal(result)}`,
        expression: `${formatDecimal(leftVal)} ${n.operator} ${formatDecimal(rightVal)}`,
        result: formatDecimal(result),
        rule: getOperatorRule(n.operator),
      });

      return result;
    }

    if (n.type === 'function' && n.name && n.argument) {
      const argVal = walk(n.argument);
      const result = FUNCTIONS[n.name]([argVal]);

      stepNum++;
      steps.push({
        step: stepNum,
        description: `${n.name}(${formatDecimal(argVal)}) = ${formatDecimal(result)}`,
        expression: `${n.name}(${formatDecimal(argVal)})`,
        result: formatDecimal(result),
        rule: `Function: ${n.name}`,
      });

      return result;
    }

    if (n.type === 'unary' && n.argument) {
      const argVal = walk(n.argument);
      const result = argVal.negated();

      stepNum++;
      steps.push({
        step: stepNum,
        description: `-${formatDecimal(argVal)} = ${formatDecimal(result)}`,
        expression: `-${formatDecimal(argVal)}`,
        result: formatDecimal(result),
        rule: 'Negation',
      });

      return result;
    }

    throw new Error(`Unknown node type in step generation: ${(n as ASTNode).type}`);
  }

  walk(node);
  return steps;
}

function getOperatorRule(op: Operator): string {
  const rules: Record<Operator, string> = {
    '+': 'Addition',
    '-': 'Subtraction',
    '*': 'Multiplication',
    '/': 'Division',
    '^': 'Exponentiation',
    '%': 'Modulo',
  };
  return rules[op] ?? 'Operation';
}

export function calculate(input: string): CalculationResult {
  const tokens = tokenize(input);
  const ast = parse(tokens);
  const warnings: string[] = [];

  let value: Decimal;
  try {
    value = evaluate(ast);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Calculation error');
  }

  const steps = generateSteps(ast);

  steps.push({
    step: steps.length + 1,
    description: `Final Answer: ${formatDecimal(value)}`,
    expression: input,
    result: formatDecimal(value),
    rule: 'Result',
    isFinal: true,
  });

  return {
    value: formatDecimal(value),
    steps,
    ast,
    warnings,
  };
}
