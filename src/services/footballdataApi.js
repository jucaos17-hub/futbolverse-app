import { cacheGet, cacheSet } from './cache.js';

const FD_API_KEY = 'fd_4d464c918053da6819fe2a73617d619080fb0c3c8afade76';
const FD_BASE_URL = 'https://footballdata.io/api/v1';

// Mappings from API-Sports to Footballdata
export const LEAGUE_MAP_TO_FD = {
  '39': '15', // Premier League
  '140': '10', // La Liga
  '2': '45', // Champions League
  '3': '46', // Europa League
  '1': '50', // World Cup (Assuming API-Sports WC is 1)
};

export const LEAGUE_MAP_TO_APISPORTS = {
  '15': '39',
  '10': '140',
  '45': '2',
  '46': '3',
  '50': '1'
};

async function fdFetch(endpoint) {
  const url = `${FD_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${FD_API_KEY}` }
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.success) return data.data;
    return null;
  } catch (err) {
    console.warn('[Footballdata] Error fetching:', err);
    return null;
  }
}

function mapStatus(s) {
  if (s === 'incomplete') return 'SCHEDULED';
  if (s === 'complete' || s === 'finished') return 'FINISHED';
  if (s === 'playing' || s === 'live') return 'IN_PLAY';
  return 'SCHEDULED';
}

function mapMatch(m) {
  if (!m) return null;
  const apiSportsLeagueId = LEAGUE_MAP_TO_APISPORTS[m.league.league_id.toString()] || m.league.league_id.toString();
  
  return {
    id: m.match_id.toString(),
    utcDate: m.match_date.replace(' ', 'T') + 'Z', // Basic ISO formatting
    status: mapStatus(m.status),
    minute: null,
    score: {
      fullTime: {
        home: m.score?.home,
        away: m.score?.away
      }
    },
    homeTeam: {
      id: m.home_team.team_id.toString(),
      name: m.home_team.team_name,
      shortName: m.home_team.team_name,
      crest: m.home_team.team_logo
    },
    awayTeam: {
      id: m.away_team.team_id.toString(),
      name: m.away_team.team_name,
      shortName: m.away_team.team_name,
      crest: m.away_team.team_logo
    },
    competition: {
      code: apiSportsLeagueId,
      name: m.league.name,
      emblem: m.league.image
    },
    lineups: [],
    statistics: [],
    events: []
  };
}

export async function getFdMatchesByDate(dateFrom) {
  const fromStr = dateFrom.split('T')[0];
  const cached = cacheGet(`fd_matches_${fromStr}`);
  if (cached) return cached;

  const data = await fdFetch(`/fixtures/today`); // Footballdata free plan mostly handles today or specific dates
  // For other dates we might need `/fixtures?date=`
  // Let's use generic if today doesn't match:
  const todayStr = new Date().toISOString().split('T')[0];
  let finalData = data;
  if (fromStr !== todayStr) {
    finalData = await fdFetch(`/fixtures?date=${fromStr}`);
  }

  if (!finalData || !finalData.matches) return { matches: [] };
  
  const mapped = { matches: finalData.matches.map(mapMatch) };
  cacheSet(`fd_matches_${fromStr}`, mapped, 'matches');
  return mapped;
}

export async function getFdStandings(apiSportsCode) {
  const fdCode = LEAGUE_MAP_TO_FD[apiSportsCode];
  if (!fdCode) return null; // Not supported by Footballdata mapping

  const cached = cacheGet(`fd_standings_${fdCode}`);
  if (cached) return cached;

  const data = await fdFetch(`/leagues/${fdCode}/standings`);
  if (!data || !Array.isArray(data)) return null;

  // Map to the format app expects
  const mappedStandings = [{
    table: data.map(t => ({
      position: t.position,
      team: { id: t.team.team_id.toString(), name: t.team.team_name_clean || t.team.team_name, crest: t.team.team_logo },
      playedGames: t.record.matches_played,
      won: t.record.wins,
      draw: t.record.draws,
      lost: t.record.losses,
      points: t.record.points,
      goalsFor: t.goals.for,
      goalsAgainst: t.goals.against,
      goalDifference: t.goals.difference
    }))
  }];

  const result = { standings: mappedStandings };
  cacheSet(`fd_standings_${fdCode}`, result, 'standings');
  return result;
}
