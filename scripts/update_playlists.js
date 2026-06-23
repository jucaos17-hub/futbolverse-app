const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapePlaylists() {
  console.log('Iniciando extracción de URLs desde Spinoff...');
  
  // Lanzar navegador
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Interceptar peticiones para acelerar si es necesario, pero aquí cargaremos normal
  await page.goto('https://spinoff.link/listas-iptv-actualizadas-2025/', { waitUntil: 'networkidle2' });

  // Esperar a que el script de tecnotv cargue y reemplace el valor "Cargando..."
  console.log('Esperando a que las listas carguen...');
  await page.waitForFunction(() => {
    const input = document.querySelector('input[data-iptv="lista.m3u"]');
    return input && input.value !== 'Cargando...' && input.value !== '';
  }, { timeout: 15000 }).catch(() => console.log('Timeout esperando lista.m3u, pero continuaremos.'));

  // Extraer las 3 URLs
  const playlists = await page.evaluate(() => {
    const principalInput = document.querySelector('input[data-iptv="lista.m3u"]');
    const deportesInput = document.querySelector('input[data-iptv="deportes.m3u"]');
    const peliculasInput = document.querySelector('input[data-iptv="peliculas.m3u"]');

    return {
      principal: principalInput ? principalInput.value : null,
      deportes: deportesInput ? deportesInput.value : null,
      peliculas: peliculasInput ? peliculasInput.value : null
    };
  });

  await browser.close();

  console.log('URLs extraídas:', playlists);

  if (!playlists.principal || !playlists.deportes || !playlists.peliculas) {
    console.error('Error: No se pudieron extraer todas las listas. Verifica si la estructura de la página cambió.');
    process.exit(1); // Falla el script para que GitHub Actions lo registre como error
  }

  // Leer el archivo remote_playlists.json actual
  const jsonPath = path.join(__dirname, '..', 'remote_playlists.json');
  let currentData = { sports: [], other: [] };

  if (fs.existsSync(jsonPath)) {
    try {
      const fileContent = fs.readFileSync(jsonPath, 'utf8');
      currentData = JSON.parse(fileContent);
    } catch (e) {
      console.warn('No se pudo parsear remote_playlists.json, se creará uno nuevo.');
    }
  }

  // Preparar la nueva estructura de datos, eliminando las listas anteriores para no acumular
  const newData = {
    version: currentData.version || 1,
    updated: new Date().toISOString().split('T')[0],
    categories: [
      {
        name: "📺 TV en Vivo",
        playlists: [
          { name: "🌎 TV (Todos los canales)", url: playlists.principal, user: "", pass: "" }
        ]
      },
      {
        name: "⚽ Deportes",
        playlists: [
          { name: "⚽ TecnoTV Deportes", url: playlists.deportes, user: "", pass: "" }
        ]
      },
      {
        name: "🎬 Películas y Series",
        playlists: [
          { name: "🎬 Peliculas", url: playlists.peliculas, user: "", pass: "" }
        ]
      }
    ]
  };

  const currentDataStr = JSON.stringify(currentData, null, 2);
  const newDataStr = JSON.stringify(newData, null, 2);
  const hasChanges = currentDataStr !== newDataStr;
  
  currentData = newData;

  if (hasChanges) {
    console.log('Se detectaron cambios. Guardando remote_playlists.json...');
    fs.writeFileSync(jsonPath, JSON.stringify(currentData, null, 2), 'utf8');
    console.log('Archivo actualizado con éxito.');
  } else {
    console.log('No hay cambios en las URLs. El archivo está actualizado.');
  }
}

scrapePlaylists().catch(err => {
  console.error('Error no controlado:', err);
  process.exit(1);
});
