// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { validateMetadata, validateDefinition, validateUniqueIdentities } from './validator';
import type { BasicMetadata } from './validator';

// Minimal valid metadata fixture — tests mutate one field at a time.
const validMetadata: BasicMetadata = {
  id: 'test-calc',
  name: 'Test Calculator',
  category: 'mathematics',
  tags: ['test'],
  status: 'live',
  ui: {
    kind: 'keypad',
    buttons: [[{ children: '1' }]],
    keyboardMap: { Enter: '=' },
  },
  formula: { text: 'a + b' },
  examples: [
    { name: 'addition', inputs: { expression: '1 + 1' }, expectedOutputs: { value: '2' } },
  ],
  seo: { title: 'Test', description: 'A test calculator' },
};

describe('registry validator — valid definition', () => {
  it('accepts a complete valid metadata object', () => {
    expect(validateMetadata(validMetadata, 'test/metadata.ts')).toEqual([]);
  });

  it('accepts a full definition with compute', () => {
    const def = {
      ...validMetadata,
      compute: (s: string) => ({ value: s, steps: [], warnings: [] }),
    };
    expect(validateDefinition(def, 'test/definition.ts')).toEqual([]);
  });
});

describe('registry validator — required fields', () => {
  it('rejects missing id', () => {
    const { id, ...rest } = validMetadata;
    const errors = validateMetadata(rest, 'x');
    expect(errors).toContainEqual(expect.objectContaining({ field: 'id' }));
  });

  it('rejects missing name', () => {
    const { name, ...rest } = validMetadata;
    const errors = validateMetadata(rest, 'x');
    expect(errors.some(e => e.field === 'name')).toBe(true);
  });

  it('rejects missing compute on a full definition', () => {
    const errors = validateDefinition(validMetadata, 'x');
    expect(errors.some(e => e.field === 'compute')).toBe(true);
  });

  it('rejects missing formula', () => {
    const { formula, ...rest } = validMetadata;
    const errors = validateMetadata(rest, 'x');
    expect(errors.some(e => e.field === 'formula')).toBe(true);
  });

  it('rejects empty examples', () => {
    const errors = validateMetadata({ ...validMetadata, examples: [] }, 'x');
    expect(errors.some(e => e.field === 'examples')).toBe(true);
  });

  it('rejects missing SEO title/description', () => {
    const errors = validateMetadata({ ...validMetadata, seo: { title: '', description: '' } }, 'x');
    expect(errors.some(e => e.field === 'seo.title')).toBe(true);
    expect(errors.some(e => e.field === 'seo.description')).toBe(true);
  });
});

describe('registry validator — value constraints', () => {
  it('rejects invalid category', () => {
    const errors = validateMetadata({ ...validMetadata, category: 'cooking' }, 'x');
    expect(errors.some(e => e.field === 'category')).toBe(true);
  });

  it('rejects invalid status', () => {
    const errors = validateMetadata({ ...validMetadata, status: 'maybe' }, 'x');
    expect(errors.some(e => e.field === 'status')).toBe(true);
  });

  it('rejects invalid disclaimerLevel when supplied', () => {
    const errors = validateMetadata({ ...validMetadata, disclaimerLevel: 'legal' }, 'x');
    expect(errors.some(e => e.field === 'disclaimerLevel')).toBe(true);
  });

  it('rejects non-kebab-case id', () => {
    const errors = validateMetadata({ ...validMetadata, id: 'Bad_ID' }, 'x');
    expect(errors.some(e => e.field === 'id')).toBe(true);
  });
});

describe('registry validator — UI discriminated union', () => {
  it('rejects unknown ui.kind', () => {
    const errors = validateMetadata({ ...validMetadata, ui: { kind: 'hologram' } }, 'x');
    expect(errors.some(e => e.field === 'ui.kind')).toBe(true);
  });

  it('rejects keypad with empty buttons', () => {
    const errors = validateMetadata(
      { ...validMetadata, ui: { kind: 'keypad', buttons: [], keyboardMap: {} } },
      'x'
    );
    expect(errors.some(e => e.field === 'ui.buttons')).toBe(true);
  });

  it('rejects form with malformed inputs', () => {
    const errors = validateMetadata(
      { ...validMetadata, ui: { kind: 'form', inputs: [{ label: 'no id or type' }] } },
      'x'
    );
    expect(errors.some(e => e.field.startsWith('ui.inputs'))).toBe(true);
  });
});

describe('registry validator — duplicate identities', () => {
  it('flags duplicate ids with both paths', () => {
    const errors = validateUniqueIdentities([
      { id: 'basic', path: 'src/domains/math/basic/metadata.ts' },
      { id: 'basic', path: 'src/domains/math/elsewhere/metadata.ts' },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('basic');
    expect(errors[0].message).toContain('src/domains/math/basic/metadata.ts');
  });

  it('passes unique ids', () => {
    expect(
      validateUniqueIdentities([
        { id: 'a', path: 'p/a' },
        { id: 'b', path: 'p/b' },
      ])
    ).toEqual([]);
  });
});

describe('registry — live discovery & API', () => {
  // Imports the real registry; its module-level validation must have passed.
  it('discovers basic automatically from the domain tree', async () => {
    const { getMetadata, getAllCalculators } = await import('./index');
    const meta = getMetadata('basic');
    expect(meta).toBeDefined();
    expect(meta!.name).toBe('Basic Calculator');
    expect(meta!.status).toBe('live');

    const all = getAllCalculators();
    expect(all.some(e => e.id === 'basic' && e.status === 'live')).toBe(true);
  });

  it('exposes coming-soon seeds without definitions or published pages', async () => {
    const { getComingSoonCalculators, getMetadata } = await import('./index');
    const soon = getComingSoonCalculators();
    expect(soon.length).toBeGreaterThan(0);
    for (const entry of soon) {
      expect(getMetadata(entry.id)).toBeUndefined(); // no implementation pretence
      expect(entry.path).toBe(''); // unpublished — A3 generates pages for live only
    }
  });

  it('marks featured entries', async () => {
    const { getFeaturedCalculators } = await import('./index');
    const featured = getFeaturedCalculators();
    expect(featured.some(e => e.id === 'basic')).toBe(true);
    expect(featured.every(e => e.featured)).toBe(true);
  });

  it('loads the full definition lazily with working compute', async () => {
    const { loadDefinition } = await import('./index');
    const def = await loadDefinition('basic');
    expect(def.compute('50 + 10%').value).toBe('55'); // ratified semantics intact
  });

  it('throws for unknown calculator load', async () => {
    const { loadDefinition } = await import('./index');
    await expect(loadDefinition('does-not-exist')).rejects.toThrow(/No definition found/);
  });

  it('sources listing metadata from the definition side (single source of truth)', async () => {
    const { getMetadata } = await import('./index');
    const meta = getMetadata('basic')!;
    // Import raw metadata module and confirm the registry serves its exact
    // content (spread + path annotation only — no re-declared copy).
    const raw = (await import('../domains/math/basic/metadata')).default;
    expect(meta).toEqual({ ...raw, path: 'src/domains/math/basic/metadata.ts' });
    expect(meta.tags).toBe(raw.tags); // same array reference — not duplicated
  });
});
