import { formatGD } from '../utils/formatters.js';

export function renderStandingsTable(standings, onTeamClick) {
  if (!standings || !standings.table || standings.table.length === 0) {
    return '<div class="empty-state"><div class="empty-state__icon">📊</div><div class="empty-state__title">Sin datos de clasificación</div></div>';
  }

  const table = standings.table;
  const totalTeams = table.length;

  function getPositionClass(pos) {
    // Generic zones — adjust per competition but reasonable defaults
    if (pos <= 4) return 'standings-table__pos--champions';
    if (pos <= 6) return 'standings-table__pos--europa';
    if (pos === 7) return 'standings-table__pos--conference';
    if (pos > totalTeams - 3) return 'standings-table__pos--relegation';
    return '';
  }

  function renderForm(form) {
    if (!form) return '';
    return `<div class="form-indicators">${
      form.split(',').slice(-5).map(r => `<span class="form-dot form-dot--${r.trim()}"></span>`).join('')
    }</div>`;
  }

  const rows = table.map(row => {
    const crest = row.team.crest || '';
    const gd = row.goalDifference;
    const gdClass = gd > 0 ? 'standings-table__gd--positive' : gd < 0 ? 'standings-table__gd--negative' : '';

    return `
      <tr>
        <td><span class="standings-table__pos ${getPositionClass(row.position)}">${row.position}</span></td>
        <td>
          <div class="standings-table__team">
            ${crest ? `<img class="standings-table__team-crest" src="${crest}" alt="${row.team.shortName || row.team.name}" onerror="this.style.display='none'" loading="lazy" />` : ''}
            <span class="standings-table__team-name" data-team-id="${row.team.id}">${row.team.shortName || row.team.name}</span>
          </div>
        </td>
        <td>${row.playedGames}</td>
        <td class="hide-mobile">${row.won}</td>
        <td class="hide-mobile">${row.draw}</td>
        <td class="hide-mobile">${row.lost}</td>
        <td class="hide-mobile">${row.goalsFor}</td>
        <td class="hide-mobile">${row.goalsAgainst}</td>
        <td><span class="standings-table__gd ${gdClass}">${formatGD(gd)}</span></td>
        <td><span class="standings-table__pts">${row.points}</span></td>
        <td class="hide-mobile">${renderForm(row.form)}</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="standings-table" id="standings-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Equipo</th>
          <th>PJ</th>
          <th class="hide-mobile">PG</th>
          <th class="hide-mobile">PE</th>
          <th class="hide-mobile">PP</th>
          <th class="hide-mobile">GF</th>
          <th class="hide-mobile">GC</th>
          <th>DG</th>
          <th>PTS</th>
          <th class="hide-mobile">Forma</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}
