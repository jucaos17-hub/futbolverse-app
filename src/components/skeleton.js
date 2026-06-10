export function renderSkeleton(type = 'cards', count = 5) {
  if (type === 'cards') {
    return Array.from({ length: count }, () =>
      '<div class="skeleton skeleton--card"></div>'
    ).join('');
  }

  if (type === 'competitions') {
    return `<div class="competitions-grid">${
      Array.from({ length: count }, () =>
        '<div class="skeleton" style="height:200px;border-radius:var(--radius-lg);"></div>'
      ).join('')
    }</div>`;
  }

  if (type === 'detail') {
    return `
      <div class="skeleton" style="height:200px;border-radius:var(--radius-xl);margin-bottom:var(--sp-xl);"></div>
      <div class="skeleton" style="height:300px;border-radius:var(--radius-lg);"></div>
    `;
  }

  return '<div class="skeleton skeleton--card"></div>';
}
