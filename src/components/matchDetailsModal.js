import { formatScore, translateStatus } from '../utils/formatters.js';
import { PLACEHOLDER_CREST } from '../utils/constants.js';

export function showMatchDetails(matchStr) {
  const match = JSON.parse(matchStr);
  const home = match.homeTeam;
  const away = match.awayTeam;
  
  // Si no hay modal-container en el body, lo creamos
  let container = document.getElementById('match-details-modal');
  if (!container) {
    container = document.createElement('div');
    container.id = 'match-details-modal';
    document.body.appendChild(container);
  }

  const homeScore = match.score?.fullTime?.home ?? '-';
  const awayScore = match.score?.fullTime?.away ?? '-';
  
  container.innerHTML = `
    <div id="md-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: flex-end; justify-content: center; padding: 0;">
      
      <div id="md-content" style="background: var(--clr-surface); width: 100%; max-width: 600px; height: 85vh; border-top-left-radius: 24px; border-top-right-radius: 24px; display: flex; flex-direction: column; overflow: hidden; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        
        <!-- Header: Arrastrar para cerrar (visual) y Score -->
        <div style="background: var(--clr-surface-alt); padding: 16px; border-bottom: 1px solid var(--clr-border); position: relative;">
          <div style="width: 40px; height: 5px; background: var(--clr-border); border-radius: 3px; margin: 0 auto 16px auto;"></div>
          <button id="md-close" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; color: var(--clr-text-muted); cursor: pointer;">&times;</button>
          
          <div style="display: flex; justify-content: space-around; align-items: center;">
            <div style="text-align: center; flex: 1;">
              <img src="${home.crest || PLACEHOLDER_CREST}" style="height: 48px; object-fit: contain; margin-bottom: 8px;">
              <div style="font-weight: 600; font-size: 14px;">${home.shortName || home.name}</div>
            </div>
            
            <div style="text-align: center; padding: 0 16px;">
              <div style="font-size: 32px; font-weight: 800; color: #ff3366; font-family: 'Outfit', sans-serif;">
                ${homeScore} - ${awayScore}
              </div>
              <div style="font-size: 12px; color: var(--clr-text-muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">
                ${translateStatus(match.status)}
              </div>
            </div>
            
            <div style="text-align: center; flex: 1;">
              <img src="${away.crest || PLACEHOLDER_CREST}" style="height: 48px; object-fit: contain; margin-bottom: 8px;">
              <div style="font-weight: 600; font-size: 14px;">${away.shortName || away.name}</div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div style="display: flex; border-bottom: 1px solid var(--clr-border); background: var(--clr-surface-alt);">
          <button class="md-tab active" data-target="alineaciones" style="flex: 1; padding: 12px; background: none; border: none; color: #ff3366; font-weight: 600; border-bottom: 2px solid #ff3366; cursor: pointer; transition: 0.2s;">Alineaciones</button>
          <button class="md-tab" data-target="estadisticas" style="flex: 1; padding: 12px; background: none; border: none; color: var(--clr-text-muted); font-weight: 600; border-bottom: 2px solid transparent; cursor: pointer; transition: 0.2s;">Estadísticas</button>
          <button class="md-tab" data-target="eventos" style="flex: 1; padding: 12px; background: none; border: none; color: var(--clr-text-muted); font-weight: 600; border-bottom: 2px solid transparent; cursor: pointer; transition: 0.2s;">Eventos</button>
        </div>

        <!-- Scrollable Content -->
        <div style="flex: 1; overflow-y: auto; padding: 16px; background: var(--clr-background);">
          
          <!-- Tab Alineaciones -->
          <div id="tab-alineaciones" class="md-tab-content" style="display: block;">
            ${renderLineups(match)}
          </div>

          <!-- Tab Estadísticas -->
          <div id="tab-estadisticas" class="md-tab-content" style="display: none;">
            ${renderStatistics(match)}
          </div>

          <!-- Tab Eventos -->
          <div id="tab-eventos" class="md-tab-content" style="display: none;">
            ${renderEvents(match)}
          </div>

        </div>
      </div>
    </div>
  `;

  // Animate Entrance
  const content = document.getElementById('md-content');
  requestAnimationFrame(() => {
    content.style.transform = 'translateY(0)';
  });

  // Close Logic
  const closeBtn = document.getElementById('md-close');
  const backdrop = document.getElementById('md-backdrop');
  
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

  // Tab Logic
  const tabs = document.querySelectorAll('.md-tab');
  const contents = document.querySelectorAll('.md-tab-content');
  
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.style.color = 'var(--clr-text-muted)';
        t.style.borderBottomColor = 'transparent';
      });
      tab.classList.add('active');
      tab.style.color = '#ff3366';
      tab.style.borderBottomColor = '#ff3366';
      
      const target = tab.getAttribute('data-target');
      contents.forEach(c => {
        c.style.display = c.id === 'tab-' + target ? 'block' : 'none';
      });
    };
  });
}

function parseStatVal(val) {
  if (typeof val === 'string' && val.includes('%')) return parseInt(val.replace('%',''));
  return parseInt(val) || 0;
}

