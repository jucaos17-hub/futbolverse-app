const API_KEY = 'f93a91526c234116b729d653cb461953';

// En desarrollo (Vite dev server) usa proxy relativo; en producción (GitHub Pages / APK) usa URL absoluta
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_URL = isLocalDev
  ? '/api/v4'
  : 'https://api.football-data.org/v4';

let requestQueue = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  isProcessing = true;

  while (requestQueue.length > 0) {
    const { url, resolve, reject } = requestQueue.shift();
    try {
      let response;
      try {
        response = await fetch(url, {
          headers: {
            'X-Auth-Token': API_KEY,
          },
        });
      } catch (fetchErr) {
        // Si falla por CORS en GitHub Pages (entorno web en producción), intentamos con un proxy CORS público
        if (!isLocalDev && url.startsWith('https://api.football-data.org')) {
          console.warn('[API] Fallo de conexión/CORS directo, intentando a través de proxy CORS...', fetchErr);
          const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          response = await fetch(corsProxyUrl, {
            headers: {
              'X-Auth-Token': API_KEY,
            },
          });
        } else {
          throw fetchErr;
        }
      }

      if (response.status === 429) {
        // Rate limited — wait and retry
        console.warn('[API] Rate limited, waiting 6s...');
        await new Promise(r => setTimeout(r, 6000));
        requestQueue.unshift({ url, resolve, reject });
        continue;
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      let data;
      try {
        const textData = await response.text();
        data = JSON.parse(textData);
      } catch (parseErr) {
        throw new Error(`Invalid JSON from server. Maybe proxy failed?`);
      }
      
      resolve(data);
    } catch (err) {
      console.error("API Error:", err);
      reject(err);
    }

    // Small delay between requests to respect rate limits
    if (requestQueue.length > 0) {
      await new Promise(r => setTimeout(r, 700));
    }
  }

  isProcessing = false;
}

export function apiGet(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  return new Promise((resolve, reject) => {
    requestQueue.push({ url, resolve, reject });
    processQueue();
  });
}
