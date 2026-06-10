import { renderIptvPlayer, attachIptvEvents } from '../components/iptvPlayer.js';

export function renderIptvPage(container) {
  // We use a similar layout to the other pages
  container.innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">📡 Mi TV / IPTV</h1>
        <p class="page-subtitle">Conecta tu cuenta de Magma, Smarters, o tu lista M3U y disfruta en vivo</p>
      </div>
      
      <div style="margin-top: 1rem; margin-bottom: 2rem;">
        ${renderIptvPlayer()}
      </div>
    </div>
  `;

  // Wait a tick for the DOM to update, then attach events
  setTimeout(() => {
    attachIptvEvents();
  }, 0);

  // We must return a cleanup function or null
  return () => {
    // any cleanup if needed
  };
}
