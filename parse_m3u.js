const fs = require('fs');
const content = fs.readFileSync('lista m3u.json', 'utf8');

const segments = content.split('#EXTINF');
const channels = [];

for (let i = 1; i < segments.length; i++) {
  let segment = segments[i];
  
  const logoMatch = segment.match(/tvg-logo="([^"]+)"/);
  const logo = logoMatch ? logoMatch[1] : '';
  
  const groupMatch = segment.match(/group-title="([^"]+)"/);
  const group = groupMatch ? groupMatch[1] : 'Otros';
  
  const commaIndex = segment.indexOf(',');
  let name = 'Desconocido';
  let url = '';
  
  if (commaIndex !== -1) {
    const afterComma = segment.substring(commaIndex + 1);
    const httpIndex = afterComma.indexOf('http');
    if (httpIndex !== -1) {
      name = afterComma.substring(0, httpIndex).replace(/#EXTVLCOPT.*$/, '').trim();
      const urlPart = afterComma.substring(httpIndex);
      const spaceIndex = urlPart.indexOf(' ');
      if (spaceIndex !== -1) {
        url = urlPart.substring(0, spaceIndex).trim();
      } else {
        url = urlPart.trim();
      }
    }
  }
  
  if (url && url.startsWith('http')) {
    channels.push({ name, logo, group, url });
  }
}

fs.writeFileSync('./src/utils/defaultPlaylist.js', 'export const defaultChannels = ' + JSON.stringify(channels, null, 2) + ';');
console.log('Parsed ' + channels.length + ' channels.');
