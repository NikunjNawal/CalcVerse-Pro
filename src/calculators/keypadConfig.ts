// UI-layer adaptation: registry metadata → CalculatorBase keypad config.
// Lives in the calculator layer (not the registry) because it exists purely
// to satisfy CalculatorBase's current constructor shape; retires when shells
// consume definitions directly (FormShell milestone A6).
import type { ButtonProps } from '@ui/Button';
import type { CalculatorConfig } from '../CalculatorBase';
import type { BasicMetadata } from '../registry/validator';

export function keypadConfigFromMetadata(meta: BasicMetadata): CalculatorConfig {
  if (meta.ui.kind !== 'keypad') {
    throw new Error(
      `keypadConfigFromMetadata requires a keypad ui spec (got "${meta.ui.kind}" on ${meta.id})`
    );
  }

  const buttons: ButtonProps[][] = meta.ui.buttons.map(row =>
    row.map(btn => ({
      children: btn.children,
      variant: btn.variant,
      size: btn.size,
      'aria-label': btn['aria-label'],
    }))
  );

  return {
    id: meta.id,
    name: meta.name,
    description: meta.seo.description,
    category: meta.category,
    layout: 'basic',
    buttons,
    keyboardMap: meta.ui.keyboardMap,
    supportsHistory: true,
    supportsSteps: true,
  };
}
