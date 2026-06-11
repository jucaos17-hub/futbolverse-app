export function renderLiveChannelCard(channel) {
  const fallbackLogo = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIyIiB5PSI3IiB3aWR0aD0iMjAiIGhlaWdodD0iMTUiIHJ4PSIyIiByeT0iMiI+PC9yZWN0Pjxwb2x5bGluZSBwb2ludHM9IjE3IDIgMTIgNyA3IDIiPjwvcG9seWxpbmU+PC9zdmc+`;
  
  return `
    <div class="live-card" data-url="${channel.url}" data-name="${channel.name}" style="background: var(--clr-surface-alt); border-radius: var(--radius-lg); border: 1px solid var(--clr-border); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;">
      <div style="position: relative; height: 120px; background: var(--clr-surface); display: flex; align-items: center; justify-content: center; overflow: hidden;">
        <!-- Background Blur -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('${channel.logo || fallbackLogo}'); background-size: cover; background-position: center; filter: blur(20px); opacity: 0.3; z-index: 1;"></div>
        
        <!-- Badge En Vivo -->
        <div style="position: absolute; top: 10px; left: 10px; z-index: 2; background: rgba(255, 51, 102, 0.2); border: 1px solid #ff3366; color: #ff3366; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 12px; display: flex; align-items: center; gap: 4px; backdrop-filter: blur(4px);">
          <span style="width: 6px; height: 6px; background: #ff3366; border-radius: 50%; animation: pulse 2s infinite;"></span>
          EN VIVO
        </div>

        <!-- Calidad -->
        <div style="position: absolute; top: 10px; right: 10px; z-index: 2; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; backdrop-filter: blur(4px);">
          ${channel.quality}
        </div>
        
        <!-- Logo -->
        <img src="${channel.logo || fallbackLogo}" alt="${channel.name}" onerror="this.src='${fallbackLogo}'" style="width: 64px; height: 64px; object-fit: contain; z-index: 2; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />
        
        <!-- Play Overlay -->
        <div class="play-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 3; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s;">
          <div style="width: 48px; height: 48px; background: #ff3366; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(255, 51, 102, 0.6);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      
      <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px; flex: 1;">
        <h3 style="margin: 0; font-size: var(--fs-md); color: var(--clr-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${channel.name}">
          ${channel.name}
        </h3>
        
        <div style="font-size: var(--fs-xs); color: ${channel.currentProgram ? '#4ade80' : 'var(--clr-text-muted)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: var(--clr-surface); padding: 4px 8px; border-radius: 4px; border-left: 2px solid ${channel.currentProgram ? '#4ade80' : 'var(--clr-border)'};">
          ${channel.currentProgram ? `<strong>Ahora:</strong> ${channel.currentProgram}` : 'Programación no disponible'}
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
          <span style="font-size: var(--fs-xs); color: var(--clr-text-muted); background: var(--clr-background); padding: 2px 6px; border-radius: 4px;">
            ${channel.category}
          </span>
          <div style="display: flex; gap: 6px; align-items: center;">
            <span title="Estabilidad" style="font-size: 10px; color: #4ade80; display: flex; align-items: center; gap: 2px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              ${channel.stability}%
            </span>
            <span title="Ping" style="font-size: 10px; color: var(--clr-text-muted); display: flex; align-items: center; gap: 2px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${channel.ping}ms
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Add styles globally
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .live-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      border-color: rgba(255, 51, 102, 0.5);
    }
    .live-card:hover .play-overlay {
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);
}
