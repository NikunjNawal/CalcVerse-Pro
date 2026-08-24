export type Operator = '+' | '-' | '*' | '/' | '^' | '%';

export interface Token {
  type: 'number' | 'operator' | 'paren_open' | 'paren_close' | 'function' | 'constant';
  value: string;
  precedence?: number;
  associativity?: 'left' | 'right';
}

export interface ASTNode {
  type: 'number' | 'binary' | 'unary' | 'function' | 'constant';
  value?: string | number;
  operator?: Operator;
  left?: ASTNode;
  right?: ASTNode;
  argument?: ASTNode;
  name?: string;
}

export interface CalculationStep {
  step: number;
  description: string;
  expression: string;
  result: string;
  rule?: string;
  isFinal?: boolean;
}

export interface CalculationResult {
  value: string;
  steps: CalculationStep[];
  ast: ASTNode;
  warnings: string[];
}

export interface OperatorDef {
  symbol: Operator;
  precedence: number;
  associativity: 'left' | 'right';
  fn: (a: Decimal, b: Decimal) => Decimal;
  description: string;
}

export interface FunctionDef {
  name: string;
  argCount: number;
  fn: (args: Decimal[]) => Decimal;
  description: string;
}

export interface ConstantDef {
  name: string;
  value: string;
  description: string;
}

export type Decimal = import('decimal.js').Decimal;
