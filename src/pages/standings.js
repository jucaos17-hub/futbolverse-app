import { getStandings } from '../services/football.js';
import { renderStandingsTable } from '../components/standingsTable.js';
import { renderSkeleton } from '../components/skeleton.js';
import { COMPETITIONS } from '../utils/constants.js';
import { navigateTo } from '../router.js';

export async function renderStandingsPage(container, params) {
  const code = params.code || 'PL';
  const compInfo = COMPETITIONS.find(c => c.code === code) || { name: code, flag: '🏆' };

  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">📊 Clasificación</h1>
        <p class="page-subtitle">${compInfo.flag} ${compInfo.name}</p>
      </div>
      <div style="margin-bottom: var(--sp-lg);">
        <div class="select-wrapper">
          <select class="select-custom" id="standings-comp-select">
            ${COMPETITIONS.map(c =>
              `<option value="${c.code}" ${c.code === code ? 'selected' : ''}>${c.flag} ${c.name}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div id="standings-content">
        ${renderSkeleton('cards', 10)}
      </div>
    </div>
  `;

  // Competition selector
  const select = document.getElementById('standings-comp-select');
  if (select) {
    select.addEventListener('change', (e) => {
      navigateTo(`/standings/${e.target.value}`);
    });
  }

  try {
    const data = await getStandings(code);
    const standingsArr = data.standings || [];
    const content = document.getElementById('standings-content');
    if (!content) return;

    if (standingsArr.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📊</div>
          <div class="empty-state__title">Sin datos de clasificación</div>
          <div class="empty-state__text">Esta competición no tiene tabla de posiciones disponible en este momento.</div>
        </div>
      `;
      return;
    }

    // Filter all TOTAL standings (for tournaments with groups)
    const totalStandings = standingsArr.filter(s => s.type === 'TOTAL');
    
    if (totalStandings.length === 0) {
      // Fallback
      content.innerHTML = `
        <div class="anim-fade-up">
          ${renderStandingsTable(standingsArr[0])}
        </div>
      `;
    } else {
      let html = '<div class="anim-fade-up" style="display:flex; flex-direction:column; gap:var(--sp-xl);">';
      for (const s of totalStandings) {
        if (s.group) {
          const groupName = s.group.replace('_', ' ');
          html += `
            <div class="standings-group">
              <h3 style="margin-bottom: var(--sp-md); color: var(--clr-text); font-size: var(--fs-md); border-bottom: 1px solid var(--clr-border); padding-bottom: 8px;">${groupName}</h3>
              ${renderStandingsTable(s)}
            </div>
          `;
        } else {
          html += renderStandingsTable(s);
        }
      }
      html += '</div>';
      content.innerHTML = html;
    }

    // Team name click → team page
    content.querySelectorAll('.standings-table__team-name').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const teamId = el.getAttribute('data-team-id');
        if (teamId) navigateTo(`/team/${teamId}`);
      });
    });
  } catch (err) {
    console.error('[Standings] Error:', err);
    const content = document.getElementById('standings-content');
    if (content) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__title">Error al cargar clasificación</div>
          <div class="empty-state__text">${err.message}</div>
        </div>
      `;
    }
  }
}
