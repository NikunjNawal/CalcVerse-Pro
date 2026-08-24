// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  discoverMetadataFiles,
  validateTree,
  renderCalculatorPage,
  renderLegacyRedirect,
  renderSitemap,
  calculatorRoute,
  absoluteUrl,
} from './lib/generator';
import type { BasicMetadata } from '../src/registry/validator';

const validMetadata: BasicMetadata = {
  id: 'fixture-calc',
  name: 'Fixture Calculator',
  category: 'mathematics',
  tags: ['fixture'],
  status: 'live',
  ui: {
    kind: 'keypad',
    buttons: [[{ children: '1' }]],
    keyboardMap: { Enter: '=' },
  },
  formula: { text: 'a + b' },
  examples: [{ name: 'add', inputs: { expression: '1 + 1' }, expectedOutputs: { value: '2' } }],
  seo: {
    title: 'Fixture Calculator | CalcVerse Pro',
    description: 'Fixture description for tests.',
  },
};

function writeDefinitionFixture(
  dir: string,
  id: string,
  meta: Partial<BasicMetadata>,
  withDefinition: boolean
): string {
  const calcDir = path.join(dir, id);
  fs.mkdirSync(calcDir, { recursive: true });
  const full = { ...validMetadata, id, ...meta };
  const metaFile = path.join(calcDir, 'metadata.ts');
  fs.writeFileSync(
    metaFile,
    `import type { BasicMetadata } from '../../../../src/registry/validator';\n` +
      `const m: BasicMetadata = ${JSON.stringify(full)} as BasicMetadata;\nexport default m;\n`
  );
  if (withDefinition) {
    fs.writeFileSync(
      path.join(calcDir, 'definition.ts'),
      `import type { CalculatorDefinition } from '../../../../src/registry/calculator-definition';\n` +
        `import m from './metadata';\n` +
        `const d: CalculatorDefinition = { ...m, compute: (s: string) => ({ value: s, steps: [], warnings: [] }) };\n` +
        `export default d;\n`
    );
  }
  return metaFile;
}

describe('A3 discovery', () => {
  let tmp: string;
  beforeAll(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'calcverse-a3-'));
    writeDefinitionFixture(tmp, 'alpha', {}, true);
    writeDefinitionFixture(tmp, 'beta', { status: 'coming-soon' }, false);
  });
  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it('discovers metadata files across the domain tree', () => {
    const files = discoverMetadataFiles(tmp).map(f => f.path.split(path.sep).pop());
    expect(files).toContain('metadata.ts');
  });

  it('whole-tree validation passes a complete live definition', async () => {
    const files = discoverMetadataFiles(tmp).filter(f =>
      f.path.includes(path.join('alpha', 'metadata.ts'))
    );
    const meta = await import(files[0].absolutePath);
    const { errors, valid } = await validateTree([
      { meta: meta.default, path: files[0].path, absoluteDir: path.dirname(files[0].absolutePath) },
    ]);
    expect(errors).toEqual([]);
    expect(valid).toHaveLength(1);
  });

  it('live calculator WITHOUT a definition module fails validation', async () => {
    const files = discoverMetadataFiles(tmp).filter(f =>
      f.path.includes(path.join('beta', 'metadata.ts'))
    );
    const meta = await import(files[0].absolutePath);
    // beta is coming-soon without definition — allowed. Force status=live to prove the rule:
    const forced = { ...meta.default, status: 'live' as const };
    const betaFile = discoverMetadataFiles(tmp).find(f =>
      f.path.includes(path.join('beta', 'metadata.ts'))
    )!;
    const { errors } = await validateTree([
      { meta: forced, path: betaFile.path, absoluteDir: path.dirname(betaFile.absolutePath) },
    ]);
    expect(
      errors.some(e => e.field === 'definition' && /missing its definition module/.test(e.message))
    ).toBe(true);
  });

  it('invalid metadata field fails validation', async () => {
    const bad = { ...validMetadata, seo: { title: '', description: '' } };
    const { errors } = await validateTree([{ meta: bad as BasicMetadata, path: 'x/metadata.ts' }]);
    expect(errors.some(e => e.field === 'seo.title')).toBe(true);
  });

  it('duplicate ids fail validation', async () => {
    const loaded = [
      { meta: validMetadata, path: 'a/metadata.ts' },
      { meta: validMetadata, path: 'b/metadata.ts' },
    ];
    const { errors } = await validateTree(loaded);
    expect(errors.some(e => e.field === 'id' && /duplicate/.test(e.message))).toBe(true);
  });
});

describe('A3 page generation', () => {
  const page = renderCalculatorPage(validMetadata);

  it('uses the architecture route convention', () => {
    expect(page.file).toBe('calculators/fixture-calc.html');
    expect(calculatorRoute('fixture-calc')).toBe('calculators/fixture-calc.html');
  });

  it('embeds calculator identity and SEO from metadata', () => {
    expect(page.html).toContain('<title>Fixture Calculator | CalcVerse Pro</title>');
    expect(page.html).toContain('content="Fixture description for tests."');
    expect(page.html).toContain(
      'rel="canonical" href="https://nikunjnawal.github.io/CalcVerse-Pro/calculators/fixture-calc.html"'
    );
    expect(page.html).toContain('<meta name="calculator-id" content="fixture-calc" />');
    expect(page.html).toContain('og:title');
    expect(page.html).toContain('"@type":"WebApplication"');
  });

  it('prerenders no-JS content (formula/explanation) per §24.2', () => {
    expect(page.html).toContain('About this calculator');
    expect(page.html).toContain('<strong>a + b</strong>');
  });

  it('points at the generic runtime bootstrap', () => {
    expect(page.html).toContain('/src/main-calculator.ts');
  });

  it('escapes HTML in metadata strings', () => {
    const hostile = renderCalculatorPage({
      ...validMetadata,
      name: '<script>x</script>',
    });
    expect(hostile.html).not.toContain('<script>x</script>');
    expect(hostile.html).toContain('&lt;script&gt;');
  });

  it('builds absolute URLs correctly', () => {
    expect(absoluteUrl('calculators/basic.html')).toBe(
      'https://nikunjnawal.github.io/CalcVerse-Pro/calculators/basic.html'
    );
  });
});

describe('A3 legacy redirect + sitemap', () => {
  it('renders legacy redirect toward new route', () => {
    const r = renderLegacyRedirect('basic', 'basic-calculator.html');
    expect(r.isRedirect).toBe(true);
    expect(r.html).toContain('url=calculators/basic.html');
    expect(r.html).toContain('rel="canonical"');
  });

  it('sitemap includes landing + live routes, deduplicated', () => {
    const xml = renderSitemap(['calculators/basic.html', 'calculators/basic.html']);
    expect(xml).toContain('<loc>https://nikunjnawal.github.io/CalcVerse-Pro/</loc>');
    expect(xml.match(/<loc>/g)).toHaveLength(2); // landing + deduped basic
  });

  it('sitemap excludes routes not passed in (coming-soon filtered upstream)', () => {
    const xml = renderSitemap([]);
    expect(xml).not.toContain('calculators/');
    expect(xml).toContain('<loc>https://nikunjnawal.github.io/CalcVerse-Pro/</loc>');
  });
});
