import { Capacitor, registerPlugin } from '@capacitor/core';
import { fetchAndParseM3U } from '../services/iptv.js';

const PiP = registerPlugin('PiP');

export function renderIptvPlayer() {
  return `
    <div class="iptv-container" style="background: var(--clr-surface); border: 1px solid var(--clr-border); border-radius: var(--radius-lg); overflow: hidden; margin-top: var(--sp-lg);">
      
      <!-- IPTV Header / Input -->
      <div style="padding: var(--sp-md); border-bottom: 1px solid var(--clr-border); background: var(--clr-surface-alt);">
        <h3 style="margin-bottom: var(--sp-sm); display: flex; align-items: center; gap: 8px;">
    <div style="display: flex; flex-direction: column; gap: var(--sp-md); background: var(--clr-surface); padding: var(--sp-md); border-radius: var(--radius-lg); border: 1px solid var(--clr-border);">
      
      <!-- Connect Form -->
      <div style="display: flex; flex-direction: column; gap: var(--sp-sm); width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <label style="font-size: var(--fs-xs); color: var(--clr-text-muted);">Mis Listas Guardadas</label>
          <button id="iptv-save-list-btn" class="btn btn--secondary" style="font-size: 11px; padding: 4px 8px; height: auto;" title="Guardar la URL escrita actualmente como una nueva lista">💾 Guardar Lista</button>
        </div>
        <select id="iptv-saved-lists" style="width: 100%; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--clr-border); background: var(--clr-surface-alt); color: var(--clr-text); font-size: var(--fs-sm); outline: none;">
          <option value="">-- Seleccionar o Escribir Manualmente --</option>
        </select>
        
        <div style="display: flex; flex-wrap: wrap; gap: var(--sp-sm); align-items: flex-end; margin-top: 8px;">
          <div style="flex: 1; min-width: 250px;">
            <label style="display: block; font-size: var(--fs-xs); color: var(--clr-text-muted); margin-bottom: 4px;">Servidor (URL Lista M3U o Portal IPTV)</label>
            <input type="url" id="iptv-url-input" placeholder="Ej: http://.../lista.m3u" style="width: 100%; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--clr-border); background: var(--clr-background); color: var(--clr-text);" />
          </div>
          <div style="flex: 1; min-width: 120px;">
            <label style="display: block; font-size: var(--fs-xs); color: var(--clr-text-muted); margin-bottom: 4px;">Usuario (Opcional)</label>
            <input type="text" id="iptv-user-input" placeholder="Usuario" style="width: 100%; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--clr-border); background: var(--clr-background); color: var(--clr-text);" />
          </div>
          <div style="flex: 1; min-width: 120px;">
            <label style="display: block; font-size: var(--fs-xs); color: var(--clr-text-muted); margin-bottom: 4px;">Contraseña (Opcional)</label>
            <input type="password" id="iptv-pass-input" placeholder="Contraseña" style="width: 100%; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--clr-border); background: var(--clr-background); color: var(--clr-text);" />
          </div>
          <button id="iptv-load-btn" class="btn btn--primary" style="white-space: nowrap; height: 38px;">Cargar URL</button>
        </div>
      </div>

      <div id="iptv-error-msg" style="display: none; color: #ff5555; font-size: var(--fs-sm); background: rgba(255,85,85,0.1); padding: 8px; border-radius: var(--radius-sm); border: 1px solid rgba(255,85,85,0.2);"></div>

      <!-- Player & Channel List Area -->
      <div style="display: flex; flex-direction: row; flex-wrap: wrap; min-height: 500px; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--clr-border);">
        
        <!-- Video Player -->
        <div id="iptv-video-wrapper" style="flex: 2; min-width: 300px; background: #000; position: relative; min-height: 300px;">
          <video id="iptv-video-player" controls playsinline style="width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0;"></video>
          <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px; z-index: 10;">
            <button id="iptv-pip-btn" title="Minimizar reproductor flotante" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.3); color: white; font-size: 20px; padding: 6px 10px; border-radius: 8px; cursor: pointer; display: none; backdrop-filter: blur(4px);">🗗</button>
            <button id="iptv-cast-btn" title="Transmitir a Smart TV" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.3); color: white; font-size: 20px; padding: 6px 10px; border-radius: 8px; cursor: pointer; display: none; backdrop-filter: blur(4px);">📺</button>
            <button id="iptv-fullscreen-btn" title="Pantalla completa" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.3); color: white; font-size: 20px; padding: 6px 10px; border-radius: 8px; cursor: pointer; display: none; backdrop-filter: blur(4px);">⛶</button>
          </div>
          <div id="iptv-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; background: rgba(0,0,0,0.7); color: white;">
            <div style="font-size: 40px; margin-bottom: 10px;">🍿</div>
            <div style="font-size: var(--fs-md); font-weight: 600;">Reproductor IPTV</div>
            <div style="font-size: var(--fs-sm); color: var(--clr-text-muted); margin-top: 5px;">Selecciona un canal para comenzar</div>
          </div>
        </div>

        <!-- Channel List -->
        <div style="flex: 1; min-width: 250px; border-left: 1px solid var(--clr-border); background: var(--clr-surface); display: flex; flex-direction: column; max-height: 500px;">
          <div style="padding: var(--sp-sm); border-bottom: 1px solid var(--clr-border); background: var(--clr-surface-alt); display: flex; flex-direction: column; gap: 8px;">
            <div style="font-weight: 600; font-size: var(--fs-sm); display: flex; justify-content: space-between;">
              <span>📋 Canales</span>
              <span id="iptv-channel-count" style="font-size: 10px; color: var(--clr-primary-light); background: rgba(14, 165, 233, 0.2); padding: 2px 6px; border-radius: 10px;">0</span>
            </div>
            <input type="text" id="iptv-search-input" placeholder="Buscar canal..." style="width: 100%; padding: 6px; border-radius: var(--radius-sm); border: 1px solid var(--clr-border); background: var(--clr-background); color: var(--clr-text); font-size: var(--fs-xs);" />
          </div>
          <div id="iptv-channel-list" style="flex: 1; overflow-y: scroll; overflow-x: hidden; padding: var(--sp-sm); max-height: 460px; scrollbar-width: thin; scrollbar-color: var(--clr-primary) var(--clr-surface-alt);">
            <div style="color: var(--clr-text-muted); font-size: var(--fs-xs); text-align: center; margin-top: var(--sp-xl);">
              No hay canales cargados
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachIptvEvents() {
  const loadBtn = document.getElementById('iptv-load-btn');
  const urlInput = document.getElementById('iptv-url-input');
  const userInput = document.getElementById('iptv-user-input');
  const passInput = document.getElementById('iptv-pass-input');
  const errorMsg = document.getElementById('iptv-error-msg');
  const channelList = document.getElementById('iptv-channel-list');
  const video = document.getElementById('iptv-video-player');
  const placeholder = document.getElementById('iptv-overlay') || document.getElementById('iptv-placeholder');
  const castBtn = document.getElementById('iptv-cast-btn');
  const isNative = Capacitor.isNativePlatform();

  let hlsInstance = null;
  let cjs = null;

  // Listen to video state to trigger Android PiP capability natively
  if (video) {
    video.addEventListener('play', () => {
      if (Capacitor.isNativePlatform()) {
        PiP.setVideoPlaying({ playing: true }).catch(()=>{});
      }
    });
    video.addEventListener('pause', () => {
      if (Capacitor.isNativePlatform()) {
        PiP.setVideoPlaying({ playing: false }).catch(()=>{});
      }
    });
    video.addEventListener('ended', () => {
      if (Capacitor.isNativePlatform()) {
        PiP.setVideoPlaying({ playing: false }).catch(()=>{});
      }
    });
  }

  // Initialize Cast.js if available
  if (window.Castjs) {
    cjs = new window.Castjs();
    cjs.on('available', () => {
      // Show cast button if chromecast is available
      if (castBtn) castBtn.style.display = 'block';
    });
  }

  const searchInput = document.getElementById('iptv-search-input');
  const countBadge = document.getElementById('iptv-channel-count');
  let loadedChannels = [];
  let favorites = JSON.parse(localStorage.getItem('iptv_favorites') || '[]');

  if (!loadBtn) return;

  function renderChannelList(channelsToRender) {
    channelList.innerHTML = '';
    
    if (countBadge) countBadge.textContent = channelsToRender.length.toString();
    
    if (channelsToRender.length === 0) {
      channelList.innerHTML = '<div style="color: var(--clr-text-muted); font-size: var(--fs-xs); text-align: center; margin-top: var(--sp-xl);">No se encontraron canales</div>';
      return;
    }

    // Separate favorites
    const favChannels = [];
    const otherChannels = [];
    channelsToRender.forEach(ch => {
      if (favorites.includes(ch.name)) {
        favChannels.push({...ch, group: 'Favoritos ⭐'});
      } else {
        otherChannels.push(ch);
      }
    });

    const finalChannels = [...favChannels, ...otherChannels];

    // Performance limit for huge lists (like iptv-org which has 11k+ channels)
    const MAX_RENDER = 200;
    const isTruncated = finalChannels.length > MAX_RENDER;
    const visibleChannels = isTruncated ? finalChannels.slice(0, MAX_RENDER) : finalChannels;

    let currentGroup = '';
    visibleChannels.forEach(ch => {
      if (ch.group !== currentGroup) {
        currentGroup = ch.group;
        const groupHeader = document.createElement('div');
        groupHeader.style.padding = '8px 4px';
        groupHeader.style.fontSize = '11px';
        groupHeader.style.fontWeight = 'bold';
        groupHeader.style.color = 'var(--clr-primary-light)';
        groupHeader.style.marginTop = '8px';
        groupHeader.textContent = currentGroup;
        channelList.appendChild(groupHeader);
      }

      const btn = document.createElement('button');
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.gap = '8px';
      btn.style.width = '100%';
      btn.style.padding = '8px';
      btn.style.border = 'none';
      btn.style.background = 'transparent';
      btn.style.color = 'var(--clr-text)';
      btn.style.textAlign = 'left';
      btn.style.cursor = 'pointer';
      btn.style.borderRadius = 'var(--radius-sm)';
      btn.style.borderBottom = '1px solid var(--clr-border)';
      
      btn.addEventListener('mouseenter', () => btn.style.background = 'var(--clr-surface-alt)');
      btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');

      const isFav = favorites.includes(ch.name);

      btn.innerHTML = `
        ${ch.logo ? `<img src="${ch.logo}" alt="" style="width: 24px; height: 24px; object-fit: contain; border-radius: 4px;" onerror="this.style.display='none'" />` : '<div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: #333; border-radius: 4px; font-size: 10px;">📺</div>'}
        <span style="font-size: var(--fs-xs); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${ch.name}</span>
        <div class="fav-btn" style="color: ${isFav ? '#FFD700' : 'var(--clr-text-muted)'}; padding: 0 4px; font-size: 18px;">
          ${isFav ? '★' : '☆'}
        </div>
      `;

      const favBtn = btn.querySelector('.fav-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (favorites.includes(ch.name)) {
          favorites = favorites.filter(f => f !== ch.name);
        } else {
          favorites.push(ch.name);
        }
        localStorage.setItem('iptv_favorites', JSON.stringify(favorites));
        
        // Refresh view with current search term
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        if (term) {
           const filtered = loadedChannels.filter(c => c.name.toLowerCase().includes(term) || (c.group && c.group.toLowerCase().includes(term)));
           renderChannelList(filtered);
        } else {
           renderChannelList(loadedChannels);
        }
      });

      btn.addEventListener('click', () => {
        playStream(ch.url);
      });

      channelList.appendChild(btn);
    });

    if (isTruncated) {
      const moreMsg = document.createElement('div');
      moreMsg.style.padding = '12px';
      moreMsg.style.textAlign = 'center';
      moreMsg.style.fontSize = 'var(--fs-xs)';
      moreMsg.style.color = 'var(--clr-text-muted)';
      moreMsg.style.borderTop = '1px dashed var(--clr-border)';
      moreMsg.style.marginTop = '8px';
      moreMsg.innerHTML = `Mostrando 200 de ${channelsToRender.length}.<br>Usa el buscador para ver más.`;
      channelList.appendChild(moreMsg);
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      if (!term) {
        renderChannelList(loadedChannels);
        return;
      }
      const filtered = loadedChannels.filter(ch => 
        ch.name.toLowerCase().includes(term) || 
        (ch.group && ch.group.toLowerCase().includes(term))
      );
      renderChannelList(filtered);
    });
  }

  // Playlist Manager Logic
  const savedListsSelect = document.getElementById('iptv-saved-lists');
  const saveListBtn = document.getElementById('iptv-save-list-btn');

  // URL del archivo JSON remoto
  const REMOTE_PLAYLISTS_URL = 'https://raw.githubusercontent.com/jucaos17-hub/futbolverse-app/main/remote_playlists.json';

  const fallbackPlaylists = [
    { name: '⭐ IPTV JUAN (IPTVMaster)', url: 'http://soporte-visual2.com:8080', user: 'espanistv', pass: 'mJJ3rwfgdYuV', category: '🔒 Mis Listas Privadas' },
    { name: '🌎 IPTV-Org (Latinoamérica)', url: 'https://iptv-org.github.io/iptv/languages/spa.m3u', user: '', pass: '', category: '📺 TV en Vivo' },
    { name: '⚽ TecnoTV Deportes', url: 'https://tecnotv.club/jbvk/deportes.m3u', user: '', pass: '', category: '⚽ Deportes' },
    { name: '🎬 Películas Públicas', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u', user: '', pass: '', category: '🎬 Películas y Series' }
  ];

  let playlists = [];

  async function fetchRemotePlaylists() {
    try {
      const response = await fetch(REMOTE_PLAYLISTS_URL + '?t=' + Date.now());
      if (!response.ok) throw new Error('Remote fetch failed');
      const data = await response.json();
      
      // Aplanar las categorías en un array simple con la categoría como metadata
      const remotePlaylists = [];
      if (data.categories) {
        data.categories.forEach(cat => {
          if (cat.playlists && cat.playlists.length > 0) {
            cat.playlists.forEach(pl => {
              remotePlaylists.push({
                name: pl.name,
                url: pl.url,
                user: pl.user || '',
                pass: pl.pass || '',
                category: cat.name
              });
            });
          }
        });
      }

      if (remotePlaylists.length > 0) {
        localStorage.setItem('iptv_remote_playlists', JSON.stringify(remotePlaylists));
        localStorage.setItem('iptv_remote_version', data.version || '1');
        return remotePlaylists;
      }
      throw new Error('No playlists in remote');
    } catch (err) {
      console.warn('[IPTV] No se pudo descargar listas remotas, usando caché local:', err.message);
      const cached = JSON.parse(localStorage.getItem('iptv_remote_playlists') || 'null');
      return cached || fallbackPlaylists;
    }
  }

  // Cargar listas remotas + las guardadas por el usuario
  async function loadAllPlaylists() {
    const remote = await fetchRemotePlaylists();
    const userSaved = JSON.parse(localStorage.getItem('iptv_user_playlists') || '[]');
    playlists = [...remote, ...userSaved.map(p => ({ ...p, category: '💾 Mis Listas' }))];
    renderPlaylistsDropdown();
  }

  function renderPlaylistsDropdown() {
    if (!savedListsSelect) return;
    savedListsSelect.innerHTML = '<option value="">-- Seleccionar o Escribir Manualmente --</option>';
    
    // Agrupar por categoría usando optgroup
    const groups = {};
    playlists.forEach((pl, index) => {
      const cat = pl.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ ...pl, index });
    });

    Object.keys(groups).forEach(catName => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = catName;
      groups[catName].forEach(pl => {
        const option = document.createElement('option');
        option.value = pl.index;
        option.textContent = pl.name;
        optgroup.appendChild(option);
      });
      savedListsSelect.appendChild(optgroup);
    });
  }

  // Inicializar: descargar listas remotas
  loadAllPlaylists();

  if (savedListsSelect) {
    savedListsSelect.addEventListener('change', (e) => {
      const index = e.target.value;
      if (index === '') {
        if (urlInput) urlInput.value = '';
        if (userInput) userInput.value = '';
        if (passInput) passInput.value = '';
        return;
      }
      const pl = playlists[index];
      if (urlInput) urlInput.value = pl.url;
      if (userInput) userInput.value = pl.user;
      if (passInput) passInput.value = pl.pass;
      loadBtn.click();
    });
  }

  if (saveListBtn) {
    saveListBtn.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) {
        alert('Debes ingresar una URL primero en la casilla de abajo para poder guardarla.');
        return;
      }
      const name = prompt('¿Qué nombre le quieres dar a esta lista? (Ej: "Mis Canales Vip")');
      if (!name) return;
      
      const newPlaylist = {
        name: name,
        url: url,
        user: userInput ? userInput.value.trim() : '',
        pass: passInput ? passInput.value.trim() : ''
      };
      
      // Guardar en la lista de usuario (separada de las remotas)
      const userSaved = JSON.parse(localStorage.getItem('iptv_user_playlists') || '[]');
      userSaved.push(newPlaylist);
      localStorage.setItem('iptv_user_playlists', JSON.stringify(userSaved));
      
      // Recargar todo
      loadAllPlaylists().then(() => {
        savedListsSelect.value = playlists.length - 1;
      });
      alert('¡Lista guardada con éxito en tu colección!');
    });
  }

  // Check if we have saved credentials for auto-load
  const savedUrl = localStorage.getItem('iptv_server_url');
  const savedUser = localStorage.getItem('iptv_server_user');
  const savedPass = localStorage.getItem('iptv_server_pass');
  
  // Check if there is a direct play URL from a match card
  const directPlayUrl = localStorage.getItem('iptv_direct_play_url');
  
  if (directPlayUrl) {
    // If arriving from a Match Card "VER EN VIVO", auto load the direct stream
    localStorage.removeItem('iptv_direct_play_url'); // clear it
    
    // Auto-select empty or clear the dropdown
    if (savedListsSelect) savedListsSelect.value = '';
    
    // Play immediately instead of parsing as playlist
    setTimeout(() => {
      playStream(directPlayUrl);
    }, 300);
  } else if (savedUrl && urlInput) {
    urlInput.value = savedUrl;
    if (userInput && savedUser) userInput.value = savedUser;
    if (passInput && savedPass) passInput.value = savedPass;
    
    // Auto-select in dropdown if it matches a saved list
    const matchedIndex = playlists.findIndex(pl => pl.url === savedUrl && pl.user === (savedUser || '') && pl.pass === (savedPass || ''));
    if (matchedIndex !== -1 && savedListsSelect) {
      savedListsSelect.value = matchedIndex;
    }
    
    setTimeout(() => {
      loadBtn.click();
    }, 300);
  }

  loadBtn.addEventListener('click', async () => {
    let host = urlInput.value.trim();
    const user = userInput ? userInput.value.trim() : '';
    const pass = passInput ? passInput.value.trim() : '';
    
    if (!host) return;

    // Save inputs
    localStorage.setItem('iptv_server_url', host);
    localStorage.setItem('iptv_server_user', user);
    localStorage.setItem('iptv_server_pass', pass);

    // Construct URL
    let finalUrl = host;
    const isDirectLink = host.toLowerCase().includes('.m3u') || host.toLowerCase().includes('.m3u8');
    const hasGetPhp = host.toLowerCase().includes('get.php');
    
    if (user && pass && !isDirectLink && !hasGetPhp) {
      // Remove trailing slash
      if (host.endsWith('/')) host = host.slice(0, -1);
      finalUrl = `${host}/get.php?username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}&type=m3u_plus&output=ts`;
    } else {
      finalUrl = host;
    }

    errorMsg.style.display = 'none';
    loadBtn.textContent = 'Conectando...';
    loadBtn.disabled = true;

    try {
      const channels = await fetchAndParseM3U(finalUrl);
      
      if (channels.length === 0) {
        throw new Error('No se encontraron canales en la lista.');
      }

      // Save locally for search
      loadedChannels = channels;

      // Render all channels initially
      renderChannelList(loadedChannels);

    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.style.display = 'block';
    } finally {
      loadBtn.textContent = 'Cargando Lista';
      loadBtn.disabled = false;
    }
  });

  function playStream(streamUrl) {
    const fullscreenBtn = document.getElementById('iptv-fullscreen-btn');
    const videoWrapper = document.getElementById('iptv-video-wrapper');

    if (placeholder) {
      placeholder.style.display = 'none';
    }
    if (video) {
      video.style.display = 'block';
    }
    
    // Cast button logic
    if (castBtn && cjs && cjs.available) {
      castBtn.style.display = 'block';
      castBtn.onclick = () => {
        // Enviar la señal al Chromecast
        cjs.cast(streamUrl, {
          title: 'FútbolVerse TV',
          description: 'Transmisión en Vivo IPTV'
        });
      };
    }

    if (fullscreenBtn) {
      fullscreenBtn.style.display = 'block';
      fullscreenBtn.onclick = () => {
        if (videoWrapper && videoWrapper.requestFullscreen) {
          videoWrapper.requestFullscreen();
        } else if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen(); // iOS Safari
        }
      };
    }

    const pipBtn = document.getElementById('iptv-pip-btn');
    if (pipBtn && isNative) {
      pipBtn.style.display = 'block';
      pipBtn.onclick = () => {
        PiP.enterPiP().catch(()=>{});
      };
    }

    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    // Use native playback if supported (iOS/Safari), otherwise Hls.js for Android/Web
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.play().catch(e => {
        console.error("Native play failed", e);
        errorMsg.textContent = "Error al reproducir. El formato del video podría no ser soportado nativamente.";
        errorMsg.style.display = 'block';
      });
      video.onerror = function(e) {
        console.error("Native video error", e);
        errorMsg.textContent = "Error de red o formato inválido al intentar reproducir el canal.";
        errorMsg.style.display = 'block';
      };
    } else if (window.Hls && window.Hls.isSupported()) {
      const hlsConfig = {};
      
      hlsInstance = new window.Hls(hlsConfig);
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);
      hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function() {
        video.play();
      });
      hlsInstance.on(window.Hls.Events.ERROR, function(event, data) {
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              console.error("fatal network error encountered, try to recover");
              if (!isNative) {
                errorMsg.textContent = "Error de red. Algunos canales privados solo funcionan en la APK.";
              } else {
                errorMsg.textContent = "Error de red al intentar reproducir el canal.";
              }
              errorMsg.style.display = 'block';
              hlsInstance.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.error("fatal media error encountered, try to recover");
              hlsInstance.recoverMediaError();
              break;
            default:
              hlsInstance.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', function() {
        video.play();
      });
    } else {
      errorMsg.textContent = "Tu navegador no soporta la reproducción de video HLS.";
      errorMsg.style.display = 'block';
    }
  }
}
