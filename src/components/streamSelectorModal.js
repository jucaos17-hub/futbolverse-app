import { fetchLiveChannels } from '../services/liveAggregator.js';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * Abre un modal con los canales de deportes filtrados por los broadcasters sugeridos.
 * @param {string} matchTitle - Título del partido (ej: "Colombia vs Brasil")
 * @param {string[]} suggestedNames - Nombres de canales sugeridos (ej: ["ESPN", "Fox Sports"])
 */
export async function openMatchStreamSelector(matchTitle, suggestedNames = []) {
  let container = document.getElementById('stream-selector-modal');
  if (!container) {
    container = document.createElement('div');
    container.id = 'stream-selector-modal';
    document.body.appendChild(container);
  }

  container.innerHTML = `
    <div id="ss-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 3000; display: flex; align-items: flex-end; justify-content: center; padding: 0;">
      <div id="ss-content" style="background: var(--clr-surface); width: 100%; max-width: 500px; max-height: 70vh; border-top-left-radius: 24px; border-top-right-radius: 24px; display: flex; flex-direction: column; overflow: hidden; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        
        <div style="background: var(--clr-surface-alt); padding: 16px; border-bottom: 1px solid var(--clr-border); position: relative; text-align: center;">
          <div style="width: 40px; height: 5px; background: var(--clr-border); border-radius: 3px; margin: 0 auto 12px auto;"></div>
          <button id="ss-close" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; color: var(--clr-text-muted); cursor: pointer;">&times;</button>
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 4px;">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: #ff3366; animation: pulse 1.5s infinite;"></span>
            <h3 style="margin: 0; font-size: 16px; color: var(--clr-text);">Canales de Transmisión</h3>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #ff3366; font-weight: bold;">${matchTitle}</p>
        </div>

        <div id="ss-channel-list" style="flex: 1; overflow-y: auto; padding: 12px;">
           <div style="text-align:center; padding: 2rem; color: var(--clr-text-muted);">
             <div style="font-size: 24px; margin-bottom: 8px;">📡</div>
             Cargando canales...
           </div>
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
    const allChannels = await fetchLiveChannels();
    const listContainer = document.getElementById('ss-channel-list');
    
    if (!listContainer) return;

    if (allChannels.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center; padding: 2rem; color: var(--clr-text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">📡</div>
          No se encontraron canales disponibles.
          <br><small>Verifica tu conexión a internet.</small>
        </div>`;
      return;
    }

    // Filter channels by suggested names if provided
    let filteredChannels = allChannels;
    if (suggestedNames && suggestedNames.length > 0) {
      filteredChannels = allChannels.filter(ch => {
        const chName = ch.name.toLowerCase();
        return suggestedNames.some(suggested => {
          const s = suggested.toLowerCase().trim();
          return chName.includes(s) || s.includes(chName);
        });
      });
      
      // If no matches found, show all sports channels as fallback
      if (filteredChannels.length === 0) {
        filteredChannels = allChannels;
      }
    }

    // Build channel list as a clean vertical list (not grid)
    let html = '';
    
    if (suggestedNames && suggestedNames.length > 0 && filteredChannels.length < allChannels.length) {
      html += `<div style="font-size: 11px; color: var(--clr-text-muted); text-align: center; margin-bottom: 12px; padding: 8px; background: rgba(255,51,102,0.05); border-radius: 8px;">
        📺 Mostrando canales sugeridos para este partido
      </div>`;
    }

    html += filteredChannels.map(ch => {
      const logo = ch.logo || '';
      const logoHtml = logo 
        ? `<img src="${logo}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px; background: #fff; padding: 2px; flex-shrink: 0;" onerror="this.style.display='none'">`
        : `<div style="width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, #1a1a2e, #16213e); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">📺</div>`;
      
      return `
        <div class="ss-channel-item" data-url="${ch.url}" data-name="${ch.name}" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--clr-surface-alt); border-radius: 12px; margin-bottom: 8px; cursor: pointer; border: 1px solid var(--clr-border); transition: all 0.2s;">
          ${logoHtml}
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ch.name}</div>
            <div style="font-size: 11px; color: var(--clr-text-muted);">${ch.category || 'Deportes'}</div>
          </div>
          <div style="color: #ff3366; font-size: 20px; flex-shrink: 0;">▶</div>
        </div>
      `;
    }).join('');

    listContainer.innerHTML = html;

    // Add click listeners
    const items = listContainer.querySelectorAll('.ss-channel-item');
    items.forEach(item => {
      item.addEventListener('mouseover', () => { 
        item.style.borderColor = '#ff3366'; 
        item.style.background = 'rgba(255,51,102,0.05)';
      });
      item.addEventListener('mouseout', () => { 
        item.style.borderColor = 'var(--clr-border)'; 
        item.style.background = 'var(--clr-surface-alt)';
      });
      item.onclick = async () => {
        const url = item.getAttribute('data-url');
        closeModal();
        
        // Abrir en el navegador integrado de Capacitor
        if (Capacitor.isNativePlatform()) {
          try {
            await Browser.open({ url: url });
          } catch (e) {
            console.error('Error abriendo en browser:', e);
            // Fallback: intentar con el player interno
            if (window.playInternalStream) {
              window.playInternalStream(url);
            }
          }
        } else {
          // En navegador web, abrir en nueva pestaña
          window.open(url, '_blank');
        }
      };
    });

  } catch (error) {
    console.error('Error cargando canales:', error);
    const listContainer = document.getElementById('ss-channel-list');
    if (listContainer) {
      listContainer.innerHTML = `
        <div style="text-align:center; padding: 2rem; color: #e63946;">
          <div style="font-size: 32px; margin-bottom: 8px;">⚠️</div>
          Error al cargar canales.
          <br><small>Verifica tu conexión a internet.</small>
        </div>`;
    }
  }
}
