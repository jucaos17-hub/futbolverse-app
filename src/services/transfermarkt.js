// src/services/transfermarkt.js
const API_BASE = 'https://transfermarkt-api.fly.dev';

export async function searchPlayer(query) {
  try {
    const res = await fetch(`${API_BASE}/players/search/${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('Error searching player:', e);
    return [];
  }
}

export async function getPlayerProfile(id) {
  try {
    const res = await fetch(`${API_BASE}/players/${id}/profile`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (e) {
    console.error('Error getting player profile:', e);
    return null;
  }
}

export async function getPlayerTransfers(id) {
  try {
    const res = await fetch(`${API_BASE}/players/${id}/transfers`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.transfers || [];
  } catch (e) {
    console.error('Error getting player transfers:', e);
    return [];
  }
}
