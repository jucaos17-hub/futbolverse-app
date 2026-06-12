import { apiGet } from './api.js';
import { cacheGet, cacheSet } from './cache.js';

async function cachedFetch(key, endpoint, cacheType = 'matches') {
  const cached = cacheGet(key);
  if (cached) return cached;

  const data = await apiGet(endpoint);
  cacheSet(key, data, cacheType);
  return data;
}

/** Get all available competitions (free tier = 12) */
export async function getCompetitions() {
  return cachedFetch('competitions', '/competitions', 'competitions');
}

/** Get a single competition details */
export async function getCompetition(code) {
  return cachedFetch(`competition_${code}`, `/competitions/${code}`, 'competitions');
}

/** Get today's matches across all competitions */
export async function getMatchesByDate(dateFrom, dateTo) {
  const key = `matches_${dateFrom}_${dateTo}`;
  return cachedFetch(key, `/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`, 'matches');
}

/** Get matches for a specific competition */
export async function getCompetitionMatches(code, matchday) {
  let endpoint = `/competitions/${code}/matches`;
  if (matchday) endpoint += `?matchday=${matchday}`;
  const key = `comp_matches_${code}_${matchday || 'all'}`;
  return cachedFetch(key, endpoint, 'matches');
}

/** Get standings for a competition */
export async function getStandings(code) {
  return cachedFetch(`standings_${code}`, `/competitions/${code}/standings`, 'standings');
}

/** Get top scorers for a competition */
export async function getScorers(code) {
  return cachedFetch(`scorers_${code}`, `/competitions/${code}/scorers`, 'scorers');
}

/** Get a single team details (squad, etc.) */
export async function getTeam(id) {
  return cachedFetch(`team_${id}`, `/teams/${id}`, 'teams');
}

/** Get matches for a specific team */
export async function getTeamMatches(id, limit = 10) {
  return cachedFetch(`team_matches_${id}`, `/teams/${id}/matches?limit=${limit}`, 'matches');
}

/** Get a specific match details */
export async function getMatch(id) {
  return cachedFetch(`match_${id}`, `/matches/${id}`, 'live');
}

/** Get competition teams */
export async function getCompetitionTeams(code) {
  return cachedFetch(`comp_teams_${code}`, `/competitions/${code}/teams`, 'teams');
}
