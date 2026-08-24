// Generic bootstrap for ALL generated calculator pages (A3).
// The page declares its identity via <meta name="calculator-id">; this module
// lazily loads that calculator's definition and hands it to the domain's
// mount module. Only the requested calculator's implementation is imported —
// pages stay code-split per §7 of the A3 spec.
import { initTheme } from '@theme';
import type { CalculatorConfig } from './CalculatorBase';
import type { CalculatorDefinition } from './registry/calculator-definition';
import { loadDefinition } from './registry';
import './styles/main.css';

const mountModules = import.meta.glob<{
  default: (container: HTMLElement, def: CalculatorDefinition, config: CalculatorConfig) => void;
}>('./domains/**/mount.ts', { eager: false });

async function boot(): Promise<void> {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear().toString();

  initTheme();

  const id = document.querySelector('meta[name="calculator-id"]')?.getAttribute('content');
  const container = document.getElementById('calculator-app');
  if (!id || !container) {
    console.error('[calculator] page is missing calculator-id meta or #calculator-app container');
    return;
  }

  const mountKey = Object.keys(mountModules).find(key => key.includes(`/${id}/mount.ts`));
  if (!mountKey) {
    console.error(`[calculator] no mount module found for "${id}"`);
    return;
  }

  // Parallel loads: mount module + keypad adapter + full definition.
  const [mountMod, configMod, def] = await Promise.all([
    mountModules[mountKey](),
    import('./calculators/keypadConfig'),
    loadDefinition(id),
  ]);

  const config: CalculatorConfig = configMod.keypadConfigFromMetadata(def);
  mountMod.default(container, def, config);
}

void boot();
