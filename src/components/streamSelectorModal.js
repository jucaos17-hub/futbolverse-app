import { fetchLiveChannels } from '../services/liveAggregator.js';

export async function openMatchStreamSelector(matchTitle) {
  // Mostrar un indicador de carga
  let container = document.getElementById('stream-selector-modal');
  if (!container) {
    container = document.createElement('div');
    container.id = 'stream-selector-modal';
    document.body.appendChild(container);
  }

  container.innerHTML = `
    <div id="ss-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 3000; display: flex; align-items: flex-end; justify-content: center; padding: 0;">
      <div id="ss-content" style="background: var(--clr-surface); width: 100%; max-width: 500px; height: 60vh; border-top-left-radius: 24px; border-top-right-radius: 24px; display: flex; flex-direction: column; overflow: hidden; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        
        <div style="background: var(--clr-surface-alt); padding: 16px; border-bottom: 1px solid var(--clr-border); position: relative; text-align: center;">
          <div style="width: 40px; height: 5px; background: var(--clr-border); border-radius: 3px; margin: 0 auto 16px auto;"></div>
          <button id="ss-close" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; color: var(--clr-text-muted); cursor: pointer;">&times;</button>
          <h3 style="margin: 0; font-size: 16px; color: var(--clr-text);">¿En qué canal deseas ver el partido?</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #ff3366; font-weight: bold;">${matchTitle}</p>
        </div>

        <div id="ss-channel-list" style="flex: 1; overflow-y: auto; padding: 16px; background: var(--clr-background);">
           <div style="text-align:center; padding: 2rem; color: var(--clr-text-muted);">Cargando canales de Deportes...</div>
        </div>
      </div>
    </div>
  `;

  // Animate Entrance
  const content = document.getElementById('ss-content');
  requestAnimationFrame(() => {
    content.style.transform = 'translateY(0)';
  });

  // Close Logic
  const closeBtn = document.getElementById('ss-close');
  const backdrop = document.getElementById('ss-backdrop');
  
  const closeModal = () => {
    content.style.transform = 'translateY(100%)';
    setTimeout(() => {
      container.innerHTML = '';
    }, 300);
  };

  closeBtn.onclick = closeModal;
  backdrop.onclick = (e) => {
    if (e.target === backdrop) closeModal();
  };

  // Fetch channels
  try {
    const { categories } = await fetchLiveChannels();
    // Deportes usually is mapped to "Deportes" group or is the main content of deportes.m3u
    // We'll flat map all channels since liveAggregator is currently only fetching deportes.m3u
    let allChannels = [];
    categories.forEach(cat => {
      allChannels = allChannels.concat(cat.channels);
    });

    const listContainer = document.getElementById('ss-channel-list');
    
    if (allChannels.length === 0) {
      listContainer.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--clr-text-muted);">No se encontraron canales en tu lista M3U.</div>';
      return;
    }

    listContainer.innerHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px;">' + 
      allChannels.map(ch => {
        // Use placeholder if no logo
        const logo = ch.logo || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="#333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="12">TV</text></svg>');
        
        return \`
          <div class="ss-channel-card" data-url="\${ch.url}" style="background: var(--clr-surface-alt); border-radius: 12px; padding: 12px; text-align: center; cursor: pointer; border: 1px solid var(--clr-border); transition: all 0.2s;">
            <img src="\${logo}" style="width: 48px; height: 48px; object-fit: contain; margin-bottom: 8px; border-radius: 8px; background: #fff; padding: 2px;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'64\\' height=\\'64\\'%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' fill=\\'%23333\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23fff\\' font-family=\\'sans-serif\\' font-size=\\'12\\'%3ETV%3C/text%3E%3C/svg%3E'">
            <div style="font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="\${ch.name}">\${ch.name}</div>
          </div>
        \`;
      }).join('') + '</div>';

    // Add click listeners to cards
    const cards = listContainer.querySelectorAll('.ss-channel-card');
    cards.forEach(card => {
      card.addEventListener('mouseover', () => { card.style.borderColor = '#ff3366'; card.style.transform = 'scale(1.05)'; });
      card.addEventListener('mouseout', () => { card.style.borderColor = 'var(--clr-border)'; card.style.transform = 'scale(1)'; });
      card.onclick = () => {
        const url = card.getAttribute('data-url');
        closeModal();
        if (window.playInternalStream) {
          window.playInternalStream(url);
        }
      };
    });

  } catch (error) {
    console.error('Error cargando canales para el selector:', error);
    document.getElementById('ss-channel-list').innerHTML = '<div style="text-align:center; padding: 2rem; color: #e63946;">Error al cargar la lista de canales. Verifica tu conexión a internet o el archivo M3U.</div>';
  }
}
