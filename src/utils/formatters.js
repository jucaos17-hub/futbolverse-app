import { STATUS_LABELS, LIVE_STATUSES, FINISHED_STATUSES } from './constants.js';

/** Format a date string to local Spanish format */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Format time from UTC date string to local time */
export function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Get short date for display */
export function formatShortDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

/** Format date to YYYY-MM-DD for API queries */
export function toApiDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Get today's date as YYYY-MM-DD */
export function getToday() {
  return toApiDate(new Date());
}

/** Get a date offset from today */
export function getDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toApiDate(d);
}

/** Translate match status */
export function translateStatus(status) {
  return STATUS_LABELS[status] || status;
}

/** Check if match is live */
export function isLive(status) {
  return LIVE_STATUSES.includes(status);
}

/** Check if match is finished */
export function isFinished(status) {
  return FINISHED_STATUSES.includes(status);
}

/** Format score, returns '—' if no score */
export function formatScore(score) {
  if (score === null || score === undefined) return '—';
  return String(score);
}

/** Format goal difference with +/- */
export function formatGD(gd) {
  if (gd > 0) return `+${gd}`;
  return String(gd);
}

/** Get crest URL with fallback */
export function getCrest(url) {
  if (!url) return '';
  return url;
}

/** Relative time (e.g., "hace 5 minutos") */
export function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'hace unos segundos';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
  return formatShortDate(dateStr);
}
