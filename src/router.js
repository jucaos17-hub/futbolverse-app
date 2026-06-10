const routes = {};
let currentCleanup = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigateTo(path) {
  window.location.hash = path;
}

function matchRoute(hash) {
  const path = hash.replace('#', '') || '/';

  // Exact match first
  if (routes[path]) return { handler: routes[path], params: {} };

  // Parameterized routes: /standings/:code, /match/:id, /team/:id, /scorers/:code
  for (const pattern of Object.keys(routes)) {
    const paramNames = [];
    const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const regex = new RegExp(`^${regexStr}$`);
    const match = path.match(regex);
    if (match) {
      const params = {};
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { handler: routes[pattern], params };
    }
  }

  return null;
}

export function initRouter() {
  const container = document.getElementById('main-content');

  async function handleRoute() {
    const hash = window.location.hash || '#/';
    const result = matchRoute(hash);

    if (!result) {
      container.innerHTML = `
        <div class="container">
          <div class="empty-state">
            <div class="empty-state__icon">🔍</div>
            <div class="empty-state__title">Página no encontrada</div>
            <div class="empty-state__text">La página que buscas no existe.</div>
            <button class="btn btn--primary" onclick="location.hash='#/'" style="margin-top:1rem">Ir al inicio</button>
          </div>
        </div>
      `;
      return;
    }

    // Cleanup previous page
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }

    // Page transition
    container.classList.remove('page-enter');
    container.innerHTML = '<div class="container"><div class="spinner"></div></div>';

    try {
      const cleanup = await result.handler(container, result.params);
      if (typeof cleanup === 'function') {
        currentCleanup = cleanup;
      }
      container.classList.add('page-enter');
    } catch (err) {
      console.error('[Router] Error rendering page:', err);
      container.innerHTML = `
        <div class="container">
          <div class="empty-state">
            <div class="empty-state__icon">⚠️</div>
            <div class="empty-state__title">Error al cargar</div>
            <div class="empty-state__text">${err.message || 'Ocurrió un error inesperado.'}</div>
            <button class="btn btn--primary" onclick="location.reload()" style="margin-top:1rem">Reintentar</button>
          </div>
        </div>
      `;
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('data-href');
      if (href && hash.startsWith(href)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
