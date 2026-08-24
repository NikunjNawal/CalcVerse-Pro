import { calculate, CalculationStep } from '@calc-engine';
import { formatNumber } from '@format';
import type { CalcOutput } from './registry/calculator-definition';
import { createDisplay, updateDisplay } from '@ui/Display';
import { createHistory, updateHistory } from '@ui/History';
import { createStepsPanel, updateSteps, setStepsVisible, StepProps } from '@ui/Steps';
import { createThemeToggle } from '@ui/ThemeToggle';
import { createButton, ButtonProps } from '@ui/Button';

export interface CalculatorConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  layout: 'basic' | 'scientific' | 'advanced';
  buttons: ButtonProps[][];
  keyboardMap: Record<string, string>;
  supportsHistory: boolean;
  supportsSteps: boolean;
}

export abstract class CalculatorBase {
  protected config: CalculatorConfig;
  protected container: HTMLElement;
  protected history: string[] = [];
  protected stepsVisible = false;
  protected displayEl!: HTMLDivElement;
  protected historyEl!: HTMLDivElement;
  protected stepsPanelEl!: HTMLDivElement;
  protected expression = '0';
  protected result = '0';
  protected maxHistoryItems = 50;

  constructor(config: CalculatorConfig, container: HTMLElement) {
    this.config = config;
    this.container = container;
    this.init();
  }

  protected init(): void {
    this.render();
    this.bindEvents();
    this.loadHistory();
  }

