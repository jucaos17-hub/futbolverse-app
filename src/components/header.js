import { navigateTo } from '../router.js';

export function renderHeader(container) {
  container.innerHTML = `
    <div class="header">
      <div class="header__inner">
        <div class="header__logo" id="header-logo">
          <span class="header__logo-icon">⚽</span>
          <span class="header__logo-text">FútbolVerse</span>
        </div>
        <nav class="header__nav" id="header-nav">
          <a class="nav-link" data-href="#/live" id="nav-live" style="color: #ff3366; font-weight: 800;">
            <span class="nav-link__icon" style="animation: pulse 2s infinite;">🔴</span>
            <span>En Vivo</span>
          </a>
          <a class="nav-link active" data-href="#/" id="nav-dashboard">
            <span class="nav-link__icon">🏠</span>
            <span>Partidos</span>
          </a>
          <a class="nav-link" data-href="#/competitions" id="nav-competitions">
            <span class="nav-link__icon">🏆</span>
            <span>Competiciones</span>
          </a>
          <a class="nav-link" data-href="#/standings" id="nav-standings">
            <span class="nav-link__icon">📊</span>
            <span>Clasificación</span>
          </a>
          <a class="nav-link" data-href="#/scorers" id="nav-scorers">
            <span class="nav-link__icon">👟</span>
            <span>Goleadores</span>
          </a>
          <a class="nav-link" data-href="#/iptv" id="nav-iptv">
            <span class="nav-link__icon">📺</span>
            <span>Mi TV</span>
          </a>
        </nav>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button onclick="if(window.openThemeSelectorModal) window.openThemeSelectorModal()" class="icon-btn" aria-label="Cambiar Tema" title="Personalizar App" style="background: var(--clr-surface-alt); border: 1px solid var(--clr-border); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer;">
            🎨
          </button>
        </div>
        <button class="header__hamburger" id="hamburger-btn" aria-label="Menú">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  `;

  // Logo click → home
  document.getElementById('header-logo').addEventListener('click', () => {
    navigateTo('/');
  });

  // Nav links
  container.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('data-href');
      navigateTo(href.replace('#', ''));
      // Close mobile nav
      document.getElementById('header-nav').classList.remove('open');
    });
  });

  // Hamburger
  document.getElementById('hamburger-btn').addEventListener('click', () => {
    document.getElementById('header-nav').classList.toggle('open');
  });
}
