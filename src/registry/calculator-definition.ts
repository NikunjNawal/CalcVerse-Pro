// CalculatorDefinition contract v2 — ratified in CALCVERSE_MASTER_ARCHITECTURE.md §8.
// This is the single authoritative definition schema. Do not create competing schemas.
import type { CalculationStep } from '@calc-engine';

export type CategoryId =
  | 'mathematics'
  | 'conversion'
  | 'date-time'
  | 'everyday'
  | 'health'
  | 'finance'
  | 'business'
  | 'tax'
  | 'physics'
  | 'chemistry'
  | 'engineering'
  | 'computing'
  | 'data-science';

export type DisclaimerLevel = 'none' | 'health' | 'financial' | 'tax';

export type DefinitionStatus = 'live' | 'coming-soon';

export interface Warning {
  code: string;
  message: string;
  severity: 'info' | 'warning';
}

export interface CalcOutput {
  value: string;
  steps: CalculationStep[];
  warnings: Warning[];
}

export type InputRecord = Record<string, string | number>;

// Minimal FieldSpec shape for the v2 contract. Rendering (FormShell) is Phase A/A6 —
// defining only the data shape here; no form implementation exists at this stage.
export interface FieldSpec {
  id: string;
  label: string;
  type: 'number' | 'text' | 'select';
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  helpText?: string;
}

export interface WorkedExample {
  name: string;
  inputs: InputRecord;
  expectedOutputs: Record<string, string>;
}

export interface KeypadButtonSpec {
  children: string;
  variant?: 'primary' | 'secondary' | 'operator' | 'control' | 'equal' | 'scientific' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}

export interface KeypadSpec {
  buttons: KeypadButtonSpec[][];
  keyboardMap: Record<string, string>;
}

export type UiSpec =
  | ({ kind: 'form' } & { inputs: FieldSpec[]; submitLabel?: string })
  | ({ kind: 'keypad' } & KeypadSpec);

export interface FormulaSpec {
  text: string;
  variables?: Record<string, string>;
  source?: string;
}

export interface ExplanationSpec {
  summary: string;
  assumptions?: string[];
  limitations?: string[];
}

export interface SeoMeta {
  title: string;
  description: string;
}

export interface CalculatorDefinition {
  /** Stable identifier. Never renamed after publication (URLs depend on it). */
  id: string;
  name: string;
  category: CategoryId;
  tags: string[];
  status: DefinitionStatus;
  ui: UiSpec;
  /**
   * Pure calculation function (§8.2): deterministic, no side effects, no I/O,
   * no DOM. Keypad definitions accept the raw expression string; form
   * definitions will accept an InputRecord once FormShell exists.
   */
  compute: (input: string | InputRecord) => CalcOutput;
  formula: FormulaSpec;
  explanation?: ExplanationSpec;
  /** At least one example required by registry validation (A2 enforces). */
  examples: WorkedExample[];
  seo: SeoMeta;
  disclaimerLevel?: DisclaimerLevel;
}
