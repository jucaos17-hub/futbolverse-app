import { KNOCKOUT_STAGES, PLACEHOLDER_CREST } from '../utils/constants.js';
import { formatTime, formatShortDate, isLive, isFinished, translateStatus } from '../utils/formatters.js';
import { getCompetitionMatchesByStage } from '../services/football.js';

/**
 * Fetch all knockout stage matches for a competition and render the bracket.
 * @param {string} code - Competition code (e.g. 'WC')
 * @returns {Promise<string>} HTML string
 */
export async function loadKnockoutBracket(code) {
  const stagesData = {};
  let hasAnyMatches = false;

  // Fetch all stages in parallel
  const fetchPromises = KNOCKOUT_STAGES.map(async ({ stage, label }) => {
    try {
      const data = await getCompetitionMatchesByStage(code, stage);
      const matches = data?.matches || [];
      stagesData[stage] = { label, matches };
      if (matches.length > 0) hasAnyMatches = true;
    } catch (err) {
      console.warn(`[Bracket] Could not fetch stage ${stage}:`, err);
      stagesData[stage] = { label, matches: [] };
    }
  });

  await Promise.all(fetchPromises);

  if (!hasAnyMatches) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">🏆</div>
        <div class="empty-state__title">Eliminatorias aún no disponibles</div>
        <div class="empty-state__text">Los partidos de la fase eliminatoria aparecerán aquí cuando estén programados.</div>
      </div>
    `;
  }

  // ── Build desktop bracket view ──
  // Separate THIRD_PLACE from the main bracket flow
  const mainStages = KNOCKOUT_STAGES.filter(s => s.stage !== 'THIRD_PLACE');
  const thirdPlace = stagesData['THIRD_PLACE'];

  let bracketHtml = '<div class="knockout-bracket" id="knockout-bracket">';
  
  for (const { stage, label, short } of mainStages) {
    const { matches } = stagesData[stage] || { matches: [] };
    if (matches.length === 0) continue;
    
    bracketHtml += `
      <div class="knockout-round" data-stage="${stage}">
        <div class="knockout-round__header">
          <span class="knockout-round__label">${label}</span>
          <span class="knockout-round__count">${matches.length} partido${matches.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="knockout-round__matches">
          ${matches.map(m => renderKnockoutMatch(m)).join('')}
        </div>
      </div>
    `;
  }

  bracketHtml += '</div>';

  // Third place match (shown separately below the bracket)
  if (thirdPlace && thirdPlace.matches.length > 0) {
    bracketHtml += `
      <div class="knockout-third-place">
        <div class="knockout-round__header">
          <span class="knockout-round__label">🥉 Tercer Puesto</span>
        </div>
        <div class="knockout-round__matches" style="justify-content: center;">
          ${thirdPlace.matches.map(m => renderKnockoutMatch(m)).join('')}
        </div>
      </div>
    `;
  }

  // ── Build mobile tabs view ──
  const allStagesWithMatches = KNOCKOUT_STAGES.filter(s => (stagesData[s.stage]?.matches?.length || 0) > 0);
  
  let mobileTabs = '<div class="knockout-mobile" id="knockout-mobile">';
  
  // Tab bar
  mobileTabs += '<div class="knockout-mobile__tabs">';
  allStagesWithMatches.forEach((s, i) => {
    mobileTabs += `<button class="knockout-mobile__tab ${i === 0 ? 'active' : ''}" data-stage="${s.stage}">${s.short}</button>`;
  });
  mobileTabs += '</div>';

  // Tab panels
  allStagesWithMatches.forEach((s, i) => {
    const { matches } = stagesData[s.stage];
    mobileTabs += `
      <div class="knockout-mobile__panel ${i === 0 ? 'active' : ''}" data-stage-panel="${s.stage}">
        <div class="knockout-mobile__matches">
          ${matches.map(m => renderKnockoutMatch(m)).join('')}
        </div>
      </div>
    `;
  });

  mobileTabs += '</div>';

  return bracketHtml + mobileTabs;
}

/**
 * Attach click events for mobile tabs and match card details.
 * Call this AFTER inserting the bracket HTML into the DOM.
 */
export function attachKnockoutEvents() {
  // Mobile tab switching
  document.querySelectorAll('.knockout-mobile__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const stage = tab.getAttribute('data-stage');
      
      // Update active tab
      document.querySelectorAll('.knockout-mobile__tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active panel
      document.querySelectorAll('.knockout-mobile__panel').forEach(p => p.classList.remove('active'));
      const panel = document.querySelector(`[data-stage-panel="${stage}"]`);
      if (panel) panel.classList.add('active');
    });
  });
}

/**
 * Render a single knockout match card.
 */
function renderKnockoutMatch(match) {
  const home = match.homeTeam || {};
  const away = match.awayTeam || {};
  const score = match.score;
  const status = match.status;

  const homeCrest = home.crest || PLACEHOLDER_CREST;
  const awayCrest = away.crest || PLACEHOLDER_CREST;
  const homeName = home.shortName || home.name || 'Por definir';
  const awayName = away.shortName || away.name || 'Por definir';

  const live = isLive(status);
  const finished = isFinished(status);

  // Score display
  let scoreHtml = '';
  const homeScore = score?.fullTime?.home;
  const awayScore = score?.fullTime?.away;

  if (homeScore !== null && homeScore !== undefined) {
    // Check for penalty shootout
    const homePen = score?.penalties?.home;
    const awayPen = score?.penalties?.away;
    const penaltyHtml = (homePen !== null && homePen !== undefined)
      ? `<div class="ko-match__penalties">(${homePen} - ${awayPen} pen.)</div>`
      : '';

    scoreHtml = `
      <div class="ko-match__score-row">
        <span class="ko-match__score-num ${finished && homeScore > awayScore ? 'ko-match__score-num--winner' : ''}">${homeScore}</span>
        <span class="ko-match__score-sep">-</span>
        <span class="ko-match__score-num ${finished && awayScore > homeScore ? 'ko-match__score-num--winner' : ''}">${awayScore}</span>
      </div>
      ${penaltyHtml}
    `;
  } else {
    scoreHtml = `<div class="ko-match__time">${formatTime(match.utcDate)}</div>`;
  }

  // Status badge
  let statusClass = 'ko-match__badge--scheduled';
  let statusText = translateStatus(status);
  if (live) {
    statusClass = 'ko-match__badge--live';
  } else if (finished) {
    statusClass = 'ko-match__badge--finished';
  }

  // Winner highlighting
  const homeWinner = finished && homeScore > awayScore;
  const awayWinner = finished && awayScore > homeScore;

  // Escape match data for onclick
  const escapedMatch = JSON.stringify(match).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

  return `
    <div class="ko-match ${live ? 'ko-match--live' : ''}" onclick="if(window.openMatchDetails) window.openMatchDetails('${escapedMatch}')">
      <div class="ko-match__date">${formatShortDate(match.utcDate)}</div>
      <div class="ko-match__teams">
        <div class="ko-match__team ${homeWinner ? 'ko-match__team--winner' : ''}">
          <img class="ko-match__crest" src="${homeCrest}" alt="${homeName}" onerror="this.style.display='none'" loading="lazy" />
          <span class="ko-match__name">${homeName}</span>
        </div>
        <div class="ko-match__center">
          ${scoreHtml}
          <span class="ko-match__badge ${statusClass}">${statusText}</span>
        </div>
        <div class="ko-match__team ko-match__team--away ${awayWinner ? 'ko-match__team--winner' : ''}">
          <img class="ko-match__crest" src="${awayCrest}" alt="${awayName}" onerror="this.style.display='none'" loading="lazy" />
          <span class="ko-match__name">${awayName}</span>
        </div>
      </div>
    </div>
  `;
}
