import { apiGet } from './api.js';
import { cacheGet, cacheSet } from './cache.js';

async function cachedFetch(key, endpoint, cacheType = 'matches') {
  const cached = cacheGet(key);
  if (cached) return cached;
  const response = await apiGet(endpoint);
  
  // API-Football always returns data in response.response
  const data = response.response;
  cacheSet(key, data, cacheType);
  return data;
}

// Map API-Football status to generic status
function mapStatus(shortStatus) {
  if (['1H', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(shortStatus)) return 'IN_PLAY';
  if (shortStatus === 'HT') return 'PAUSED';
  if (['FT', 'AET', 'PEN'].includes(shortStatus)) return 'FINISHED';
  if (['PST', 'CANC', 'ABD'].includes(shortStatus)) return 'POSTPONED';
  return 'SCHEDULED';
}

function mapMatch(f) {
  if (!f || !f.fixture) return null;
  return {
    id: f.fixture.id,
    utcDate: f.fixture.date,
    status: mapStatus(f.fixture.status.short),
    minute: f.fixture.status.elapsed,
    score: {
      fullTime: {
        home: f.goals.home,
        away: f.goals.away
      }
    },
    homeTeam: {
      id: f.teams.home.id,
      name: f.teams.home.name,
      shortName: f.teams.home.name,
      crest: f.teams.home.logo
    },
    awayTeam: {
      id: f.teams.away.id,
      name: f.teams.away.name,
      shortName: f.teams.away.name,
      crest: f.teams.away.logo
    },
    competition: {
      code: f.league.id?.toString(),
      name: f.league.name,
      emblem: f.league.logo
    },
    // New data for Match Details Modal
    lineups: f.lineups || [],
    statistics: f.statistics || [],
    events: f.events || []
  };
}

/** Get all available competitions */
export async function getCompetitions() {
  const leagues = await cachedFetch('competitions', '/leagues?current=true', 'competitions');
  // API-Football has 1000+ leagues, we filter a few top ones so the app doesn't freeze
  const topIds = [39, 140, 135, 78, 61, 2, 3, 13, 253, 268]; 
  const filtered = leagues.filter(l => topIds.includes(l.league.id));
  
  return {
    competitions: filtered.map(l => ({
      code: l.league.id.toString(),
      name: l.league.name,
      emblem: l.league.logo,
      type: l.league.type
    }))
  };
}

/** Get a single competition details */
export async function getCompetition(code) {
  const leagues = await cachedFetch(`competition_${code}`, `/leagues?id=${code}`, 'competitions');
  const l = leagues[0];
  if (!l) return null;
  return {
    code: l.league.id.toString(),
    name: l.league.name,
    emblem: l.league.logo,
  };
}

/** Get today's matches across all competitions */
export async function getMatchesByDate(dateFrom, dateTo) {
  // api-football format YYYY-MM-DD
  const fromStr = dateFrom.split('T')[0];
  const toStr = dateTo.split('T')[0];
  const fixtures = await cachedFetch(`matches_${fromStr}_${toStr}`, `/fixtures?from=${fromStr}&to=${toStr}`, 'matches');
  
  return { matches: fixtures.map(mapMatch).filter(m => m != null) };
}

/** Get matches for a specific competition */
export async function getCompetitionMatches(code, matchday) {
  // Requires season. Default to current year.
  const season = new Date().getFullYear();
  let endpoint = `/fixtures?league=${code}&season=${season}`;
  // We can't map 'matchday' easily to API-Football rounds without complex round strings, so we fetch next/last 20
  const fixtures = await cachedFetch(`comp_matches_${code}`, endpoint, 'matches');
  
  return { matches: fixtures.map(mapMatch).filter(m => m != null) };
}

/** Get standings for a competition */
export async function getStandings(code) {
  const season = new Date().getFullYear();
  const res = await cachedFetch(`standings_${code}`, `/standings?league=${code}&season=${season}`, 'standings');
  if (!res || !res[0] || !res[0].league || !res[0].league.standings) return { standings: [] };
  
  const standings = res[0].league.standings;
  // Api-football standings is an array of arrays (for groups)
  const mappedStandings = standings.map(group => ({
    table: group.map(t => ({
      position: t.rank,
      team: { id: t.team.id, name: t.team.name, crest: t.team.logo },
      playedGames: t.all.played,
      won: t.all.win,
      draw: t.all.draw,
      lost: t.all.lose,
      points: t.points,
      goalsFor: t.all.goals.for,
      goalsAgainst: t.all.goals.against,
      goalDifference: t.goalsDiff
    }))
  }));

  return { standings: mappedStandings };
}

/** Get top scorers for a competition */
export async function getScorers(code) {
  const season = new Date().getFullYear();
  const scorers = await cachedFetch(`scorers_${code}`, `/players/topscorers?league=${code}&season=${season}`, 'scorers');
  
  return {
    scorers: scorers.map(s => ({
      player: { name: s.player.name },
      team: { name: s.statistics[0].team.name, crest: s.statistics[0].team.logo },
      goals: s.statistics[0].goals.total,
      assists: s.statistics[0].goals.assists
    }))
  };
}

/** Get a single team details */
export async function getTeam(id) {
  const teams = await cachedFetch(`team_${id}`, `/teams?id=${id}`, 'teams');
  const t = teams[0];
  if (!t) return null;
  return {
    id: t.team.id,
    name: t.team.name,
    shortName: t.team.name,
    crest: t.team.logo,
    squad: [] // Would need a separate call to /players/squads
  };
}

/** Get matches for a specific team */
export async function getTeamMatches(id, limit = 10) {
  const season = new Date().getFullYear();
  const fixtures = await cachedFetch(`team_matches_${id}`, `/fixtures?team=${id}&season=${season}&last=${limit}`, 'matches');
  return { matches: fixtures.map(mapMatch).filter(m => m != null) };
}

/** Get a specific match details (with lineups, stats, events) */
export async function getMatch(id) {
  const fixtures = await cachedFetch(`match_${id}`, `/fixtures?id=${id}`, 'live');
  return mapMatch(fixtures[0]);
}

/** Get competition teams */
export async function getCompetitionTeams(code) {
  const season = new Date().getFullYear();
  const teamsRes = await cachedFetch(`comp_teams_${code}`, `/teams?league=${code}&season=${season}`, 'teams');
  return {
    teams: teamsRes.map(t => ({
      id: t.team.id,
      name: t.team.name,
      crest: t.team.logo
    }))
  };
}
