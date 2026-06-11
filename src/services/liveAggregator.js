import { Capacitor } from '@capacitor/core';

async function fetchText(url) {
  const isNative = Capacitor.isNativePlatform();
  if (isNative) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return await response.text();
  } else {
    const proxies = [
      (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
      (u) => 'https://corsproxy.io/?' + encodeURIComponent(u),
    ];
    for (const getProxyUrl of proxies) {
      try {
        const proxyUrl = getProxyUrl(url);
        const response = await fetch(proxyUrl);
        if (response.ok) {
          return await response.text();
        }
      } catch (err) {
        // continue to next proxy
      }
    }
    // Try direct fetch as last resort
    const response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return await response.text();
  }
}

async function fetchJson(url) {
  const text = await fetchText(url);
  return JSON.parse(text);
}

export async function fetchLiveChannels() {
  const REMOTE_PLAYLISTS_URL = 'https://raw.githubusercontent.com/jucaos17-hub/futbolverse-app/main/remote_playlists.json';
  const fallbackUrls = [
    { url: 'https://tecnotv.club/jbvk/deportes.m3u', name: 'Deportes' }
  ];

  let sportsPlaylists = [];

  try {
    const data = await fetchJson(REMOTE_PLAYLISTS_URL + '?t=' + Date.now());
    if (data && data.categories) {
      data.categories.forEach(cat => {
        const nameLower = (cat.name || '').toLowerCase();
        if (nameLower.includes('deportes') || nameLower.includes('sports')) {
          if (cat.playlists && cat.playlists.length > 0) {
            cat.playlists.forEach(pl => {
              sportsPlaylists.push({
                url: pl.url,
                name: pl.name || 'Deportes'
              });
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn('[LiveAggregator] No se pudo cargar remote_playlists.json, usando fallback:', err);
  }

  if (sportsPlaylists.length === 0) {
    sportsPlaylists = fallbackUrls;
  }

  try {
    const promises = sportsPlaylists.map(async (src) => {
      try {
        const data = await fetchText(src.url);
        return parseM3U(data, src.name);
      } catch (err) {
        console.warn('Error cargando lista de deportes:', src.url, err);
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error('Error fetching live channels:', error);
    return [];
  }
}

function parseM3U(content, defaultGroup = 'Deportes') {
  const lines = content.split('\n');
  const channels = [];
  let currentChannel = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      // Parse attributes
      const tvgIdMatch = line.match(/tvg-id="([^"]+)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupTitleMatch = line.match(/group-title="([^"]+)"/);
      
      const id = tvgIdMatch ? tvgIdMatch[1] : '';
      const logo = tvgLogoMatch ? tvgLogoMatch[1] : '';
      const group = (groupTitleMatch && groupTitleMatch[1]) ? groupTitleMatch[1] : defaultGroup;
      
      // Extract name (everything after the last comma)
      const commaIndex = line.lastIndexOf(',');
      const name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Canal Desconocido';
      
      currentChannel = {
        id,
        name,
        logo,
        category: group,
      };
    } else if (line.startsWith('http')) {
      if (currentChannel.name) {
        currentChannel.url = line;
        
        // Determinar calidad simulada por el tipo de stream o random para darle vista premium
        currentChannel.quality = line.includes('1080') ? 'HD' : 'SD';
        currentChannel.stability = Math.floor(Math.random() * 20) + 80; // 80-100%
        currentChannel.ping = Math.floor(Math.random() * 50) + 10; // 10-60ms
        
        channels.push({ ...currentChannel });
        currentChannel = {}; // reset
      }
    }
  }

  return channels;
}
