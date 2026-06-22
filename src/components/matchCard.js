import { formatTime, formatScore, isLive, isFinished, translateStatus } from '../utils/formatters.js';
import { PLACEHOLDER_CREST, BROADCASTERS, DEFAULT_BROADCASTER } from '../utils/constants.js';

export function renderMatchCard(match, internalStreamUrl = null) {
  const home = match.homeTeam;
  const away = match.awayTeam;
  const status = match.status;
  const score = match.score;

  const homeScore = score?.fullTime?.home;
  const awayScore = score?.fullTime?.away;
  const homeCrest = home.crest || PLACEHOLDER_CREST;
  const awayCrest = away.crest || PLACEHOLDER_CREST;

  const live = isLive(status);
  const finished = isFinished(status);

  let statusClass = 'match-card__status--scheduled';
  if (live) statusClass = 'match-card__status--live';
  else if (finished) statusClass = 'match-card__status--finished';
  else if (status === 'POSTPONED') statusClass = 'match-card__status--postponed';

  const cardClass = live ? 'match-card match-card--live' : 'match-card';

  // Simular minuto si está en vivo (ya que la API gratuita a veces no lo da exacto)
  let liveMinute = '';
  if (live && match.utcDate) {
    if (status === 'PAUSED') {
      liveMinute = 'MT'; // Medio tiempo
    } else {
      const diffMinutes = Math.floor((new Date() - new Date(match.utcDate)) / 60000);
      if (diffMinutes <= 45) {
        liveMinute = diffMinutes > 0 ? diffMinutes + "'" : "1'";
      } else if (diffMinutes > 45 && diffMinutes < 60) {
        liveMinute = "45+'"; 
      } else {
        const secondHalfMinute = diffMinutes - 15;
        liveMinute = secondHalfMinute > 90 ? "90+'" : secondHalfMinute + "'";
      }
    }
  }

  const centerContent = (homeScore !== null && homeScore !== undefined)
    ? `
      <div class="match-card__score" style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
        ${liveMinute ? `<div style="color: #ff3366; font-size: 14px; font-weight: bold; animation: pulse 2s infinite;">${liveMinute}</div>` : ''}
        <div style="display: flex; align-items: center; justify-content: center;">
          <span>${formatScore(homeScore)}</span>
          <span class="match-card__score-separator">-</span>
          <span>${formatScore(awayScore)}</span>
        </div>
      </div>
      <div class="match-card__status ${statusClass}">${translateStatus(status)}</div>
    `
    : `
      <div class="match-card__time">${formatTime(match.utcDate)}</div>
      <div class="match-card__status ${statusClass}">${translateStatus(status)}</div>
    `;

  // Broadcast options (Smart IPTV Linking)
  const compCode = match.competition?.code;
  const broadcasterInfo = BROADCASTERS[compCode] || DEFAULT_BROADCASTER;
  const suggestedChannels = broadcasterInfo.names.join(' o ');
  
  let broadcastHtml = '';
  if (!finished && live) {
    // Solo mostrar el botón que lleva a los canales de transmisión
    broadcastHtml = `
      <div class="broadcast-wrapper" onclick="event.stopPropagation()">
        <div style="font-size: 11px; color: var(--clr-text-muted); text-align: center; margin-bottom: 8px;">
          Transmitiendo en: <strong style="color: var(--clr-text);">${suggestedChannels}</strong>
        </div>
        <button class="btn btn--primary" style="width: 100%; padding: 8px; font-weight: bold; font-size: 14px; background: #e11d48; border: none; border-radius: 8px; cursor: pointer; color: white;" onclick="if(window.navigateTo) window.navigateTo('/live')">
          🔴 VER PARTIDO EN VIVO
        </button>
      </div>
    `;
  }

  // We change the structure slightly to allow the broadcast to span full width below
  // Se agrega un onClick para abrir el modal de detalles del partido. (El window.openMatchDetails será definido globalmente en main.js)
  const escapedMatch = JSON.stringify(match).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
  
  return `
    <div class="${cardClass}" data-match-id="${match.id}" id="match-card-${match.id}" style="display:flex; flex-direction:column; cursor: pointer; position: relative;" onclick="if(window.openMatchDetails) window.openMatchDetails('${escapedMatch}')">
      
      <!-- Pequeña indicación de que se puede hacer clic -->
      <div style="position: absolute; top: 8px; right: 8px; opacity: 0.5; font-size: 12px; pointer-events: none;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      </div>
      <div style="display:grid; grid-template-columns: 1fr auto 1fr; align-items:center; gap:var(--sp-md); width: 100%;">
        <div class="match-card__team">
          <img class="match-card__crest" src="${homeCrest}" alt="${home.shortName || home.name}" 
               onerror="this.style.display='none'" loading="lazy" />
          <span class="match-card__team-name">${home.shortName || home.name}</span>
        </div>
        <div class="match-card__center">
          ${centerContent}
        </div>
        <div class="match-card__team match-card__team--away">
          <img class="match-card__crest" src="${awayCrest}" alt="${away.shortName || away.name}" 
               onerror="this.style.display='none'" loading="lazy" />
          <span class="match-card__team-name">${away.shortName || away.name}</span>
        </div>
      </div>
      ${broadcastHtml}
    </div>
  `;
}
