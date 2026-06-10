# 📱 Manual FútbolVerse APK — Nivel DIOS

## 🌐 Cómo Agregar Nuevos Canales (¡Sin Programar!)
La app está conectada a un archivo remoto en la nube. **No necesitas descargar la APK de nuevo** si solo quieres agregar listas de canales o películas.

1. Ve a [gist.github.com](https://gist.github.com) e inicia sesión.
2. Crea un **nuevo Gist** llamado `remote_playlists.json` con este contenido:
```json
{
  "version": 1,
  "updated": "2026-06-09",
  "categories": [
    {
      "name": "📺 TV en Vivo",
      "playlists": [
        { "name": "🌎 Latinoamérica", "url": "https://iptv-org.github.io/iptv/languages/spa.m3u", "user": "", "pass": "" }
      ]
    },
    {
      "name": "⚽ Deportes",
      "playlists": [
        { "name": "⚽ TecnoTV Deportes", "url": "https://tecnotv.club/jbvk/deportes.m3u", "user": "", "pass": "" }
      ]
    },
    {
      "name": "🎬 Películas y Series",
      "playlists": []
    }
  ]
}
```
3. Haz clic en el botón "Raw", copia la URL.
4. Esa URL debe ir en tu código fuente (`src/components/iptvPlayer.js` en la variable `REMOTE_PLAYLISTS_URL`).

Cada vez que quieras agregar un canal privado, solo edita el archivo Gist en GitHub y los cambios aparecerán inmediatamente en todos los celulares que tengan la app instalada.

---

## 🔨 Cómo Compilar la APK (Si haces cambios de código)
Si cambias colores, botones o programas funciones nuevas en el código fuente, **SÍ debes descargar una nueva APK**.

1. Haz tus cambios de código.
2. En la terminal ejecuta:
   `git add .`
   `git commit -m "Mis cambios"`
   `git push`
3. Ve a tu repositorio en GitHub > pestaña **"Actions"**.
4. Espera a que termine la compilación automática.
5. Descarga el archivo `.zip` que dice **"FutbolVerse-APK"**.
6. Pásalo al celular e instálalo.
