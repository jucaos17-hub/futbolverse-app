export const TEAMS_THEMES = [
  { id: 'default', name: 'FútbolVerse (Por Defecto)', primary: '145, 65%, 42%', light: '145, 65%, 55%', dark: '145, 65%, 30%', accent: '48, 100%, 50%', logo: '⚽' },
  { id: 'real_madrid', name: 'Real Madrid', primary: '220, 15%, 95%', light: '220, 15%, 100%', dark: '220, 15%, 80%', accent: '48, 100%, 50%', logo: '👑' },
  { id: 'barcelona', name: 'FC Barcelona', primary: '348, 83%, 47%', light: '348, 83%, 55%', dark: '348, 83%, 35%', accent: '223, 76%, 35%', logo: '🔵🔴' },
  { id: 'boca_juniors', name: 'Boca Juniors', primary: '215, 87%, 30%', light: '215, 87%, 45%', dark: '215, 87%, 20%', accent: '48, 100%, 50%', logo: '💙💛' },
  { id: 'river_plate', name: 'River Plate', primary: '0, 0%, 95%', light: '0, 0%, 100%', dark: '0, 0%, 85%', accent: '0, 80%, 50%', logo: '⚪🔴' },
  { id: 'man_united', name: 'Manchester United', primary: '356, 82%, 46%', light: '356, 82%, 55%', dark: '356, 82%, 35%', accent: '48, 100%, 50%', logo: '👹' },
  { id: 'man_city', name: 'Manchester City', primary: '197, 71%, 73%', light: '197, 71%, 85%', dark: '197, 71%, 60%', accent: '220, 20%, 14%', logo: '🩵' },
  { id: 'bayern', name: 'Bayern Munich', primary: '346, 84%, 46%', light: '346, 84%, 55%', dark: '346, 84%, 35%', accent: '220, 15%, 95%', logo: '🥨' },
  { id: 'psg', name: 'PSG', primary: '218, 54%, 25%', light: '218, 54%, 35%', dark: '218, 54%, 15%', accent: '348, 83%, 47%', logo: '🗼' },
  { id: 'juventus', name: 'Juventus', primary: '0, 0%, 15%', light: '0, 0%, 25%', dark: '0, 0%, 5%', accent: '0, 0%, 95%', logo: '🦓' }
];

export function applyTheme(themeId) {
  const theme = TEAMS_THEMES.find(t => t.id === themeId) || TEAMS_THEMES[0];
  const root = document.documentElement;

  // We are storing HSL values without the 'hsl()' wrapper to make glowing and rgba work easily if needed,
  // but our variables.css expects full hsl(). So we set them accordingly.
  root.style.setProperty('--clr-primary', `hsl(${theme.primary})`);
  root.style.setProperty('--clr-primary-light', `hsl(${theme.light})`);
  root.style.setProperty('--clr-primary-dark', `hsl(${theme.dark})`);
  root.style.setProperty('--clr-primary-glow', `hsla(${theme.primary}, 0.25)`);
  root.style.setProperty('--clr-accent', `hsl(${theme.accent})`);
  root.style.setProperty('--clr-accent-soft', `hsla(${theme.accent}, 0.15)`);

  // Special case for light primary colors (like Real Madrid or River) so text on primary buttons is readable
  const isLight = theme.primary.includes('95%') || theme.primary.includes('73%');
  if (isLight) {
    root.style.setProperty('--clr-btn-text', '#111');
  } else {
    root.style.setProperty('--clr-btn-text', '#fff');
  }

  localStorage.setItem('futbolverse_theme', themeId);
}

export function loadSavedTheme() {
  const saved = localStorage.getItem('futbolverse_theme');
  if (saved) {
    applyTheme(saved);
  }
}

export function openThemeSelectorModal() {
  let container = document.getElementById('theme-selector-modal');
  if (!container) {
    container = document.createElement('div');
    container.id = 'theme-selector-modal';
    document.body.appendChild(container);
  }

  const currentTheme = localStorage.getItem('futbolverse_theme') || 'default';

  container.innerHTML = `
    <div id="ts-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 4000; display: flex; align-items: flex-end; justify-content: center; padding: 0;">
      <div id="ts-content" style="background: var(--clr-surface); width: 100%; max-width: 500px; height: 70vh; border-top-left-radius: 24px; border-top-right-radius: 24px; display: flex; flex-direction: column; overflow: hidden; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        
        <div style="background: var(--clr-surface-alt); padding: 16px; border-bottom: 1px solid var(--clr-border); position: relative; text-align: center;">
          <div style="width: 40px; height: 5px; background: var(--clr-border); border-radius: 3px; margin: 0 auto 16px auto;"></div>
          <button id="ts-close" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; color: var(--clr-text-muted); cursor: pointer;">&times;</button>
          <h3 style="margin: 0; font-size: 18px; color: var(--clr-text);">🎨 Personaliza tu App</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--clr-text-muted);">Elige los colores de tu equipo favorito</p>
        </div>

        <div id="ts-list" style="flex: 1; overflow-y: auto; padding: 16px; background: var(--clr-background); display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-content: start;">
           ${TEAMS_THEMES.map(theme => `
             <div class="ts-card ${currentTheme === theme.id ? 'active' : ''}" data-id="${theme.id}" style="background: var(--clr-surface-alt); border: 2px solid ${currentTheme === theme.id ? 'var(--clr-primary)' : 'var(--clr-border)'}; border-radius: 12px; padding: 16px; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <div style="font-size: 32px;">${theme.logo}</div>
                <div style="font-size: 12px; font-weight: bold;">${theme.name}</div>
                <div style="display:flex; gap:4px; margin-top:4px;">
                  <div style="width:16px; height:16px; border-radius:50%; background: hsl(${theme.primary});"></div>
                  <div style="width:16px; height:16px; border-radius:50%; background: hsl(${theme.accent});"></div>
                </div>
             </div>
           `).join('')}
        </div>
      </div>
    </div>
  `;

  // Animate Entrance
  const content = document.getElementById('ts-content');
  requestAnimationFrame(() => {
    content.style.transform = 'translateY(0)';
  });

  // Close Logic
  const closeBtn = document.getElementById('ts-close');
  const backdrop = document.getElementById('ts-backdrop');
  
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

  // Add click listeners to cards
  const cards = container.querySelectorAll('.ts-card');
  cards.forEach(card => {
    card.onclick = () => {
      const id = card.getAttribute('data-id');
      applyTheme(id);
      
      // Update UI selection visually without closing immediately
      cards.forEach(c => {
        c.style.borderColor = 'var(--clr-border)';
      });
      card.style.borderColor = 'var(--clr-primary)';
      
      // Let user see the app change colors for a second, then close
      setTimeout(() => {
        closeModal();
      }, 400);
    };
  });
}
