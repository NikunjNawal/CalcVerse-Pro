export type ButtonVariant =
  'primary' | 'secondary' | 'operator' | 'control' | 'equal' | 'scientific' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
  children: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  operator: 'btn-operator',
  control: 'btn-control',
  equal: 'btn-equal',
  scientific: 'btn-scientific',
  ghost: 'btn-ghost',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export function createButton(props: ButtonProps): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `btn ${VARIANT_CLASSES[props.variant ?? 'secondary']} ${SIZE_CLASSES[props.size ?? 'md']}`;
  btn.textContent = props.children;
  btn.disabled = props.disabled ?? false;

  if (props['aria-label']) {
    btn.setAttribute('aria-label', props['aria-label']);
  }
  if (props['data-testid']) {
    btn.setAttribute('data-testid', props['data-testid']);
  }
  if (props.onClick) {
    btn.addEventListener('click', props.onClick);
  }

  return btn;
}

export function createButtonGroup(buttons: ButtonProps[]): HTMLDivElement {
  const group = document.createElement('div');
  group.className = 'btn-group';
  group.setAttribute('role', 'group');
  buttons.forEach(props => group.appendChild(createButton(props)));
  return group;
}
