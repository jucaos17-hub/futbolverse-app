import { getCompetitions } from '../services/football.js';
import { renderCompetitionCard } from '../components/competitionCard.js';
import { renderSkeleton } from '../components/skeleton.js';
import { navigateTo } from '../router.js';
import { COMPETITIONS } from '../utils/constants.js';

export async function renderCompetitions(container) {
  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">🏆 Competiciones</h1>
        <p class="page-subtitle">Las 12 mejores competiciones del fútbol mundial</p>
      </div>
      <div id="competitions-grid" class="competitions-grid">
        ${renderSkeleton('competitions', 12)}
      </div>
    </div>
  `;

  try {
    const data = await getCompetitions();
    const allComps = data.competitions || [];

    // Filter to only free-tier competitions
    const freeCodes = COMPETITIONS.map(c => c.code);
    const freeComps = allComps.filter(c => freeCodes.includes(c.code));

    // Sort by our predefined order
    freeComps.sort((a, b) => freeCodes.indexOf(a.code) - freeCodes.indexOf(b.code));

    const grid = document.getElementById('competitions-grid');
    if (!grid) return;

    if (freeComps.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-state__icon">🏆</div>
          <div class="empty-state__title">No se pudieron cargar las competiciones</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = freeComps.map(c => renderCompetitionCard(c)).join('');
    grid.classList.add('stagger-children');

    // Click events
    grid.querySelectorAll('.competition-card').forEach(card => {
      card.addEventListener('click', () => {
        const code = card.getAttribute('data-comp-code');
        navigateTo(`/standings/${code}`);
      });
    });
  } catch (err) {
    console.error('[Competitions] Error:', err);
    const grid = document.getElementById('competitions-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__title">Error al cargar competiciones</div>
          <div class="empty-state__text">${err.message}</div>
        </div>
      `;
    }
  }
}
