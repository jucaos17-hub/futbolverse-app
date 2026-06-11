export async function fetchLiveChannels() {
  const urls = [
    { url: 'https://www.tdtchannels.com/lists/tv.m3u8', defaultGroup: 'General' },
    { url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', defaultGroup: 'Deportes Global' }
  ];

  try {
    const promises = urls.map(async (src) => {
      try {
        const response = await fetch(src.url);
        if (!response.ok) throw new Error('Error HTTP');
        const data = await response.text();
        return parseM3U(data, src.defaultGroup);
      } catch (err) {
        console.warn('Error cargando lista:', src.url, err);
        return [];
      }
    });

    const results = await Promise.all(promises);
    // Unir todos los canales en un solo arreglo
    return results.flat();
  } catch (error) {
    console.error('Error fetching live channels:', error);
    return [];
  }
}

function parseM3U(content, defaultGroup = 'General') {
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
