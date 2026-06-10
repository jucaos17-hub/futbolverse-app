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

      renderMatchesList(matches, date, isUpcoming);
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

  function renderMatchesList(matches, date, isUpcoming = false) {
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
            ${group.matches.map(m => renderMatchCard(m)).join('')}
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

  function renderNewsSection(container) {
    // We add a mock news section since the API doesn't provide news
    const newsHtml = `
      <div class="news-section anim-fade-up" style="margin-bottom: var(--sp-xl);">
        <h2 style="font-size: var(--fs-lg); margin-bottom: var(--sp-md); display: flex; align-items: center; gap: 8px;">
          📰 Noticias Destacadas
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--sp-md);">
          
          <div class="news-card" style="background: var(--clr-surface); border: 1px solid var(--clr-border); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; transition: transform 0.2s;">
            <div style="height: 140px; background: url('https://images.unsplash.com/photo-1518605368461-1e1e38ce8058?auto=format&fit=crop&w=600&q=80') center/cover;"></div>
            <div style="padding: var(--sp-md);">
              <span style="font-size: var(--fs-xs); color: var(--clr-primary-light); font-weight: 600;">Copa Mundial 2026</span>
              <h4 style="font-size: var(--fs-md); margin: 8px 0;">Todo listo para la inauguración en el Estadio Azteca</h4>
              <p style="font-size: var(--fs-sm); color: var(--clr-text-secondary); margin: 0;">México se prepara para recibir el partido inaugural de la Copa del Mundo con una ceremonia histórica.</p>
            </div>
          </div>

          <div class="news-card" style="background: var(--clr-surface); border: 1px solid var(--clr-border); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; transition: transform 0.2s;">
            <div style="height: 140px; background: url('https://images.unsplash.com/photo-1551280857-2b9ebf241ac4?auto=format&fit=crop&w=600&q=80') center/cover;"></div>
            <div style="padding: var(--sp-md);">
              <span style="font-size: var(--fs-xs); color: var(--clr-primary-light); font-weight: 600;">Champions League</span>
              <h4 style="font-size: var(--fs-md); margin: 8px 0;">El nuevo formato genera altas expectativas</h4>
              <p style="font-size: var(--fs-sm); color: var(--clr-text-secondary); margin: 0;">Los equipos se adaptan al nuevo formato de liga que promete más enfrentamientos directos entre potencias.</p>
            </div>
          </div>

          <div class="news-card" style="background: var(--clr-surface); border: 1px solid var(--clr-border); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; transition: transform 0.2s;">
            <div style="height: 140px; background: url('https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=600&q=80') center/cover;"></div>
            <div style="padding: var(--sp-md);">
              <span style="font-size: var(--fs-xs); color: var(--clr-primary-light); font-weight: 600;">Mercado de Fichajes</span>
              <h4 style="font-size: var(--fs-md); margin: 8px 0;">Movimientos clave en las ligas europeas</h4>
              <p style="font-size: var(--fs-sm); color: var(--clr-text-secondary); margin: 0;">Resumen de las transferencias más importantes de cara a la nueva temporada en La Liga y Premier League.</p>
            </div>
          </div>

        </div>
      </div>
    `;
    
    // Append to container
    container.insertAdjacentHTML('beforeend', newsHtml);
    
    // Add simple hover effect
    container.querySelectorAll('.news-card').forEach(card => {
      card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-4px)');
      card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0)');
    });
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
