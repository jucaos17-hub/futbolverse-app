import { getStandings } from '../services/football.js';
import { renderStandingsTable } from '../components/standingsTable.js';
import { renderSkeleton } from '../components/skeleton.js';
import { COMPETITIONS, TOURNAMENT_COMPETITIONS } from '../utils/constants.js';
import { navigateTo } from '../router.js';
import { loadKnockoutBracket, attachKnockoutEvents } from '../components/knockoutBracket.js';

export async function renderStandingsPage(container, params) {
  const code = params.code || 'PL';
  const compInfo = COMPETITIONS.find(c => c.code === code) || { name: code, flag: '🏆' };
  const isTournament = TOURNAMENT_COMPETITIONS.includes(code);

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
      ${isTournament ? `
        <div class="standings-tabs" id="standings-tabs">
          <button class="standings-tabs__btn active" data-tab="groups">📊 Fase de Grupos</button>
          <button class="standings-tabs__btn" data-tab="knockout">🏆 Eliminatorias</button>
        </div>
      ` : ''}
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

  let refreshTimer = null;
  let currentTab = 'groups';

  // ── Tab switching (only for tournaments) ──
  if (isTournament) {
    document.querySelectorAll('.standings-tabs__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab === currentTab) return;
        currentTab = tab;

        // Update active tab button
        document.querySelectorAll('.standings-tabs__btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Load appropriate content
        const content = document.getElementById('standings-content');
        if (content) content.innerHTML = renderSkeleton('cards', 8);
        
        if (tab === 'groups') {
          loadStandings();
        } else {
          loadKnockout();
        }
      });
    });
  }

  // ── Load group standings ──
  async function loadStandings() {
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

  // ── Load knockout bracket ──
  async function loadKnockout() {
    const content = document.getElementById('standings-content');
    if (!content) return;

    try {
      const bracketHtml = await loadKnockoutBracket(code);
      content.innerHTML = `<div class="anim-fade-up">${bracketHtml}</div>`;
      attachKnockoutEvents();
    } catch (err) {
      console.error('[Knockout] Error:', err);
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__title">Error al cargar eliminatorias</div>
          <div class="empty-state__text">${err.message}</div>
        </div>
      `;
    }
  }

  // Load initial data (always start with group standings)
  await loadStandings();

  // Auto-refresh every 2 minutes
  refreshTimer = setInterval(() => {
    if (currentTab === 'groups') {
      loadStandings();
    } else {
      loadKnockout();
    }
  }, 120000);

  // Return cleanup function
  return () => {
    if (refreshTimer) clearInterval(refreshTimer);
  };
}
