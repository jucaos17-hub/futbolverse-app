export function renderScorersTable(scorers) {
  if (!scorers || scorers.length === 0) {
    return '<div class="empty-state"><div class="empty-state__icon">👟</div><div class="empty-state__title">Sin datos de goleadores</div></div>';
  }

  const rows = scorers.map((s, i) => {
    const player = s.player;
    const team = s.team;
    const crest = team?.crest || '';

    return `
      <tr>
        <td><span class="scorers-table__rank">${i + 1}</span></td>
        <td>
          <div class="scorers-table__player">
            <div>
              <div class="scorers-table__player-name">${player.name}</div>
              <div class="scorers-table__player-team">
                ${crest ? `<img class="scorers-table__team-crest" src="${crest}" alt="" style="display:inline;vertical-align:middle;margin-right:4px;" onerror="this.style.display='none'" />` : ''}
                ${team?.shortName || team?.name || ''}
              </div>
            </div>
          </div>
        </td>
        <td><span class="scorers-table__goals">${s.goals ?? 0}</span></td>
        <td>${s.assists ?? '—'}</td>
        <td>${s.penalties ?? '—'}</td>
        <td>${s.playedMatches ?? '—'}</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="scorers-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Jugador</th>
          <th>Goles</th>
          <th>Asist.</th>
          <th>Pen.</th>
          <th>PJ</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}
