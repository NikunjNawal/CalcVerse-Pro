module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
  },
  overrides: [
    {
      // Purity enforcement §8.2 (CALCVERSE_MASTER_ARCHITECTURE.md):
      // compute layers must be deterministic, side-effect-free, DOM-free.
      files: ['src/domains/**/compute.ts'],
      env: { browser: false, node: false },
      rules: {
        'no-restricted-globals': [
          'error',
          { name: 'document', message: 'compute.ts must be pure — no DOM access (§8.2).' },
          { name: 'window', message: 'compute.ts must be pure — no browser globals (§8.2).' },
          { name: 'localStorage', message: 'compute.ts must be pure — no storage access (§8.2).' },
          { name: 'navigator', message: 'compute.ts must be pure — no browser globals (§8.2).' },
          { name: 'fetch', message: 'compute.ts must be pure — no network access (§8.2).' },
        ],
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@ui', '@ui/*', '@theme', '@theme/*'],
                message: 'compute.ts may not import UI or theme packages (layer rule §5).',
              },
              {
                group: ['**/CalculatorBase', '**/calculators/**', '**/ui-components/**'],
                message: 'compute.ts may not import UI code (layer rule §5).',
              },
            ],
          },
        ],
      },
    },
    {
      // Quantities layer (A5): pure calculation infrastructure. No UI/theme/
      // format/engine imports (uses decimal.js directly), no browser globals.
      files: ['packages/quantities/**/*.ts'],
      env: { browser: false, node: false },
      rules: {
        'no-restricted-globals': [
          'error',
          { name: 'document', message: 'quantities must be framework-independent — no DOM.' },
          { name: 'window', message: 'quantities must be framework-independent — no browser globals.' },
          { name: 'localStorage', message: 'quantities must not access storage.' },
          { name: 'navigator', message: 'quantities must not access navigator.' },
          { name: 'fetch', message: 'quantities must not make network calls.' }
        ],
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@ui', '@ui/*', '@theme', '@theme/*', '@calc-engine', '@calc-engine/*', '@format', '@format/*'],
                message: 'quantities depends only on decimal.js; presentation/UI stay above this layer.'
              }
            ]
          }
        ]
      }
    },
    {
      // Formatting layer is presentation-only (A4): no UI/theme/engine imports,
      // no browser globals. Runs identically in Node tests and browser bundles.
      files: ['packages/format/**/*.ts'],
      env: { browser: false, node: false },
      rules: {
        'no-restricted-globals': [
          'error',
          { name: 'document', message: 'format layer must be presentation-only — no DOM (§6).' },
          { name: 'window', message: 'format layer must be presentation-only — no browser globals.' },
          { name: 'localStorage', message: 'format layer must not access storage.' },
          { name: 'navigator', message: 'format layer must not access navigator.' }
        ],
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@ui', '@ui/*', '@theme', '@theme/*', '@calc-engine', '@calc-engine/*'],
                message: 'format layer is independent of UI, theme and calculation packages.'
              }
            ]
          }
        ]
      }
    },
    {
      // Purity tripwire §8.2 layer 3 (companion): compute tests are pinned to the
      // Node environment via vitest.config.ts environmentMatchGlobs, where any
      // DOM/localStorage access inside compute would throw. Enforcement lives in
      // vitest config because comments are not AST nodes and cannot be
      // selector-matched by ESLint.
      files: ['src/domains/**/compute.test.ts'],
      rules: {},
    },
  ],
};