function renderStatistics(match) {
  const stats = match.statistics;
  if (!stats || stats.length < 2) return \`<div style="text-align:center; padding: 2rem; color: var(--clr-text-muted);">Estadísticas no disponibles aún</div>\`;
  
  const homeStats = stats[0].statistics;
  const awayStats = stats[1].statistics;
  
  let html = '<div style="background: var(--clr-surface-alt); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 16px;">';
  
  homeStats.forEach((hStat, i) => {
    const aStat = awayStats[i];
    if(hStat.value !== null || aStat.value !== null) {
      const hVal = parseStatVal(hStat.value);
      const aVal = parseStatVal(aStat.value);
      html += renderStatBar(hStat.type, hVal, aVal, hStat.value, aStat.value);
    }
  });
  
  html += '</div>';
  return html;
}

function renderStatBar(title, val1Num, val2Num, val1Str, val2Str) {
  const total = val1Num + val2Num || 1;
  const pct1 = (val1Num / total) * 100;
  const pct2 = (val2Num / total) * 100;
  
  const v1Display = val1Str !== null ? val1Str : 0;
  const v2Display = val2Str !== null ? val2Str : 0;
  
  return \`
    <div>
      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom: 4px;">
        <span style="font-weight:bold;">\${v1Display}</span>
        <span style="color:var(--clr-text-muted); text-transform: uppercase; font-size: 10px;">\${title}</span>
        <span style="font-weight:bold;">\${v2Display}</span>
      </div>
      <div style="display:flex; height: 8px; border-radius: 4px; overflow: hidden; background: var(--clr-border);">
        <div style="width: \${pct1}%; background: #ff3366;"></div>
        <div style="width: \${pct2}%; background: #3b82f6;"></div>
      </div>
    </div>
  \`;
}

function getEventIcon(type, detail) {
  if (type === 'Goal') return '⚽';
  if (type === 'Card' && detail.includes('Yellow')) return '<div style="width:14px;height:18px;background:#ffb703;border-radius:2px;display:inline-block;"></div>';
  if (type === 'Card' && detail.includes('Red')) return '<div style="width:14px;height:18px;background:#e63946;border-radius:2px;display:inline-block;"></div>';
  if (type === 'subst') return '🔄';
  return '📌';
}

function renderEvents(match) {
  const events = match.events;
  if (!events || events.length === 0) return \`<div style="text-align:center; padding: 2rem; color: var(--clr-text-muted);">Eventos no disponibles aún</div>\`;
  
  let html = '<div style="display:flex; flex-direction:column; gap: 16px; padding: 0 8px;">';
  
  // Sort events by time
  events.sort((a,b) => a.time.elapsed - b.time.elapsed);
  
  events.forEach(ev => {
    const isHome = ev.team.id === match.homeTeam.id;
    const time = ev.time.elapsed + (ev.time.extra ? \`+\${ev.time.extra}\` : '') + "'";
    const icon = getEventIcon(ev.type, ev.detail);
    const playerName = ev.player.name;
    const assistName = ev.assist?.name ? \`<br><span style="font-size:10px;color:var(--clr-text-muted);">Asistencia: \${ev.assist.name}</span>\` : '';
    
    html += \`
      <div style="display:flex; gap: 12px; align-items:center; \${isHome ? '' : 'flex-direction: row-reverse; text-align: right;'}">
        <div style="font-weight:bold; color:\${isHome ? '#ff3366' : '#3b82f6'}; width: 40px; text-align: center;">\${time}</div>
        <div style="font-size: 16px; display:flex; align-items:center; justify-content:center;">\${icon}</div>
        <div style="flex:1;">
          <div style="font-size: 14px; font-weight: 500;">\${playerName} \${ev.type === 'subst' ? \`(<span style="color:#e63946;">\${ev.assist.name}</span>)\` : ''}</div>
          \${ev.type !== 'subst' ? assistName : ''}
          <div style="font-size:10px; color:var(--clr-text-muted);">\${ev.detail}</div>
        </div>
      </div>
    \`;
  });
  
  html += '</div>';
  return html;
}

function renderLineups(match) {
  const lineups = match.lineups;
  if (!lineups || lineups.length < 2) return \`<div style="text-align:center; padding: 2rem; color: var(--clr-text-muted);">Alineaciones no disponibles</div>\`;
  
  const home = lineups[0];
  const away = lineups[1];
  
  // Dibujar lista tradicional si el usuario prefiere scroll, 
  // o podemos dibujar los grids. Haremos lista por ahora para asegurar precisión y nombres reales.
  
  return \`
    <div style="display:flex; gap: 16px;">
      <!-- HOME -->
      <div style="flex: 1;">
        <h4 style="margin: 0 0 8px 0; color: #ff3366; text-align: center; font-size: 14px;">\${home.formation}</h4>
        <div style="background: var(--clr-surface-alt); border-radius: 8px; padding: 8px;">
          \${home.startXI.map(p => \`
            <div style="display:flex; gap: 8px; align-items:center; padding: 6px 0; border-bottom: 1px solid var(--clr-border);">
              <span style="width: 20px; font-size: 10px; color: var(--clr-text-muted); text-align:right;">\${p.player.number || ''}</span>
              <span style="font-size: 12px; font-weight: 500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="\${p.player.name}">\${p.player.name}</span>
            </div>
          \`).join('')}
        </div>
      </div>
      
      <!-- AWAY -->
      <div style="flex: 1;">
        <h4 style="margin: 0 0 8px 0; color: #3b82f6; text-align: center; font-size: 14px;">\${away.formation}</h4>
        <div style="background: var(--clr-surface-alt); border-radius: 8px; padding: 8px;">
          \${away.startXI.map(p => \`
            <div style="display:flex; gap: 8px; align-items:center; padding: 6px 0; border-bottom: 1px solid var(--clr-border); flex-direction: row-reverse;">
              <span style="width: 20px; font-size: 10px; color: var(--clr-text-muted); text-align:left;">\${p.player.number || ''}</span>
              <span style="font-size: 12px; font-weight: 500; text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="\${p.player.name}">\${p.player.name}</span>
            </div>
          \`).join('')}
        </div>
      </div>
    </div>
  \`;
}
