import { getMatchesByDate } from '../services/football.js';
import { renderMatchCard } from '../components/matchCard.js';
import { renderDatePicker, attachDatePickerEvents } from '../components/datePicker.js';
import { renderSkeleton } from '../components/skeleton.js';
import { getToday, formatDate } from '../utils/formatters.js';
import { navigateTo } from '../router.js';

export async function renderDashboard(container) {
  let currentDate = getToday();
  let refreshTimer = null;

  async function loadMatches(date) {
    const contentArea = document.getElementById('dashboard-matches');
    if (contentArea) {
      contentArea.innerHTML = renderSkeleton('cards', 8);
    }

    try {
      const data = await getMatchesByDate(date, date);
      let matches = data.matches || [];
      let isUpcoming = false;

      // If no matches for the selected date, and the date is today or in the future, fetch upcoming matches
      if (matches.length === 0) {
        const today = getToday();
        if (date >= today) {
          // fetch next 7 days
          const nextWeek = new Date(date);
          nextWeek.setDate(nextWeek.getDate() + 7);
          const toDate = nextWeek.toISOString().split('T')[0];
          
          const upcomingData = await getMatchesByDate(date, toDate);
          if (upcomingData.matches && upcomingData.matches.length > 0) {
            matches = upcomingData.matches;
            isUpcoming = true;
          }
        }
      }

      // Fetch remote live streams mapping if available
      let liveStreams = {};
      try {
        const url = 'https://raw.githubusercontent.com/jucaos17-hub/futbolverse-app/main/live_streams.json?t=' + Date.now();
        const res = await fetch(url);
        if (res.ok) {
          const streamData = await res.json();
          liveStreams = streamData.matches || {};
        }
      } catch (e) {
        console.warn('Could not fetch live_streams.json', e);
      }

      renderMatchesList(matches, date, isUpcoming, liveStreams);
    } catch (err) {
      console.error('[Dashboard] Error loading matches:', err);
      const contentArea = document.getElementById('dashboard-matches');
      if (contentArea) {
        contentArea.innerHTML = `
          <div class="empty-state">
            <div class="empty-state__icon">⚠️</div>
            <div class="empty-state__title">Error al cargar partidos</div>
            <div class="empty-state__text">${err.message}</div>
          </div>
        `;
      }
    }
  }

  function renderMatchesList(matches, date, isUpcoming = false, liveStreams = {}) {
    const contentArea = document.getElementById('dashboard-matches');
    if (!contentArea) return;

    if (matches.length === 0) {
      contentArea.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📅</div>
          <div class="empty-state__title">No hay partidos próximos</div>
          <div class="empty-state__text">Prueba seleccionando otra fecha para ver partidos disponibles.</div>
        </div>
      `;
      return;
    }

    // Group by competition
    const grouped = {};
    for (const match of matches) {
      const compName = match.competition?.name || 'Otros';
      const compId = match.competition?.code || 'OTHER';
      if (!grouped[compId]) {
        grouped[compId] = {
          name: compName,
          emblem: match.competition?.emblem || '',
          matches: [],
        };
      }
      grouped[compId].matches.push(match);
    }

    let html = '';
    
    if (isUpcoming) {
      html += `
        <div style="background: var(--clr-primary-glow); padding: var(--sp-md); border-radius: var(--radius-md); margin-bottom: var(--sp-lg); border: 1px solid var(--clr-primary);">
          <h3 style="color: var(--clr-primary-light); margin-bottom: 4px;">📅 Próximos Partidos</h3>
          <p style="font-size: var(--fs-sm); color: var(--clr-text-secondary);">No hay partidos para la fecha seleccionada. Mostrando partidos de los próximos 7 días.</p>
        </div>
      `;
    }

    for (const [compCode, group] of Object.entries(grouped)) {
      html += `
        <div class="section-group anim-fade-up">
          <div class="section-group__header">
            <div class="section-group__title">
              ${group.emblem ? `<img class="section-group__logo" src="${group.emblem}" alt="${group.name}" onerror="this.style.display='none'" loading="lazy" />` : ''}
              <span>${group.name}</span>
            </div>
            <span class="section-group__count">${group.matches.length} partido${group.matches.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="matches-grid">
            ${group.matches.map(m => renderMatchCard(m, liveStreams[m.id])).join('')}
          </div>
        </div>
      `;
    }

    contentArea.innerHTML = html;

    // Attach click events on match cards
    contentArea.querySelectorAll('.match-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-match-id');
        navigateTo(`/match/${id}`);
      });
    });
  }

  async function renderNewsSection(container) {
    container.innerHTML = `
      <div class="news-section anim-fade-up" style="margin-bottom: var(--sp-xl);">
        <h2 style="font-size: var(--fs-lg); margin-bottom: var(--sp-md); display: flex; align-items: center; gap: 8px;">
          📰 Noticias y Resultados Recientes
        </h2>
        <div id="news-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--sp-md);">
          <div style="text-align:center; padding: var(--sp-lg); color: var(--clr-text-muted);">Cargando noticias...</div>
        </div>
      </div>
    `;

    try {
      // Fetch recent finished matches from the last 3 days
      const endDate = getToday();
      const startD = new Date();
      startD.setDate(startD.getDate() - 3);
      const startDate = `${startD.getFullYear()}-${String(startD.getMonth()+1).padStart(2,'0')}-${String(startD.getDate()).padStart(2,'0')}`;
      
      const { getMatchesByDate } = await import('../services/football.js');
      const data = await getMatchesByDate(startDate, endDate);
      const finished = (data.matches || []).filter(m => m.status === 'FINISHED');

      const newsGrid = document.getElementById('news-grid');
      if (!newsGrid) return;

      if (finished.length === 0) {
        newsGrid.innerHTML = `
          <div style="text-align:center; padding: var(--sp-lg); color: var(--clr-text-muted); grid-column: 1 / -1;">
            No hay resultados recientes. Los partidos finalizados aparecerán aquí automáticamente.
          </div>
        `;
        return;
      }

      // Pick up to 6 most recent interesting results
      const newsMatches = finished
        .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
        .slice(0, 6);

      const newsCards = newsMatches.map(m => {
        const home = m.homeTeam;
        const away = m.awayTeam;
        const hs = m.score?.fullTime?.home ?? 0;
        const as = m.score?.fullTime?.away ?? 0;
        const comp = m.competition?.name || 'Liga';
        const compEmoji = m.competition?.code === 'WC' ? '🏆' : '⚽';
        const homeCrest = home.crest || '';
        const awayCrest = away.crest || '';

        let headline = '';
        if (hs === as) headline = `¡Empate intenso! ${home.shortName || home.name} ${hs}-${as} ${away.shortName || away.name}`;
        else if (hs > as) headline = `${home.shortName || home.name} se impone ${hs}-${as} ante ${away.shortName || away.name}`;
        else headline = `${away.shortName || away.name} vence ${as}-${hs} a ${home.shortName || home.name}`;

        const totalGoals = hs + as;
        let summary = '';
        if (totalGoals >= 5) summary = `Lluvia de goles en un emocionante encuentro por ${comp}.`;
        else if (totalGoals === 0) summary = `Sin goles pero con mucha intensidad en este partido de ${comp}.`;
        else summary = `Resultado final en el marco de ${comp}.`;

        return `
          <div class="news-card" style="background: var(--clr-surface); border: 1px solid var(--clr-border); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; transition: transform 0.2s;" onclick="window.dispatchEvent(new CustomEvent('navigate', {detail:'/match/${m.id}'}))">
            <div style="padding: var(--sp-md); display: flex; align-items: center; justify-content: center; gap: var(--sp-md); background: var(--clr-bg-elevated);">
              ${homeCrest ? `<img src="${homeCrest}" alt="${home.shortName}" style="width:40px;height:40px;object-fit:contain;" onerror="this.style.display='none'" />` : ''}
              <span style="font-size: var(--fs-lg); font-weight: 700; color: var(--clr-primary-light);">${hs} - ${as}</span>
              ${awayCrest ? `<img src="${awayCrest}" alt="${away.shortName}" style="width:40px;height:40px;object-fit:contain;" onerror="this.style.display='none'" />` : ''}
            </div>
            <div style="padding: var(--sp-md);">
              <span style="font-size: var(--fs-xs); color: var(--clr-primary-light); font-weight: 600;">${compEmoji} ${comp}</span>
              <h4 style="font-size: var(--fs-md); margin: 8px 0;">${headline}</h4>
              <p style="font-size: var(--fs-sm); color: var(--clr-text-secondary); margin: 0;">${summary}</p>
            </div>
          </div>
        `;
      }).join('');

      newsGrid.innerHTML = newsCards;

      // Hover effect
      newsGrid.querySelectorAll('.news-card').forEach(card => {
        card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-4px)');
        card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');
      });

    } catch (err) {
      console.warn('[News] Could not load news:', err);
      const newsGrid = document.getElementById('news-grid');
      if (newsGrid) {
        newsGrid.innerHTML = `
          <div style="text-align:center; padding: var(--sp-lg); color: var(--clr-text-muted); grid-column: 1 / -1;">
            📰 No se pudieron cargar las noticias. Intenta de nuevo más tarde.
          </div>
        `;
      }
    }
  }

  // Initial render
  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title" id="page-title">⚽ Partidos del Día</h1>
        <p class="page-subtitle" id="page-date">${formatDate(currentDate)}</p>
      </div>
      <div id="dashboard-news-container"></div>
      ${renderDatePicker(currentDate, () => {})}
      <div id="dashboard-matches" style="margin-top: var(--sp-lg);">
        ${renderSkeleton('cards', 8)}
      </div>
    </div>
  `;

  // Render news at the top
  const newsContainer = document.getElementById('dashboard-news-container');
  if (newsContainer) {
    renderNewsSection(newsContainer);
  }

  // Attach date picker
  attachDatePickerEvents((newDate) => {
    currentDate = newDate;
    const dateLabel = document.getElementById('page-date');
    if (dateLabel) dateLabel.textContent = formatDate(newDate);
    loadMatches(newDate);
  });

  // Load initial data
  await loadMatches(currentDate);

  // Auto-refresh every 2 minutes
  refreshTimer = setInterval(() => {
    loadMatches(currentDate);
  }, 120000);

  // Return cleanup function
  return () => {
    if (refreshTimer) clearInterval(refreshTimer);
  };
}
