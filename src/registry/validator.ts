// Registry validation for CalculatorDefinition v2 (§9).
// Pure functions — usable from Vite-compiled app code AND Node scripts.
// Every error identifies calculator path + field + reason.
import type { CalculatorDefinition } from './calculator-definition';

export type BasicMetadata = Omit<CalculatorDefinition, 'compute'>;

export interface ValidationError {
  /** Source file / identifier of the offending definition. */
  path: string;
  /** Field that failed (dot-notation for nested fields). */
  field: string;
  /** Human-readable reason. */
  message: string;
}

const CATEGORY_IDS = [
  'mathematics',
  'conversion',
  'date-time',
  'everyday',
  'health',
  'finance',
  'business',
  'tax',
  'physics',
  'chemistry',
  'engineering',
  'computing',
  'data-science',
] as const;

const STATUSES = ['live', 'coming-soon'] as const;
const DISCLAIMER_LEVELS = ['none', 'health', 'financial', 'tax'] as const;

export function validateMetadata(meta: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const fail = (field: string, message: string) => errors.push({ path, field, message });

  if (meta === null || typeof meta !== 'object') {
    fail('', 'definition must be an object');
    return errors;
  }
  const m = meta as Record<string, unknown>;

  if (typeof m.id !== 'string' || m.id.trim() === '')
    fail('id', 'id is required and must be a non-empty string');
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.id)) fail('id', `id "${m.id}" must be kebab-case`);

  if (typeof m.name !== 'string' || m.name.trim() === '')
    fail('name', 'name is required and must be a non-empty string');

  if (typeof m.category !== 'string' || !(CATEGORY_IDS as readonly string[]).includes(m.category)) {
    fail('category', `category must be one of: ${CATEGORY_IDS.join(', ')}`);
  }

  if (
    !Array.isArray(m.tags) ||
    m.tags.length === 0 ||
    !m.tags.every((t: unknown) => typeof t === 'string' && t.trim() !== '')
  ) {
    fail('tags', 'tags must be a non-empty array of non-empty strings');
  }

  if (typeof m.status !== 'string' || !(STATUSES as readonly string[]).includes(m.status)) {
    fail('status', `status must be one of: ${STATUSES.join(', ')}`);
  }

  validateUiSpec(m.ui, fail);
  validateFormula(m.formula, fail);
  validateExamples(m.examples, fail);

  const seo = m.seo;
  if (seo === null || typeof seo !== 'object') {
    fail('seo', 'seo is required');
  } else {
    const s = seo as Record<string, unknown>;
    if (typeof s.title !== 'string' || s.title.trim() === '')
      fail('seo.title', 'seo.title is required');
    if (typeof s.description !== 'string' || s.description.trim() === '') {
      fail('seo.description', 'seo.description is required');
    }
  }

  if (m.disclaimerLevel !== undefined) {
    if (
      typeof m.disclaimerLevel !== 'string' ||
      !(DISCLAIMER_LEVELS as readonly string[]).includes(m.disclaimerLevel)
    ) {
      fail('disclaimerLevel', `disclaimerLevel must be one of: ${DISCLAIMER_LEVELS.join(', ')}`);
    }
  }

  return errors;
}

export function validateDefinition(def: unknown, path: string): ValidationError[] {
  const errors = validateMetadata(def, path);
  if (def !== null && typeof def === 'object') {
    const d = def as Record<string, unknown>;
    if (typeof d.compute !== 'function') {
      errors.push({ path, field: 'compute', message: 'compute must be a function' });
    }
  }
  return errors;
}

function validateUiSpec(ui: unknown, fail: (f: string, m: string) => void): void {
  if (ui === null || typeof ui !== 'object') {
    fail('ui', 'ui specification is required');
    return;
  }
  const u = ui as Record<string, unknown>;

  if (u.kind === 'keypad') {
    if (!Array.isArray(u.buttons) || u.buttons.length === 0) {
      fail('ui.buttons', 'keypad ui requires a non-empty buttons array');
      return;
    }
    u.buttons.forEach((row: unknown, i: number) => {
      if (
        !Array.isArray(row) ||
        row.length === 0 ||
        !row.every(
          (b: unknown) =>
            b !== null &&
            typeof b === 'object' &&
            typeof (b as Record<string, unknown>).children === 'string'
        )
      ) {
        fail(
          `ui.buttons[${i}]`,
          'each button row must be a non-empty array of { children: string } objects'
        );
      }
    });
    if (
      u.keyboardMap === null ||
      typeof u.keyboardMap !== 'object' ||
      Array.isArray(u.keyboardMap)
    ) {
      fail('ui.keyboardMap', 'keypad ui requires a keyboardMap object');
    }
    return;
  }

  if (u.kind === 'form') {
    if (!Array.isArray(u.inputs)) {
      fail('ui.inputs', 'form ui requires an inputs array');
      return;
    }
    u.inputs.forEach((input: unknown, i: number) => {
      const inp = input as Record<string, unknown> | null;
      if (
        inp === null ||
        typeof inp !== 'object' ||
        typeof inp.id !== 'string' ||
        inp.id === '' ||
        typeof inp.label !== 'string' ||
        !['number', 'text', 'select'].includes(inp.type as string)
      ) {
        fail(
          `ui.inputs[${i}]`,
          'each field requires { id: string, label: string, type: number|text|select }'
        );
      }
    });
    return;
  }

  fail('ui.kind', "ui.kind must be 'keypad' or 'form'");
}

function validateFormula(formula: unknown, fail: (f: string, m: string) => void): void {
  if (formula === null || typeof formula !== 'object') {
    fail('formula', 'formula is required');
    return;
  }
  const f = formula as Record<string, unknown>;
  if (typeof f.text !== 'string' || f.text.trim() === '')
    fail('formula.text', 'formula.text is required');
}

function validateExamples(examples: unknown, fail: (f: string, m: string) => void): void {
  if (!Array.isArray(examples) || examples.length === 0) {
    fail('examples', 'at least one worked example is required');
    return;
  }
  examples.forEach((ex: unknown, i: number) => {
    const e = ex as Record<string, unknown> | null;
    if (
      e === null ||
      typeof e !== 'object' ||
      typeof e.name !== 'string' ||
      e.name === '' ||
      e.inputs === null ||
      typeof e.inputs !== 'object' ||
      e.expectedOutputs === null ||
      typeof e.expectedOutputs !== 'object'
    ) {
      fail(
        `examples[${i}]`,
        'each example requires { name: string, inputs: object, expectedOutputs: object }'
      );
    }
  });
}

/** Validate uniqueness across a set of definitions/entries. */
export function validateUniqueIdentities(
  entries: { id?: unknown; path: string }[]
): ValidationError[] {
  const seen = new Map<string, string>();
  const errors: ValidationError[] = [];
  for (const entry of entries) {
    if (typeof entry.id !== 'string') continue;
    const existing = seen.get(entry.id);
    if (existing) {
      errors.push({
        path: entry.path,
        field: 'id',
        message: `duplicate id "${entry.id}" — already defined at ${existing}`,
      });
    } else {
      seen.set(entry.id, entry.path);
    }
  }
  return errors;
}
