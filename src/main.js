import './styles/index.css';
import { renderHeader } from './components/header.js';
import { registerRoute, initRouter, navigateTo } from './router.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderCompetitions } from './pages/competitions.js';
import { renderStandingsPage } from './pages/standings.js';
import { renderMatchDetail } from './pages/matchDetail.js';
import { renderScorersPage } from './pages/scorers.js';
import { renderTeamPage } from './pages/team.js';
import { renderIptvPage } from './pages/iptvPage.js';
import { renderLivePage } from './pages/livePage.js';
import { clearExpiredCache } from './services/cache.js';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { showMatchDetails } from './components/matchDetailsModal.js';
import { openMatchStreamSelector } from './components/streamSelectorModal.js';
import { loadSavedTheme, openThemeSelectorModal } from './components/themeManager.js';
import { initializePushNotifications } from './services/pushManager.js';

// Cargar colores de equipo preferido
loadSavedTheme();

// Iniciar Motor de Notificaciones Push (Solo en Android Nativo)
initializePushNotifications();

// Export navigateTo globally for onclick handlers
window.navigateTo = navigateTo;
window.openMatchDetails = showMatchDetails;
window.openMatchStreamSelector = openMatchStreamSelector;
window.openThemeSelectorModal = openThemeSelectorModal;

// Global function to play internal IPTV stream
window.playInternalStream = (streamUrl) => {
  // Guardamos el stream en el localStorage temporalmente
  localStorage.setItem('iptv_direct_play_url', streamUrl);
  // Navegamos al IPTV player
  navigateTo('/iptv');
};

// Global listener to open external links using Capacitor Browser when in native app
document.addEventListener('click', async (e) => {
  const link = e.target.closest('a');
  if (link && link.href && link.target === '_blank') {
    const isNativeApp = Capacitor.isNativePlatform();
    if (isNativeApp) {
      e.preventDefault();
      await Browser.open({ url: link.href });
    }
  }
});

// Initialize routing
const initialHash = window.location.hash || '#/';
navigateTo(initialHash.replace('#', ''));

// Hide Splash Screen after App is ready
window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('fv-splash');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.visibility = 'hidden';
      setTimeout(() => splash.remove(), 600); // Wait for transition
    }
  }, 800); // Little extra delay so it looks nice and everything has rendered
});

// Initialize header
const headerEl = document.getElementById('main-header');
renderHeader(headerEl);

// Register routes
registerRoute('/', renderDashboard);
registerRoute('/competitions', renderCompetitions);
registerRoute('/standings', (container) => renderStandingsPage(container, { code: 'PL' }));
registerRoute('/standings/:code', renderStandingsPage);
registerRoute('/match/:id', renderMatchDetail);
registerRoute('/scorers', (container) => renderScorersPage(container, { code: 'PL' }));
registerRoute('/scorers/:code', renderScorersPage);
registerRoute('/team/:id', renderTeamPage);
registerRoute('/iptv', renderIptvPage);
registerRoute('/live', renderLivePage);

// Start router
initRouter();

// Clear expired cache on startup
clearExpiredCache();

console.log('⚽ FútbolVerse initialized');
