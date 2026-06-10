import { getMatch } from '../services/football.js';
import { renderSkeleton } from '../components/skeleton.js';
import { formatDate, formatTime, formatScore, translateStatus, isLive, isFinished } from '../utils/formatters.js';
import { navigateTo } from '../router.js';
import { BROADCASTERS, DEFAULT_BROADCASTER } from '../utils/constants.js';

export async function renderMatchDetail(container, params) {
  const matchId = params.id;

  container.innerHTML = `
    <div class="container">
      ${renderSkeleton('detail')}
    </div>
  `;

  try {
    const match = await getMatch(matchId);

    const home = match.homeTeam;
    const away = match.awayTeam;
    const score = match.score;
    const status = match.status;
    const competition = match.competition;
    const live = isLive(status);
    const finished = isFinished(status);

    const homeScore = score?.fullTime?.home;
    const awayScore = score?.fullTime?.away;
    const htHome = score?.halfTime?.home;
    const htAway = score?.halfTime?.away;

    let statusColor = 'var(--clr-primary-light)';
    if (live) statusColor = 'var(--clr-live)';
    else if (finished) statusColor = 'var(--clr-text-muted)';

    // Get broadcasters for this match
    const compCode = match.competition?.code || 'OTHER';
    const broadcasterList = BROADCASTERS[compCode]?.channels || DEFAULT_BROADCASTER.channels;

    // Goals
    const goals = match.goals || [];
    const goalsHtml = goals.length > 0 ? `
      <div class="goals-list anim-fade-up" style="animation-delay: 200ms;">
        <div class="goals-list__title">⚽ Goles</div>
        ${goals.map(g => `
          <div class="goal-item">
            <span class="goal-item__minute">${g.minute}'</span>
            <span class="goal-item__icon">⚽</span>
            <span class="goal-item__scorer">${g.scorer?.name || 'Desconocido'}</span>
            <span class="goal-item__team">${g.team?.name || ''}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    // Referees
    const referees = match.referees || [];
    const mainRef = referees.find(r => r.type === 'REFEREE');

    // Build detail
    container.innerHTML = `
      <div class="container">
        <button class="btn btn--ghost" id="back-btn" style="margin-bottom: var(--sp-md);">← Volver</button>
        
        <div class="match-detail-header anim-scale-in">
          <div class="match-detail__team">
            ${home.crest ? `<img class="match-detail__crest" src="${home.crest}" alt="${home.name}" onerror="this.style.display='none'" />` : ''}
            <div class="match-detail__team-name">${home.shortName || home.name}</div>
          </div>
          <div class="match-detail__center">
            ${(homeScore !== null && homeScore !== undefined) ? `
              <div class="match-detail__score">
                <span>${formatScore(homeScore)}</span>
                <span class="match-detail__score-sep">—</span>
                <span>${formatScore(awayScore)}</span>
              </div>
            ` : `
              <div class="match-detail__score" style="font-size:var(--fs-xl);">
                ${formatTime(match.utcDate)}
              </div>
            `}
            <div class="match-detail__status" style="color: ${statusColor};">
              ${live ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--clr-live);margin-right:6px;animation:pulse 1.5s infinite;"></span>' : ''}
              ${translateStatus(status)}
            </div>
            ${(htHome !== null && htHome !== undefined) ? `
              <div style="font-size:var(--fs-xs);color:var(--clr-text-muted);margin-top:4px;">
                Medio tiempo: ${htHome} - ${htAway}
              </div>
            ` : ''}
          </div>
          <div class="match-detail__team">
            ${away.crest ? `<img class="match-detail__crest" src="${away.crest}" alt="${away.name}" onerror="this.style.display='none'" />` : ''}
            <div class="match-detail__team-name">${away.shortName || away.name}</div>
          </div>
        </div>

        <div class="match-detail__info anim-fade-up" style="margin-bottom: var(--sp-xl); display:flex; flex-wrap:wrap; gap:var(--sp-md); justify-content:center;">
          ${competition ? `
            <div class="match-detail__info-item">
              ${competition.emblem ? `<img src="${competition.emblem}" alt="" style="width:18px;height:18px;object-fit:contain;" onerror="this.style.display='none'" />` : ''}
              <span>${competition.name}</span>
            </div>
          ` : ''}
          <div class="match-detail__info-item">📅 ${formatDate(match.utcDate)}</div>
          <div class="match-detail__info-item">🕐 ${formatTime(match.utcDate)}</div>
          ${match.matchday ? `<div class="match-detail__info-item">📋 Jornada ${match.matchday}</div>` : ''}
          ${match.venue ? `<div class="match-detail__info-item">🏟️ ${match.venue}</div>` : ''}
          ${mainRef ? `<div class="match-detail__info-item">👨‍⚖️ ${mainRef.name}</div>` : ''}
        </div>

        <div class="integrated-player-section anim-fade-up" style="margin-bottom: var(--sp-xl); animation-delay: 100ms;">
          <div style="text-align: center; margin-bottom: var(--sp-md);">
            <h3 style="font-size: var(--fs-md); margin-bottom: var(--sp-sm);">📺 Transmisión Integrada</h3>
            <p style="font-size: var(--fs-sm); color: var(--clr-text-secondary); margin-bottom: var(--sp-md);">Selecciona un servidor oficial o gratuito para ver el partido:</p>
            <div style="display: flex; gap: var(--sp-sm); justify-content: center; flex-wrap: wrap; margin-bottom: var(--sp-sm);">
              ${broadcasterList.map(b => `
                <button class="btn btn--secondary stream-btn" data-url="${b.url}">
                  ${b.icon} ${b.name}
                </button>
              `).join('')}
            </div>
            
            <div style="margin-top: var(--sp-md); padding-top: var(--sp-md); border-top: 1px dashed var(--clr-border);">
          </div>

          <!-- Default Iframe Player -->
          <div id="player-wrapper">
            <div id="player-container" style="display: none; width: 100%; max-width: 900px; margin: 0 auto; aspect-ratio: 16/9; background: #000; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--clr-border); box-shadow: var(--shadow-lg);">
              <iframe id="player-iframe" src="" style="width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
            </div>
            <p id="player-warning" style="display: none; text-align: center; font-size: 11px; color: var(--clr-text-muted); margin-top: 8px;">
              Nota: Si el reproductor integrado se queda en blanco (suele pasar con sitios oficiales como DirecTV o Netflix), <a id="player-external-link" href="#" target="_blank" style="color: var(--clr-primary-light); text-decoration: underline;">haz clic aquí para abrirlo en una nueva pestaña</a>.
            </p>
          </div>
          </div>
        </div>

        ${goalsHtml}

        <div style="display:flex;gap:var(--sp-md);margin-top:var(--sp-xl);flex-wrap:wrap;justify-content:center;" class="anim-fade-up" style="animation-delay: 300ms;">
          <button class="btn btn--secondary" id="view-home-team" data-team-id="${home.id}">
            Ver ${home.shortName || home.name}
          </button>
          <button class="btn btn--secondary" id="view-away-team" data-team-id="${away.id}">
            Ver ${away.shortName || away.name}
          </button>
        </div>
      </div>
    `;

    // Events
    document.getElementById('back-btn')?.addEventListener('click', () => {
      window.history.back();
    });

    document.getElementById('view-home-team')?.addEventListener('click', () => {
      navigateTo(`/team/${home.id}`);
    });
    document.getElementById('view-away-team')?.addEventListener('click', () => {
      navigateTo(`/team/${away.id}`);
    });

    // Stream buttons logic
    const playerWrapper = document.getElementById('player-wrapper');
    const playerContainer = document.getElementById('player-container');
    const playerIframe = document.getElementById('player-iframe');
    const playerWarning = document.getElementById('player-warning');
    const playerExternalLink = document.getElementById('player-external-link');
    
    // Web Stream buttons
    container.querySelectorAll('.stream-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Remove active class from all
        container.querySelectorAll('.stream-btn').forEach(b => b.classList.remove('btn--primary'));
        container.querySelectorAll('.stream-btn').forEach(b => b.classList.add('btn--secondary'));
        
        // Add active class to clicked
        const targetBtn = e.target.closest('.stream-btn');
        targetBtn.classList.remove('btn--secondary');
        targetBtn.classList.add('btn--primary');

        // Load iframe
        const url = targetBtn.getAttribute('data-url');
        playerContainer.style.display = 'block';
        playerWarning.style.display = 'block';
        playerIframe.src = url;
        playerExternalLink.href = url;
        
        // Scroll to player
        playerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    // All web stream logic is handled above

  } catch (err) {
    console.error('[MatchDetail] Error:', err);
    container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__title">Error al cargar partido</div>
          <div class="empty-state__text">${err.message}</div>
          <button class="btn btn--primary" onclick="history.back()" style="margin-top:1rem">Volver</button>
        </div>
      </div>
    `;
  }
}
