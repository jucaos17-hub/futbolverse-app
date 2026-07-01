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

// Competitions that have knockout stages (cup/tournament format)
export const TOURNAMENT_COMPETITIONS = ['WC', 'EC', 'CL'];

// Knockout stages in display order with Spanish labels
export const KNOCKOUT_STAGES = [
  { stage: 'LAST_16',        label: 'Octavos de Final',  short: '8vos' },
  { stage: 'QUARTER_FINALS',  label: 'Cuartos de Final', short: '4tos' },
  { stage: 'SEMI_FINALS',     label: 'Semifinales',      short: 'Semis' },
  { stage: 'THIRD_PLACE',     label: 'Tercer Puesto',    short: '3er' },
  { stage: 'FINAL',           label: 'Final',            short: 'Final' },
];

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
// Sugerencias inteligentes de canales IPTV según la liga (API-Football IDs)
export const BROADCASTERS = {
  '39':  { names: ['ESPN', 'Star+'] }, // Premier League
  '140': { names: ['DSports', 'ESPN'] }, // La Liga
  '135': { names: ['ESPN', 'Star+'] }, // Serie A
  '78':  { names: ['ESPN', 'Star+'] }, // Bundesliga
  '61':  { names: ['ESPN', 'Star+', 'TV5'] }, // Ligue 1
  '2':   { names: ['ESPN', 'Star+'] }, // Champions League
  '3':   { names: ['ESPN', 'Star+'] }, // Europa League
  '13':  { names: ['ESPN', 'Fox Sports', 'Star+'] }, // Libertadores
  '239': { names: ['Win Sports', 'Win Sports+'] }, // Primera A Colombia
  '262': { names: ['TUDN', 'Vix'] }, // Liga MX
  '71':  { names: ['ESPN', 'Star+'] }, // Brasileirao
  '128': { names: ['ESPN Premium', 'TNT Sports'] }, // Argentina
  'DEFAULT': { names: ['ESPN', 'DSports', 'Fox Sports'] }
};

// Default broadcaster for competitions without specific mapping
export const DEFAULT_BROADCASTER = BROADCASTERS.DEFAULT;

