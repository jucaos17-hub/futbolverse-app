export async function fetchLiveChannels() {
  const url = 'https://www.tdtchannels.com/lists/tv.m3u8';
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al cargar TDTChannels');
    const data = await response.text();
    return parseM3U(data);
  } catch (error) {
    console.error('Error fetching live channels:', error);
    return [];
  }
}

function parseM3U(content) {
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
      const group = groupTitleMatch ? groupTitleMatch[1] : 'General';
      
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
