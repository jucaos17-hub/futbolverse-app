import { getTeam, getTeamMatches } from '../services/football.js';
import { renderMatchCard } from '../components/matchCard.js';
import { renderSkeleton } from '../components/skeleton.js';
import { POSITION_LABELS } from '../utils/constants.js';
import { navigateTo } from '../router.js';

export async function renderTeamPage(container, params) {
  const teamId = params.id;

  container.innerHTML = `
    <div class="container">
      ${renderSkeleton('detail')}
    </div>
  `;

  try {
    const [teamData, matchesData] = await Promise.all([
      getTeam(teamId),
      getTeamMatches(teamId, 15),
    ]);

    const team = teamData;
    const matches = matchesData.matches || [];

    // Group squad by position
    const squad = team.squad || [];
    const grouped = {};
    for (const player of squad) {
      const pos = player.position || 'Unknown';
      if (!grouped[pos]) grouped[pos] = [];
      grouped[pos].push(player);
    }

    const positionOrder = ['Goalkeeper', 'Defence', 'Midfield', 'Offence'];
    const squadHtml = positionOrder
      .filter(pos => grouped[pos])
      .map(pos => `
        <div style="margin-bottom: var(--sp-lg);">
          <h3 style="font-size:var(--fs-sm);color:var(--clr-text-secondary);margin-bottom:var(--sp-sm);text-transform:uppercase;letter-spacing:1px;">
            ${POSITION_LABELS[pos] || pos}
          </h3>
          <div class="squad-list">
            ${grouped[pos].map(p => `
              <div class="squad-member">
                <span class="squad-member__number">${p.shirtNumber || '—'}</span>
                <span class="squad-member__name">${p.name}</span>
                <span class="squad-member__position">${p.nationality || ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

    // Recent matches
    const recentMatches = matches.slice(0, 10);
    const matchesHtml = recentMatches.length > 0
      ? `<div class="matches-grid">${recentMatches.map(m => renderMatchCard(m)).join('')}</div>`
      : '<p style="color:var(--clr-text-secondary);">No hay partidos recientes.</p>';

    // Running competitions
    const comps = team.runningCompetitions || [];
    const compsHtml = comps.map(c => `
      <span class="badge badge--scheduled" style="cursor:pointer;" data-comp-code="${c.code}">${c.name}</span>
    `).join(' ');

    container.innerHTML = `
      <div class="container">
        <button class="btn btn--ghost" id="back-btn" style="margin-bottom: var(--sp-md);">← Volver</button>
        
        <div class="team-header anim-scale-in">
          ${team.crest ? `<img class="team-header__crest" src="${team.crest}" alt="${team.name}" onerror="this.style.display='none'" />` : ''}
          <div class="team-header__info">
            <h1 class="team-header__name">${team.name}</h1>
            <div class="team-header__meta">
              ${team.venue ? `<span class="team-header__meta-item">🏟️ ${team.venue}</span>` : ''}
              ${team.founded ? `<span class="team-header__meta-item">📅 Fundado: ${team.founded}</span>` : ''}
              ${team.clubColors ? `<span class="team-header__meta-item">🎨 ${team.clubColors}</span>` : ''}
              ${team.coach?.name ? `<span class="team-header__meta-item">👔 ${team.coach.name}</span>` : ''}
              ${team.area?.name ? `<span class="team-header__meta-item">📍 ${team.area.name}</span>` : ''}
            </div>
            ${compsHtml ? `<div style="margin-top:var(--sp-sm);display:flex;flex-wrap:wrap;gap:var(--sp-xs);">${compsHtml}</div>` : ''}
          </div>
        </div>

        ${squad.length > 0 ? `
          <div class="section-group anim-fade-up" style="animation-delay: 100ms;">
            <div class="section-group__header">
              <div class="section-group__title">👥 Plantilla</div>
              <span class="section-group__count">${squad.length} jugadores</span>
            </div>
            ${squadHtml}
          </div>
        ` : ''}

        <div class="section-group anim-fade-up" style="animation-delay: 200ms;">
          <div class="section-group__header">
            <div class="section-group__title">📅 Partidos Recientes</div>
          </div>
          ${matchesHtml}
        </div>
      </div>
    `;

    // Events
    document.getElementById('back-btn')?.addEventListener('click', () => {
      window.history.back();
    });

    // Match card clicks
    container.querySelectorAll('.match-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-match-id');
        navigateTo(`/match/${id}`);
      });
    });

    // Competition badge clicks
    container.querySelectorAll('[data-comp-code]').forEach(badge => {
      badge.addEventListener('click', () => {
        const code = badge.getAttribute('data-comp-code');
        if (code) navigateTo(`/standings/${code}`);
      });
    });

  } catch (err) {
    console.error('[Team] Error:', err);
    container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__title">Error al cargar equipo</div>
          <div class="empty-state__text">${err.message}</div>
          <button class="btn btn--primary" onclick="history.back()" style="margin-top:1rem">Volver</button>
        </div>
      </div>
    `;
  }
}
