export interface StepProps {
  step: number;
  description: string;
  expression: string;
  result: string;
  rule?: string;
  isFinal?: boolean;
}

export function createStep(props: StepProps): HTMLDivElement {
  const step = document.createElement('div');
  step.className = `step-item ${props.isFinal ? 'step-final' : ''}`;
  step.setAttribute('data-step', String(props.step));

  if (props.rule) {
    const rule = document.createElement('span');
    rule.className = 'step-rule';
    rule.textContent = props.rule;
    step.appendChild(rule);
  }

  const desc = document.createElement('div');
  desc.className = 'step-description';
  desc.textContent = props.description;
  step.appendChild(desc);

  return step;
}

export interface StepsPanelProps {
  onToggle?: (visible: boolean) => void;
  initiallyVisible?: boolean;
}

export function createStepsPanel(props: StepsPanelProps = {}): HTMLDivElement {
  const panel = document.createElement('div');
  panel.className = 'steps-panel';

  const header = document.createElement('div');
  header.className = 'steps-header';

  const title = document.createElement('h3');
  title.textContent = 'Step-by-Step Explanation';
  header.appendChild(title);

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'btn btn-primary btn-sm steps-toggle';
  toggleBtn.textContent = props.initiallyVisible ? 'Hide Steps' : 'Show Steps';
  toggleBtn.setAttribute('aria-expanded', String(props.initiallyVisible ?? false));
  toggleBtn.setAttribute('aria-controls', 'steps-content');
  toggleBtn.addEventListener('click', () => {
    const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    const next = !expanded;
    toggleBtn.setAttribute('aria-expanded', String(next));
    toggleBtn.textContent = next ? 'Hide Steps' : 'Show Steps';
    content.classList.toggle('hidden', !next);
    props.onToggle?.(next);
  });
  header.appendChild(toggleBtn);

  panel.appendChild(header);

  const content = document.createElement('div');
  content.id = 'steps-content';
  content.className = `steps-content ${props.initiallyVisible ? '' : 'hidden'}`;
  content.setAttribute('role', 'region');
  content.setAttribute('aria-label', 'Calculation steps');

  const placeholder = document.createElement('p');
  placeholder.className = 'steps-placeholder';
  placeholder.textContent = 'Perform a calculation to see step-by-step explanation.';
  content.appendChild(placeholder);

  panel.appendChild(content);

  return panel;
}

export function updateSteps(panel: HTMLDivElement, steps: StepProps[]): void {
  const content = panel.querySelector('.steps-content');
  if (!content) return;

  content.innerHTML = '';

  if (steps.length === 0) {
    const placeholder = document.createElement('p');
    placeholder.className = 'steps-placeholder';
    placeholder.textContent = 'Perform a calculation to see step-by-step explanation.';
    content.appendChild(placeholder);
    return;
  }

  steps.forEach(step => {
    content.appendChild(createStep(step));
  });
}

export function setStepsVisible(panel: HTMLDivElement, visible: boolean): void {
  const content = panel.querySelector('.steps-content');
  const toggleBtn = panel.querySelector('.steps-toggle') as HTMLButtonElement | null;
  if (content) {
    content.classList.toggle('hidden', !visible);
  }
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', String(visible));
    toggleBtn.textContent = visible ? 'Hide Steps' : 'Show Steps';
  }
}
