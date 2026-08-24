import { initTheme } from '@theme';
import { iconMarkup } from '@ui/icons';
import './styles/main.css';

initTheme();

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear().toString();

  const grid = document.getElementById('calculators-grid');
  const comingSoon = document.getElementById('coming-soon-list');

  if (grid || comingSoon) {
    import('./registry').then(({ getFeaturedCalculators, getComingSoonCalculators }) => {
      if (grid) {
        const featured = getFeaturedCalculators();
        grid.innerHTML = `
          <h2>Available Calculators</h2>
          <div class="calculator-cards">
            ${featured
              .map(
                calc => `
              <article class="calculator-card ${calc.featured ? 'featured' : ''} ${calc.status === 'coming-soon' ? 'coming-soon' : ''}">
                <div class="calculator-card-header">
                  <span class="calculator-card-icon">${iconMarkup('calculator')}</span>
                  ${calc.status === 'coming-soon' ? '<span class="calculator-card-badge">Coming Soon</span>' : '<span class="calculator-card-badge">Available</span>'}
                </div>
                <h3>${calc.name}</h3>
                <p>${calc.description}</p>
                <div class="calculator-card-footer">
                  ${
                    calc.status === 'coming-soon'
                      ? `<span class="btn-primary" aria-disabled="true">Notify Me</span>`
                      : `<a href="${calc.path}" class="btn-primary">Open Calculator</a>`
                  }
                </div>
              </article>
            `
              )
              .join('')}
          </div>
        `;
      }

      if (comingSoon) {
        const soon = getComingSoonCalculators();
        comingSoon.innerHTML = soon
          .map(calc => `<li>${calc.name} — ${calc.description}</li>`)
          .join('');
      }
    });
  }
});