  protected render(): void {
    this.container.innerHTML = '';
    this.container.className = 'calculator-app';

    const pageHeader = document.querySelector('.header');
    if (pageHeader) {
      pageHeader.appendChild(createThemeToggle());
    } else {
      const header = document.createElement('header');
      header.className = 'calculator-header';

      const title = document.createElement('h1');
      title.textContent = this.config.name;
      header.appendChild(title);

      header.appendChild(createThemeToggle());

      this.container.appendChild(header);
    }

    const main = document.createElement('main');
    main.className = 'calculator-main';

    const calcSection = document.createElement('section');
    calcSection.className = 'calculator-section';

    this.displayEl = createDisplay({ expression: this.expression, result: this.result });
    calcSection.appendChild(this.displayEl);

    const buttonsGrid = document.createElement('div');
    buttonsGrid.className = 'calculator-buttons';
    buttonsGrid.setAttribute('role', 'group');
    buttonsGrid.setAttribute('aria-label', `${this.config.name} buttons`);

    this.config.buttons.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'button-row';
      row.forEach(btnProps => {
        const btn = createButton({
          ...btnProps,
          onClick: () => this.handleButtonClick(btnProps.children),
        });
        rowDiv.appendChild(btn);
      });
      buttonsGrid.appendChild(rowDiv);
    });

    calcSection.appendChild(buttonsGrid);
    main.appendChild(calcSection);

    if (this.config.supportsHistory || this.config.supportsSteps) {
      const sidebar = document.createElement('aside');
      sidebar.className = 'calculator-sidebar';

      if (this.config.supportsSteps) {
        this.stepsPanelEl = createStepsPanel({
          initiallyVisible: false,
          onToggle: visible => {
            this.stepsVisible = visible;
          },
        });
        sidebar.appendChild(this.stepsPanelEl);
      }

      if (this.config.supportsHistory) {
        this.historyEl = createHistory({
          onClear: () => this.clearHistory(),
        });
        sidebar.appendChild(this.historyEl);
      }

      main.appendChild(sidebar);
    }

    this.container.appendChild(main);

    if (!document.querySelector('.footer')) {
      const footer = document.createElement('footer');
      footer.className = 'calculator-footer';
      footer.innerHTML = `<p>CalcVerse Pro — ${this.config.category}</p>`;
      this.container.appendChild(footer);
    }
  }

  private readonly boundKeydown = (e: KeyboardEvent) => this.handleKeydown(e);

  protected bindEvents(): void {
    document.addEventListener('keydown', this.boundKeydown);
  }

  protected handleButtonClick(value: string): void {
    this.processInput(value);
  }

  protected handleKeydown(e: KeyboardEvent): void {
    const key = e.key;
    const mapped = this.config.keyboardMap[key];
    if (mapped) {
      e.preventDefault();
      this.processInput(mapped);
      return;
    }

    if (/^[0-9]$/.test(key) || key === '.') {
      e.preventDefault();
      this.processInput(key);
    }
  }

  protected abstract processInput(value: string): void;

  /**
   * Hook through which ALL evaluation flows. Default adapts the expression
   * engine directly; definition-driven subclasses override this to route
   * through their CalculatorDefinition.compute (§8 dependency rule:
   * UI → calculation, never the reverse).
   */
  protected computeExpression(expression: string): CalcOutput {
    const result = calculate(expression);
    return { value: result.value, steps: result.steps, warnings: [] };
  }

  protected evaluateExpression(expr: string): void {
    try {
      const result = this.computeExpression(expr);

      this.expression = expr;
      // Presentation formatting (A4): calculators conventionally show plain
      // positional results without grouping separators.
      this.result = formatNumber(result.value, { grouping: false });

      updateDisplay(this.displayEl, this.expression, this.result);

      if (this.config.supportsSteps && this.stepsPanelEl) {
        const stepProps: StepProps[] = result.steps.map((step: CalculationStep) => ({
          step: step.step,
          description: step.description,
          expression: step.expression,
          result: step.result,
          rule: step.rule,
          isFinal: step.isFinal ?? false,
        }));
        updateSteps(this.stepsPanelEl, stepProps);
        setStepsVisible(this.stepsPanelEl, true);
        this.stepsVisible = true;
      }

      if (this.config.supportsHistory) {
        this.addToHistory(`${expr} = ${result.value}`);
      }
    } catch (err) {
      this.result = 'Error';
      updateDisplay(this.displayEl, this.expression, this.result);
      console.error('Calculation error:', err);
    }
  }

  protected addToHistory(entry: string): void {
    this.history.unshift(entry);
    if (this.history.length > this.maxHistoryItems) {
      this.history.pop();
    }
    this.saveHistory();
    if (this.historyEl) {
      updateHistory(this.historyEl, this.history);
    }
  }

  protected clearHistory(): void {
    this.history = [];
    this.saveHistory();
    if (this.historyEl) {
      updateHistory(this.historyEl, this.history);
    }
  }

  protected saveHistory(): void {
    try {
      localStorage.setItem(`calcverse-history-${this.config.id}`, JSON.stringify(this.history));
    } catch (err) {
      console.warn(`History could not be persisted for "${this.config.id}":`, err);
    }
  }

  protected loadHistory(): void {
    try {
      const saved = localStorage.getItem(`calcverse-history-${this.config.id}`);
      if (saved) this.history = JSON.parse(saved);
    } catch (err) {
      console.warn(`Saved history for "${this.config.id}" is unreadable, starting empty:`, err);
      this.history = [];
    }
    if (this.historyEl) {
      updateHistory(this.historyEl, this.history);
    }
  }

  protected updateExpressionView(): void {
    updateDisplay(this.displayEl, this.expression, this.result);
  }

  protected appendToExpression(value: string): void {
    if (this.expression === '0' && value !== '.') {
      this.expression = value;
    } else {
      this.expression += value;
    }
    this.updateExpressionView();
  }

  protected clearAll(): void {
    this.expression = '0';
    this.result = '0';
    this.updateExpressionView();
    if (this.stepsPanelEl) {
      updateSteps(this.stepsPanelEl, []);
    }
  }

  protected clearEntry(): void {
    this.expression = this.expression.slice(0, -1) || '0';
    this.updateExpressionView();
  }

  protected toggleSign(): void {
    const match = this.expression.match(/(-?\d+\.?\d*)$/);
    if (match) {
      const num = parseFloat(match[1]);
      this.expression = this.expression.slice(0, match.index!) + String(-num);
      this.updateExpressionView();
    }
  }

  /** Removes global listeners. Fixes the A1-era rebinding bug (debt item). */
  destroy(): void {
    document.removeEventListener('keydown', this.boundKeydown);
  }
}
