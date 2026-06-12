import { CapacitorHttp, Capacitor } from '@capacitor/core';

/**
 * Fetches and parses an M3U playlist file from a given URL.
 * Due to CORS, this might fail if the IPTV server doesn't allow cross-origin requests.
 * @param {string} url - The URL of the M3U file
 * @returns {Promise<Array>} List of channel objects { name, logo, group, url }
 */
export async function fetchAndParseM3U(url) {
  const isNativeApp = () => Capacitor.isNativePlatform();
  let text = '';

  try {
    if (isNativeApp()) {
      // APK: Direct native HTTP (no CORS restrictions)
      const res = await CapacitorHttp.get({ url });
      text = res.data;
    } else {
      // Browser: Try direct fetch first (works for public lists like iptv-org that support CORS)
      let loaded = false;
      try {
        const directRes = await fetch(url);
        if (directRes.ok) {
          text = await directRes.text();
          loaded = true;
        }
      } catch (e) {
        // Direct fetch failed (likely CORS), fallback to proxy
      }

      if (!loaded) {
        // Fallback to CORS proxies
        const proxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
          `https://corsproxy.io/?${encodeURIComponent(url)}`,
        ];
        
        for (const proxyUrl of proxies) {
          try {
            const response = await fetch(proxyUrl);
            if (response.ok) {
              text = await response.text();
              loaded = true;
              break;
            }
          } catch (e) {
            continue; // Try next proxy
          }
        }
      }
      
      if (!loaded) {
        throw new Error('No se pudo cargar la lista. Los proxies CORS no respondieron.');
      }
    }
  } catch (err) {
    throw new Error('No se pudo cargar la lista M3U. ' + (isNativeApp() ? 'Verifica tu conexión a internet.' : 'Algunos canales privados solo funcionan en la APK.'));
  }

  try {
    const jsonStr = JSON.parse(text);
    if (jsonStr.countries) {
      return parseTdtChannelsJson(jsonStr);
    }
  } catch (e) {
    // Not JSON, continue to M3U parsing
  }

  return parseM3U(text);
}

function parseTdtChannelsJson(json) {
  const channels = [];
  if (!json || !json.countries) return channels;

  json.countries.forEach(country => {
    if (country.ambits) {
      country.ambits.forEach(ambit => {
        const group = ambit.name || 'General';
        if (ambit.channels) {
          ambit.channels.forEach(ch => {
            const name = ch.name || 'Desconocido';
            const logo = ch.logo || '';
            // TDTChannels usually puts multiple streaming links in options.
            // Let's find the first valid m3u8 or stream link.
            let streamUrl = '';
            if (ch.options && ch.options.length > 0) {
              const validOption = ch.options.find(opt => opt.format === 'm3u8' || opt.format === 'stream');
              if (validOption) {
                streamUrl = validOption.url;
              }
            }
            if (streamUrl) {
              channels.push({ name, logo, group, url: streamUrl });
            }
          });
        }
      });
    }
  });

  return channels;
}

/**
 * Parses raw M3U text into an array of channel objects.
 * @param {string} text - Raw M3U file content
 * @returns {Array} List of channels
 */
export function parseM3U(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const channels = [];
  
  if (lines.length === 0 || (!lines[0].startsWith('#EXTM3U') && !lines[0].startsWith('#EXTINF'))) {
    throw new Error('El enlace proporcionado NO es un archivo M3U válido. (Si usas un servicio privado, asegúrate de que el enlace incluya tu usuario, contraseña y el formato m3u, no solo la dirección del servidor).');
  }

  let currentChannel = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF:')) {
      currentChannel = {};
      
      // Extract tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      if (logoMatch) currentChannel.logo = logoMatch[1];
      
      // Extract group-title
      const groupMatch = line.match(/group-title="([^"]+)"/);
      if (groupMatch) currentChannel.group = groupMatch[1];
      else currentChannel.group = 'General';

      // Extract channel name (comes after the last comma)
      const nameParts = line.split(',');
      if (nameParts.length > 1) {
        currentChannel.name = nameParts[nameParts.length - 1].trim();
      } else {
        currentChannel.name = 'Canal Desconocido';
      }
    } else if (!line.startsWith('#')) {
      // It's a stream URL
      currentChannel.url = line;
      if (currentChannel.name) {
        channels.push({ ...currentChannel });
      }
      currentChannel = {};
    }
  }

  return channels;
}
