// Free tier competition codes
export const COMPETITIONS = [
  { code: 'WC',  name: 'FIFA World Cup 2026',  area: 'World',       flag: '🏆' },
  { code: 'CL',  name: 'Champions League',    area: 'Europe',      flag: '🏆' },
  { code: 'PL',  name: 'Premier League',       area: 'England',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PD',  name: 'La Liga',              area: 'Spain',       flag: '🇪🇸' },
  { code: 'BL1', name: 'Bundesliga',           area: 'Germany',     flag: '🇩🇪' },
  { code: 'SA',  name: 'Serie A',              area: 'Italy',       flag: '🇮🇹' },
  { code: 'FL1', name: 'Ligue 1',              area: 'France',      flag: '🇫🇷' },
  { code: 'DED', name: 'Eredivisie',           area: 'Netherlands', flag: '🇳🇱' },
  { code: 'PPL', name: 'Primeira Liga',        area: 'Portugal',    flag: '🇵🇹' },
  { code: 'ELC', name: 'Championship',         area: 'England',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'BSA', name: 'Brasileirão Série A',  area: 'Brazil',      flag: '🇧🇷' },
  { code: 'EC',  name: 'European Championship', area: 'Europe',     flag: '🇪🇺' },
];

export const COMPETITION_MAP = Object.fromEntries(
  COMPETITIONS.map(c => [c.code, c])
);

// Status translations
export const STATUS_LABELS = {
  SCHEDULED: 'Programado',
  TIMED: 'Programado',
  IN_PLAY: 'En Juego',
  PAUSED: 'Entretiempo',
  FINISHED: 'Finalizado',
  POSTPONED: 'Aplazado',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
  AWARDED: 'Otorgado',
  LIVE: 'En Vivo',
};

export const LIVE_STATUSES = ['IN_PLAY', 'PAUSED', 'LIVE'];
export const FINISHED_STATUSES = ['FINISHED', 'AWARDED'];
export const SCHEDULED_STATUSES = ['SCHEDULED', 'TIMED'];

// Position labels
export const POSITION_LABELS = {
  Goalkeeper: 'Portero',
  Defence: 'Defensa',
  Midfield: 'Mediocampo',
  Offence: 'Delantero',
};

// Placeholder crest
export const PLACEHOLDER_CREST = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="12" fill="%23161B22"/><text x="50" y="58" text-anchor="middle" font-family="sans-serif" font-size="32" fill="%23555">⚽</text></svg>')}`;

// ═══ BROADCASTING / STREAMING INFO ═══
// Opciones para ver los partidos (Gratuitas)
export const BROADCASTERS = {
  WC: {
    name: 'Copa Mundial FIFA 2026',
    channels: [
      { name: 'Fútbol Libre',      url: 'https://librefutboltv.com/',    icon: '🔥', desc: 'Gratis por internet' },
      { name: 'RojaDirecta',       url: 'https://www.rojadirectatv.tv/', icon: '📺', desc: 'Gratis por internet' },
      { name: 'PirloTV',           url: 'https://www.pirlotv.fr/',       icon: '⚽', desc: 'Gratis por internet' },
    ],
  },
  DEFAULT: {
    channels: [
      { name: 'Fútbol Libre',      url: 'https://librefutboltv.com/',    icon: '🔥', desc: 'Gratis por internet' },
      { name: 'RojaDirecta',       url: 'https://www.rojadirectatv.tv/', icon: '📺', desc: 'Gratis por internet' },
      { name: 'PirloTV',           url: 'https://www.pirlotv.fr/',       icon: '⚽', desc: 'Gratis por internet' },
    ],
  }
};

// Default broadcaster for competitions without specific mapping
export const DEFAULT_BROADCASTER = BROADCASTERS.DEFAULT;

