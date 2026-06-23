import { fetchLiveChannels } from '../services/liveAggregator.js';
import { fetchEPG } from '../services/epgService.js';
import { renderLiveChannelCard } from '../components/liveMatchCard.js';
import { Capacitor } from '@capacitor/core';
import { createNativeHlsLoader, shouldUseNativeLoader } from '../services/hlsNativeLoader.js';

let currentHlsInstance = null;

export async function renderLivePage(container) {
  container.innerHTML = `
    <div class="container" style="padding-top: 1rem;">
      <!-- Header Section -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem;">
        <div>
          <h1 class="page-title" style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #ff3366; animation: pulse 2s infinite;">🔴</span> En Vivo
          </h1>
          <p class="page-subtitle">Transmisiones de deportes en vivo y canales Premium en tiempo real</p>
        </div>
      </div>

      <!-- Filters (Horizontal scroll) -->
      <div style="margin-bottom: 1.5rem;">
        <div id="live-filters" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; -ms-overflow-style: none;">
          <!-- Filtros se cargarán dinámicamente -->
          <div class="skeleton" style="width: 80px; height: 32px; border-radius: 16px;"></div>
          <div class="skeleton" style="width: 120px; height: 32px; border-radius: 16px;"></div>
          <div class="skeleton" style="width: 100px; height: 32px; border-radius: 16px;"></div>
        </div>
      </div>

      <!-- Grid of Channels -->
      <div id="live-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; padding-bottom: 3rem;">
        <!-- Skeletons -->
        ${Array(8).fill('<div class="skeleton" style="height: 200px; border-radius: var(--radius-lg);"></div>').join('')}
      </div>

    </div>
  `;

  // Inject Modal into document.body and ensure it's fresh
  let oldBackdrop = document.getElementById('live-modal-backdrop');
  if (oldBackdrop) {
    oldBackdrop.remove();
  }

  const modalBackdrop = document.createElement('div');
  modalBackdrop.id = 'live-modal-backdrop';
  modalBackdrop.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 9999; align-items: center; justify-content: center; padding: 1rem;';
  modalBackdrop.innerHTML = `
      <div id="live-modal-content" style="background: var(--clr-surface); width: 100%; max-width: 800px; border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.1); overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); transform: scale(0.95); transition: transform 0.3s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--clr-border); background: var(--clr-surface-alt);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 8px; height: 8px; background: #ff3366; border-radius: 50%; animation: pulse 2s infinite;"></span>
            <h3 id="live-modal-title" style="margin: 0; font-size: var(--fs-md);">Cargando...</h3>
          </div>
          <button id="live-modal-close" style="background: transparent; border: none; color: var(--clr-text-muted); font-size: 24px; cursor: pointer; line-height: 1;">&times;</button>
        </div>
        <div style="position: relative; width: 100%; padding-top: 56.25%; background: #000;">
          <video id="live-modal-video" controls playsinline style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></video>
          <div id="live-modal-error" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); color: #ff5555; align-items: center; justify-content: center; text-align: center; padding: 2rem;"></div>
        </div>
        <div style="padding: 12px 16px; background: var(--clr-surface-alt); display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: var(--fs-sm); color: var(--clr-text-muted);">
            Servidor: <strong style="color: var(--clr-text);">TDTChannels Premium</strong>
          </div>
          <button id="live-modal-fullscreen" class="btn btn--secondary" style="font-size: var(--fs-xs); padding: 6px 12px;">⛶ Pantalla Completa</button>
        </div>
      </div>
  `;
  document.body.appendChild(modalBackdrop);

  // Hide scrollbar for filters
  const style = document.createElement('style');
  style.innerHTML = `
    #live-filters::-webkit-scrollbar { display: none; }
    .filter-chip {
      background: var(--clr-surface-alt);
      border: 1px solid var(--clr-border);
      color: var(--clr-text-muted);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: var(--fs-sm);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .filter-chip:hover {
      background: var(--clr-surface);
      color: var(--clr-text);
    }
    .filter-chip.active {
      background: rgba(255, 51, 102, 0.1);
      border-color: #ff3366;
      color: #ff3366;
      font-weight: 600;
    }
    body.modal-open {
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);

  // Fetch Data concurrently
  const [channels, epgMap] = await Promise.all([
    fetchLiveChannels(),
    fetchEPG()
  ]);
  
  // Asignar el programa actual a cada canal
  if (channels && epgMap) {
    channels.forEach(ch => {
      if (ch.id && epgMap.has(ch.id)) {
        ch.currentProgram = epgMap.get(ch.id);
      }
    });
  }

  const filtersContainer = document.getElementById('live-filters');
  const gridContainer = document.getElementById('live-grid');
  
  if (!channels || channels.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--clr-text-muted);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📡</div>
        <h3>No hay transmisiones disponibles</h3>
        <p>No se pudo conectar con el servidor de reproducción o la lista de deportes está vacía.</p>
      </div>
    `;
    filtersContainer.innerHTML = '';
    return;
  }

  // Extract unique categories
  const categories = ['Todos', ...new Set(channels.map(c => c.category))];
  let activeCategory = 'Todos';

  // Render Filters
  function renderFilters() {
    filtersContainer.innerHTML = categories.map(cat => `
      <button class="filter-chip ${cat === activeCategory ? 'active' : ''}" data-cat="${cat}">
        ${cat}
      </button>
    `).join('');

    filtersContainer.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeCategory = e.target.getAttribute('data-cat');
        renderFilters();
        renderGrid();
      });
    });
  }

  // Render Grid
  function renderGrid() {
    // Only render top 100 to avoid DOM lag, or filter by category
    let filtered = channels;
    if (activeCategory !== 'Todos') {
      filtered = channels.filter(c => c.category === activeCategory);
    } else {
      // Mostrar hasta 150 canales para no omitir transmisiones de deportes
      filtered = channels.slice(0, 150);
    }

    if (filtered.length === 0) {
      gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 2rem;">No hay canales en esta categoría</div>`;
      return;
    }

    gridContainer.innerHTML = filtered.map(c => renderLiveChannelCard(c)).join('');

    // Attach click events - open in browser
    gridContainer.querySelectorAll('.live-card').forEach(card => {
      card.addEventListener('click', async () => {
        const url = card.getAttribute('data-url');
        const name = card.getAttribute('data-name');
        
        if (Capacitor.isNativePlatform()) {
          try {
            const { Browser } = await import('@capacitor/browser');
            await Browser.open({ url: url });
          } catch (e) {
            console.error('Error abriendo canal:', e);
            // Fallback al modal interno
            openModal(name, url);
          }
        } else {
          // En navegador web, abrir en nueva pestaña
          window.open(url, '_blank');
        }
      });
    });
  }

  // Modal Logic
  const modalContent = document.getElementById('live-modal-content');
  const modalClose = document.getElementById('live-modal-close');
  const modalTitle = document.getElementById('live-modal-title');
  const modalVideo = document.getElementById('live-modal-video');
  const modalError = document.getElementById('live-modal-error');
  const modalFullscreen = document.getElementById('live-modal-fullscreen');

  function openModal(name, url) {
    modalTitle.textContent = name;
    modalBackdrop.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    // Animate in
    requestAnimationFrame(() => {
      modalContent.style.transform = 'scale(1)';
    });

    playStream(url);
  }

  function closeModal() {
    modalContent.style.transform = 'scale(0.95)';
    setTimeout(() => {
      modalBackdrop.style.display = 'none';
      document.body.classList.remove('modal-open');
      if (currentHlsInstance) {
        currentHlsInstance.destroy();
        currentHlsInstance = null;
      }
      modalVideo.pause();
      modalVideo.removeAttribute('src');
      modalVideo.load();
    }, 300);
  }

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  modalFullscreen.addEventListener('click', () => {
    const videoWrapper = modalVideo.parentElement;
    if (videoWrapper.requestFullscreen) {
      videoWrapper.requestFullscreen();
    } else if (modalVideo.webkitEnterFullscreen) {
      modalVideo.webkitEnterFullscreen();
    }
  });

  function playStream(streamUrl) {
    modalError.style.display = 'none';

    if (currentHlsInstance) {
      currentHlsInstance.destroy();
      currentHlsInstance = null;
    }

    const isNative = Capacitor.isNativePlatform();

    // Prioritize HLS.js if supported (works better on Android WebView and PC)
    if (window.Hls && window.Hls.isSupported()) {
      const hlsConfig = {};

      if (isNative && shouldUseNativeLoader()) {
        // On native Capacitor: use custom loader that bypasses CapacitorHttp
        // This prevents the native bridge from corrupting binary HLS segments
        const NativeLoader = createNativeHlsLoader();
        hlsConfig.loader = NativeLoader;
        hlsConfig.enableFetchAPI = false;
        console.log('[HLS] Using NativeXHRLoader to bypass CapacitorHttp');
      } else {
        // On browser: use fetch with CORS proxy
        hlsConfig.enableFetchAPI = true;
        hlsConfig.xhrSetup = function(xhr, url) {
          try {
            const urlObj = new URL(url);
            if (urlObj.origin !== window.location.origin) {
              const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
              xhr.open('GET', proxyUrl, true);
            }
          } catch(e) {}
        };
      }

      currentHlsInstance = new window.Hls(hlsConfig);
      currentHlsInstance.loadSource(streamUrl);
      currentHlsInstance.attachMedia(modalVideo);
      currentHlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
        modalVideo.play().catch(() => {});
      });
      currentHlsInstance.on(window.Hls.Events.ERROR, (event, data) => {
        console.warn('[HLS] Error:', data.type, data.details, data.reason);
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              // On native, try one media error recovery before giving up
              if (isNative && data.details === 'manifestLoadError') {
                console.log('[HLS] Retrying manifest load...');
                currentHlsInstance.loadSource(streamUrl);
              } else {
                currentHlsInstance.destroy();
                showError(isNative ? "Error de conexión al canal. Intenta de nuevo." : "Error de CORS en el navegador. Usa la APK nativa.");
              }
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.log('[HLS] Attempting media error recovery...');
              currentHlsInstance.recoverMediaError();
              break;
            default:
              currentHlsInstance.destroy();
              showError("Error fatal al reproducir el canal.");
              break;
          }
        }
      });
    } 
    // Fallback for iOS (Safari does not support MediaSource API, but natively supports HLS)
    else if (modalVideo.canPlayType('application/vnd.apple.mpegurl')) {
      modalVideo.src = streamUrl;
      modalVideo.play().catch(e => showError("Error nativo al reproducir."));
      
      modalVideo.onerror = () => {
        showError("Error de red o formato inválido (Native).");
      };
    } else {
      showError("Tu dispositivo no soporta reproducción HLS.");
    }
  }

  function showError(msg) {
    modalError.textContent = msg;
    modalError.style.display = 'flex';
  }

  // Initial Render
  renderFilters();
  renderGrid();

  return () => {
    // Cleanup on page leave
    document.head.removeChild(style);
    document.body.classList.remove('modal-open');
    if (currentHlsInstance) {
      currentHlsInstance.destroy();
      currentHlsInstance = null;
    }
    const existing = document.getElementById('live-modal-backdrop');
    if (existing) existing.remove();
  };
}
