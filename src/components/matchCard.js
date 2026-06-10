import { formatTime, formatScore, isLive, isFinished, translateStatus } from '../utils/formatters.js';
import { PLACEHOLDER_CREST, BROADCASTERS, DEFAULT_BROADCASTER } from '../utils/constants.js';

export function renderMatchCard(match) {
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

  const centerContent = (homeScore !== null && homeScore !== undefined)
    ? `
      <div class="match-card__score">
        <span>${formatScore(homeScore)}</span>
        <span class="match-card__score-separator">-</span>
        <span>${formatScore(awayScore)}</span>
      </div>
      <div class="match-card__status ${statusClass}">${translateStatus(status)}</div>
    `
    : `
      <div class="match-card__time">${formatTime(match.utcDate)}</div>
      <div class="match-card__status ${statusClass}">${translateStatus(status)}</div>
    `;

  // Broadcast options
  const compCode = match.competition?.code;
  const broadcasterInfo = BROADCASTERS[compCode] || DEFAULT_BROADCASTER;
  
  let broadcastHtml = '';
  if (!finished) {
    broadcastHtml = `
      <div class="broadcast-wrapper" onclick="event.stopPropagation()">
        <div class="broadcast-title">📺 Dónde Ver</div>
        <div class="broadcast-list">
          ${broadcasterInfo.channels.map(ch => `
            <a href="${ch.url}" target="_blank" rel="noopener noreferrer" class="broadcast-link" title="${ch.desc}">
              <span>${ch.icon}</span> ${ch.name}
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  // We change the structure slightly to allow the broadcast to span full width below
  return `
    <div class="${cardClass}" data-match-id="${match.id}" id="match-card-${match.id}" style="display:flex; flex-direction:column;">
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
