export interface HistoryProps {
  maxItems?: number;
  onClear?: () => void;
}

export function createHistory(props: HistoryProps = {}): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'history-panel';

  const header = document.createElement('div');
  header.className = 'history-header';

  const title = document.createElement('h3');
  title.textContent = 'History';
  header.appendChild(title);

  if (props.onClear) {
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn btn-ghost btn-sm';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', props.onClear);
    header.appendChild(clearBtn);
  }

  const list = document.createElement('ul');
  list.className = 'history-list';
  list.setAttribute('role', 'list');
  list.setAttribute('aria-label', 'Calculation history');

  container.appendChild(header);
  container.appendChild(list);

  return container;
}

export function updateHistory(historyEl: HTMLDivElement, items: string[]): void {
  const list = historyEl.querySelector('.history-list');
  if (!list) return;

  list.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.textContent = item;
    list.appendChild(li);
  });

  if (items.length === 0) {
    const li = document.createElement('li');
    li.className = 'history-empty';
    li.textContent = 'No calculations yet';
    list.appendChild(li);
  }
}
