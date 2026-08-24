import { Token, ASTNode, Operator } from './types';

export function parse(tokens: Token[]): ASTNode {
  const output: ASTNode[] = [];
  const operators: Token[] = [];

  function popOperator() {
    const op = operators.pop()!;
    const right = output.pop()!;
    const left = output.pop()!;
    output.push({
      type: 'binary',
      operator: op.value as Operator,
      left,
      right,
    });
  }

  function popFunction() {
    const func = operators.pop()!;
    const arg = output.pop()!;
    output.push({
      type: 'function',
      name: func.value,
      argument: arg,
    });
  }

  for (const token of tokens) {
    switch (token.type) {
      case 'number':
        output.push({ type: 'number', value: token.value });
        break;

      case 'constant':
        output.push({ type: 'constant', value: token.value });
        break;

      case 'function':
        operators.push(token);
        break;

      case 'paren_open':
        operators.push(token);
        break;

      case 'paren_close':
        while (operators.length > 0 && operators[operators.length - 1].type !== 'paren_open') {
          if (operators[operators.length - 1].type === 'function') {
            popFunction();
          } else {
            popOperator();
          }
        }
        if (operators.length === 0) {
          throw new Error('Mismatched parentheses');
        }
        operators.pop(); // Remove '('
        if (operators.length > 0 && operators[operators.length - 1].type === 'function') {
          popFunction();
        }
        break;

      case 'operator':
        while (
          operators.length > 0 &&
          operators[operators.length - 1].type === 'operator' &&
          ((token.associativity === 'left' &&
            token.precedence! <= operators[operators.length - 1].precedence!) ||
            (token.associativity === 'right' &&
              token.precedence! < operators[operators.length - 1].precedence!))
        ) {
          popOperator();
        }
        operators.push(token);
        break;
    }
  }

  while (operators.length > 0) {
    const op = operators[operators.length - 1];
    if (op.type === 'paren_open' || op.type === 'paren_close') {
      throw new Error('Mismatched parentheses');
    }
    if (op.type === 'function') {
      popFunction();
    } else {
      popOperator();
    }
  }

  if (output.length !== 1) {
    throw new Error('Invalid expression');
  }

  return output[0];
}
