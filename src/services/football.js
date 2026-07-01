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
  // Because the API filters using UTC dates, matches late at night in Bogota 
  // might fall on the next day in UTC. To fix this, we query a wider range 
  // (-1 day to +2 days) and then filter locally exactly for the requested range in Bogota time.
  const fromDate = new Date(dateFrom);
  fromDate.setDate(fromDate.getDate() - 1);
  const apiFrom = fromDate.toISOString().split('T')[0];

  const toDate = new Date(dateTo);
  toDate.setDate(toDate.getDate() + 2);
  const apiTo = toDate.toISOString().split('T')[0];

  const key = `matches_wide_${apiFrom}_${apiTo}`;
  const data = await cachedFetch(key, `/matches?dateFrom=${apiFrom}&dateTo=${apiTo}`, 'matches');
  
  if (!data || !data.matches) return data;

  // Helper to get strictly local YYYY-MM-DD in Bogota timezone
  const formatBogotaDate = (utcStr) => {
    const d = new Date(utcStr);
    const options = { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-CA', options).format(d);
  };

  // Filter matches so they exactly match the requested local date boundary
  const filteredMatches = data.matches.filter(match => {
    const localDateStr = formatBogotaDate(match.utcDate);
    return localDateStr >= dateFrom && localDateStr <= dateTo;
  });

  return { ...data, matches: filteredMatches };
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
export async function getScorers(code, season = null) {
  let endpoint = `/competitions/${code}/scorers`;
  if (season) endpoint += `?season=${season}`;
  const key = `scorers_${code}_${season || 'current'}`;
  
  let data = await cachedFetch(key, endpoint, 'scorers');

  // Fallback to previous season if no scorers are found (e.g. summer break before first match)
  if (!season && data && (!data.scorers || data.scorers.length === 0)) {
    const prevSeason = new Date().getFullYear() - 1;
    const prevData = await cachedFetch(`scorers_${code}_${prevSeason}`, `/competitions/${code}/scorers?season=${prevSeason}`, 'scorers');
    if (prevData && prevData.scorers && prevData.scorers.length > 0) {
      data = prevData;
    }
  }

  return data;
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

/** Get matches for a specific stage of a competition (e.g. LAST_16, QUARTER_FINALS) */
export async function getCompetitionMatchesByStage(code, stage) {
  const key = `comp_stage_${code}_${stage}`;
  return cachedFetch(key, `/competitions/${code}/matches?stage=${stage}`, 'matches');
}
