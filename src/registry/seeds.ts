// Coming-soon registry seeds: representable as DISPLAY METADATA ONLY.
// These are NOT CalculatorDefinitions — they have no ui spec, no compute,
// no examples. They exist so the landing page can advertise planned
// calculators without pretending implementations exist (A2 requirement #7).
// When a calculator is implemented, its definition replaces the seed row
// (matched by id) and this entry is deleted.
import type { CategoryId } from './calculator-definition';

export interface SeedEntry {
  id: string;
  name: string;
  category: CategoryId;
  tags: string[];
  description: string;
}

export const seedCalculators: SeedEntry[] = [
  {
    id: 'scientific',
    name: 'Scientific Calculator',
    category: 'mathematics',
    tags: ['trigonometry', 'logarithms', 'constants', 'advanced'],
    description: 'Trigonometry, logarithms, constants, and advanced functions',
  },
  {
    id: 'fraction',
    name: 'Fraction Calculator',
    category: 'mathematics',
    tags: ['fractions', 'rational', 'simplify'],
    description: 'Add, subtract, multiply, divide fractions with simplification',
  },
  {
    id: 'quadratic',
    name: 'Quadratic Equation Solver',
    category: 'mathematics',
    tags: ['algebra', 'equations', 'roots'],
    description: 'Solve ax² + bx + c = 0 with real and complex roots',
  },
  {
    id: 'matrix',
    name: 'Matrix Calculator',
    category: 'mathematics',
    tags: ['linear-algebra', 'matrices', 'determinant'],
    description: 'Matrix operations: addition, multiplication, determinant, inverse',
  },
  {
    id: 'statistics',
    name: 'Statistics Calculator',
    category: 'mathematics',
    tags: ['statistics', 'probability', 'regression'],
    description: 'Mean, median, mode, standard deviation, regression, distributions',
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    category: 'conversion',
    tags: ['conversion', 'units', 'measurement'],
    description: 'Length, area, volume, mass, temperature, speed, and more',
  },
  {
    id: 'bmi',
    name: 'BMI Calculator',
    category: 'health',
    tags: ['health', 'fitness', 'body-mass'],
    description: 'Body Mass Index with category and health insights',
  },
  {
    id: 'compound-interest',
    name: 'Compound Interest',
    category: 'finance',
    tags: ['investment', 'savings', 'interest'],
    description: 'Investment growth with regular contributions',
  },
  {
    id: 'loan-emi',
    name: 'Loan EMI Calculator',
    category: 'finance',
    tags: ['loan', 'mortgage', 'emi', 'amortization'],
    description: 'Monthly payments, total interest, amortization schedule',
  },
];
