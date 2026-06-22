import { getScorers } from '../services/football.js';
import { renderScorersTable } from '../components/scorersTable.js';
import { renderSkeleton } from '../components/skeleton.js';
import { COMPETITIONS } from '../utils/constants.js';
import { navigateTo } from '../router.js';

// Filter to league-type competitions (not cups/tournaments for scorers)
const LEAGUE_COMPS = COMPETITIONS.filter(c =>
  !['CL', 'WC', 'EC'].includes(c.code)
);

export async function renderScorersPage(container, params) {
  const code = params.code || 'PL';
  const compInfo = COMPETITIONS.find(c => c.code === code) || { name: code, flag: '👟' };

  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">👟 Goleadores</h1>
        <p class="page-subtitle">${compInfo.flag} ${compInfo.name}</p>
      </div>
      <div style="margin-bottom: var(--sp-lg);">
        <div class="select-wrapper">
          <select class="select-custom" id="scorers-comp-select">
            ${COMPETITIONS.map(c =>
              `<option value="${c.code}" ${c.code === code ? 'selected' : ''}>${c.flag} ${c.name}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div id="scorers-content">
        ${renderSkeleton('cards', 10)}
      </div>
    </div>
  `;

  const select = document.getElementById('scorers-comp-select');
  if (select) {
    select.addEventListener('change', (e) => {
      navigateTo(`/scorers/${e.target.value}`);
    });
  }

  let refreshTimer = null;

  async function loadScorers() {
    try {
      const data = await getScorers(code);
      const scorers = data.scorers || [];
      const content = document.getElementById('scorers-content');
      if (!content) return;

      content.innerHTML = `<div class="anim-fade-up">${renderScorersTable(scorers)}</div>`;
    } catch (err) {
      console.error('[Scorers] Error:', err);
      const content = document.getElementById('scorers-content');
      if (content) {
        content.innerHTML = `
          <div class="empty-state">
            <div class="empty-state__icon">⚠️</div>
            <div class="empty-state__title">Error al cargar goleadores</div>
            <div class="empty-state__text">${err.message}</div>
          </div>
        `;
      }
    }
  }

  await loadScorers();

  // Auto-refresh every 2 minutes
  refreshTimer = setInterval(() => {
    loadScorers();
  }, 120000);

  // Return cleanup function
  return () => {
    if (refreshTimer) clearInterval(refreshTimer);
  };
}
