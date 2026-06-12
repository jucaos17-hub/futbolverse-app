// src/pages/playersPage.js
import { searchPlayer, getPlayerProfile, getPlayerTransfers } from '../services/transfermarkt.js';

export async function renderPlayersPage(container) {
  container.innerHTML = `
    <div class="container" style="padding-top: 1rem;">
      <h1 class="page-title">Mercado y Jugadores</h1>
      <p class="page-subtitle">Busca el valor de mercado, ficha y transferencias (Datos por Transfermarkt)</p>
      
      <div style="display: flex; gap: 10px; margin-bottom: 2rem; margin-top: 1rem;">
        <input type="text" id="player-search-input" placeholder="Ej. Lamine Yamal, Bellingham..." 
          style="flex: 1; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--clr-border); background: var(--clr-surface); color: var(--clr-text); font-size: 1rem;" />
        <button id="player-search-btn" class="btn btn--primary">Buscar</button>
      </div>

      <div id="players-results" style="display: grid; gap: 1rem;">
        <!-- Results will appear here -->
        <div style="text-align: center; color: var(--clr-text-muted); padding: 2rem;">
          Ingresa el nombre de un jugador para buscar.
        </div>
      </div>
    </div>
  `;

  const input = document.getElementById('player-search-input');
  const btn = document.getElementById('player-search-btn');
  const resultsDiv = document.getElementById('players-results');

  const doSearch = async () => {
    const query = input.value.trim();
    if (!query) return;

    resultsDiv.innerHTML = '<div style="text-align:center; padding:2rem;"><div class="skeleton" style="height:100px; border-radius:8px; margin-bottom:1rem;"></div></div>';
    
    const results = await searchPlayer(query);
    
    if (results.length === 0) {
      resultsDiv.innerHTML = '<div style="text-align:center; color: #ff5555; padding: 2rem;">No se encontraron jugadores.</div>';
      return;
    }

    resultsDiv.innerHTML = results.map(p => `
      <div class="player-card" data-id="${p.id}" style="background: var(--clr-surface-alt); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--clr-border); cursor: pointer; transition: transform 0.2s;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin:0; font-size:1.1rem;">${p.name}</h3>
            <p style="margin:0; font-size:0.9rem; color:var(--clr-text-muted);">${p.position} • ${p.club?.name || 'Sin Club'}</p>
          </div>
          <div style="text-align: right;">
            <strong style="color: #4ade80;">${p.marketValue ? formatCurrency(p.marketValue) : 'Desconocido'}</strong>
            <div style="font-size:0.8rem; color:var(--clr-text-muted);">Valor de Mercado</div>
          </div>
        </div>
      </div>
    `).join('');

    // Add click listeners to load full profile
    document.querySelectorAll('.player-card').forEach(card => {
      card.addEventListener('click', async () => {
        const id = card.getAttribute('data-id');
        await loadPlayerProfile(id, resultsDiv);
      });
    });
  };

  btn.addEventListener('click', doSearch);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') doSearch();
  });
}

function formatCurrency(value) {
  if (!value) return '';
  if (value >= 1000000) {
    return '€' + (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return '€' + (value / 1000).toFixed(0) + 'K';
  }
  return '€' + value;
}

async function loadPlayerProfile(id, container) {
  container.innerHTML = '<div style="text-align:center; padding:2rem;">Cargando perfil detallado...</div>';
  
  const [profile, transfers] = await Promise.all([
    getPlayerProfile(id),
    getPlayerTransfers(id)
  ]);

  if (!profile) {
    container.innerHTML = '<div style="text-align:center; color:#ff5555;">Error al cargar el perfil.</div>';
    return;
  }

  let transfersHtml = '';
  if (transfers && transfers.length > 0) {
    transfersHtml = `
      <h4 style="margin-top:1.5rem; margin-bottom:0.5rem;">Historial de Transferencias</h4>
      <div style="background: var(--clr-background); padding: 1rem; border-radius: var(--radius-md);">
        ${transfers.map(t => `
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem; border-bottom:1px solid var(--clr-border); padding-bottom:4px;">
            <div><strong>${t.season}</strong>: ${t.clubFrom?.name} ➔ ${t.clubTo?.name}</div>
            <div style="color:#4ade80;">${t.fee ? formatCurrency(t.fee) : 'Libre/Cesión'}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  container.innerHTML = `
    <button class="btn btn--secondary" onclick="document.getElementById('player-search-btn').click()" style="margin-bottom:1rem;">← Volver</button>
    
    <div style="background: var(--clr-surface-alt); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--clr-border);">
      <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;">
        <img src="${profile.imageUrl}" alt="${profile.name}" style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:3px solid var(--clr-border);" onerror="this.src='https://via.placeholder.com/100?text=Foto'"/>
        <div>
          <h2 style="margin:0; font-size:1.5rem;">${profile.name}</h2>
          <p style="margin:0; color:var(--clr-text-muted);">${profile.fullName || profile.name}</p>
          <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
            <span style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:12px; font-size:0.8rem;">${profile.age} años</span>
            <span style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:12px; font-size:0.8rem;">Dorsal: ${profile.shirtNumber || '-'}</span>
            <span style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:12px; font-size:0.8rem;">${profile.foot || 'Desconocido'}</span>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <div style="background:var(--clr-background); padding:1rem; border-radius:var(--radius-md);">
          <div style="font-size:0.8rem; color:var(--clr-text-muted);">Nacionalidad</div>
          <div>${profile.citizenship?.join(', ') || '-'}</div>
        </div>
        <div style="background:var(--clr-background); padding:1rem; border-radius:var(--radius-md);">
          <div style="font-size:0.8rem; color:var(--clr-text-muted);">Valor de Mercado</div>
          <div style="color:#4ade80; font-weight:bold; font-size:1.1rem;">${formatCurrency(profile.marketValue)}</div>
        </div>
        <div style="background:var(--clr-background); padding:1rem; border-radius:var(--radius-md);">
          <div style="font-size:0.8rem; color:var(--clr-text-muted);">Club Actual</div>
          <div>${profile.club?.name || 'Agente Libre'}</div>
        </div>
        <div style="background:var(--clr-background); padding:1rem; border-radius:var(--radius-md);">
          <div style="font-size:0.8rem; color:var(--clr-text-muted);">Posición Principal</div>
          <div>${profile.position?.main || '-'}</div>
        </div>
      </div>

      ${transfersHtml}
    </div>
  `;
}
