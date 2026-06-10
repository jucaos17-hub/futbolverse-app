export function renderCompetitionCard(comp) {
  const emblem = comp.emblem || '';
  const areaFlag = comp.area?.flag || '';
  const areaName = comp.area?.name || '';
  const season = comp.currentSeason
    ? `${comp.currentSeason.startDate?.substring(0, 4)} / ${comp.currentSeason.endDate?.substring(0, 4)}`
    : '';

  return `
    <div class="competition-card" data-comp-code="${comp.code}" id="comp-card-${comp.code}">
      ${emblem ? `<img class="competition-card__emblem" src="${emblem}" alt="${comp.name}" onerror="this.style.display='none'" loading="lazy" />` : '<div class="competition-card__emblem" style="font-size:3rem;display:flex;align-items:center;justify-content:center;">🏆</div>'}
      <div class="competition-card__name">${comp.name}</div>
      <div class="competition-card__area">
        ${areaFlag ? `<img class="competition-card__area-flag" src="${areaFlag}" alt="${areaName}" onerror="this.style.display='none'" />` : ''}
        <span>${areaName}</span>
      </div>
      ${season ? `<span class="competition-card__season">${season}</span>` : ''}
    </div>
  `;
}
