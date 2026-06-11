export async function fetchEPG() {
  const epgUrl = 'https://www.tdtchannels.com/epg/TV.xml.gz';
  const epgMap = new Map(); // Map of tvgId -> currentProgramTitle

  try {
    const response = await fetch(epgUrl);
    if (!response.ok) throw new Error('Error al cargar la EPG');

    // Descomprimir usando DecompressionStream (Browser native)
    let text = '';
    if (typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('gzip');
      const decompressedStream = response.body.pipeThrough(ds);
      text = await new Response(decompressedStream).text();
    } else {
      console.warn('DecompressionStream no está soportado en este navegador.');
      return epgMap;
    }

    // Parsear el XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    
    const programmes = xmlDoc.getElementsByTagName('programme');
    const now = new Date();

    for (let i = 0; i < programmes.length; i++) {
      const prog = programmes[i];
      const channelId = prog.getAttribute('channel');
      const startStr = prog.getAttribute('start');
      const stopStr = prog.getAttribute('stop');

      if (!channelId || !startStr || !stopStr) continue;

      const startTime = parseEpgDate(startStr);
      const stopTime = parseEpgDate(stopStr);

      // Si el programa actual está dentro del rango horario
      if (now >= startTime && now <= stopTime) {
        const titleNode = prog.querySelector('title');
        if (titleNode) {
          epgMap.set(channelId, titleNode.textContent);
        }
      }
    }

    return epgMap;
  } catch (error) {
    console.error('Error fetching/parsing EPG:', error);
    return epgMap;
  }
}

function parseEpgDate(dateStr) {
  // Format: 20260611180000 +0200
  if (!dateStr || dateStr.length < 19) return new Date();
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const hour = dateStr.substring(8, 10);
  const minute = dateStr.substring(10, 12);
  const second = dateStr.substring(12, 14);
  const tz = dateStr.substring(15); // e.g. +0200
  
  // Create ISO string: "YYYY-MM-DDTHH:mm:ss+HH:mm"
  const tzFormatted = tz.substring(0, 3) + ':' + tz.substring(3, 5);
  const isoStr = `${year}-${month}-${day}T${hour}:${minute}:${second}${tzFormatted}`;
  
  return new Date(isoStr);
}
