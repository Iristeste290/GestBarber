// Service Worker for GestBarber PWA - v4 Navigation Lock (/auth)
const CACHE_NAME = 'gestbarber-v4';
const STATIC_CACHE = 'gestbarber-static-v4';
const DYNAMIC_CACHE = 'gestbarber-dynamic-v4';

// Recursos estáticos para cache imediato
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Padrões de URL para cache dinâmico
const CACHEABLE_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.woff2?$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.svg$/,
  /\.webp$/,
];

// Recursos que nunca devem ser cacheados
const NO_CACHE_PATTERNS = [
  /supabase\.co/,
  /\/api\//,
  /hot-update/,
  /@vite/,
];

// Instalação - cache de recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => {
              console.log('[SW] Removing old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Permite ativar imediatamente a nova versão do SW
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch - estratégia de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições que não devem ser cacheadas
  if (NO_CACHE_PATTERNS.some((pattern) => pattern.test(url.href))) {
    return;
  }

  // Ignora requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Navegação (SPA): devolve o app shell SEM "trocar" a URL para "/".
  // Importante: retornar diretamente o Response do cache de "/" pode fazer alguns browsers
  // adotarem o response.url como URL do documento (voltando para "/"). Para evitar isso,
  // reconstruímos um Response "sem URL".
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cachedShell = await caches.match('/');

      const toUrlAgnosticResponse = async (resp: Response) => {
        const clone = resp.clone();
        const body = await clone.text();
        return new Response(body, {
          status: clone.status,
          statusText: clone.statusText,
          headers: clone.headers,
        });
      };

      if (cachedShell) {
        // Atualiza o shell em background
        event.waitUntil(
          fetch('/')
            .then(async (resp) => {
              if (!resp || !resp.ok) return;
              const cache = await caches.open(STATIC_CACHE);
              await cache.put('/', resp.clone());
            })
            .catch(() => {})
        );

        return toUrlAgnosticResponse(cachedShell);
      }

      try {
        const resp = await fetch('/');
        if (resp && resp.ok) {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put('/', resp.clone());
        }
        // Mesmo vindo da rede, devolvemos uma resposta "sem URL".
        return toUrlAgnosticResponse(resp);
      } catch {
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Assets estáticos - Cache First com stale-while-revalidate
  if (CACHEABLE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Atualiza cache em background (stale-while-revalidate)
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {});
          return cached;
        }

        // Não está em cache, busca da rede
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'GestBarber',
    body: 'Você tem uma nova notificação',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: notificationData.data,
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' },
    ],
    tag: 'gestbarber-notification',
    renotify: true,
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  if (event.action === 'close') return;

  const appointmentId = event.notification.data?.appointmentId;
  const url = appointmentId ? `/agenda?appointment=${appointmentId}` : '/agenda';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem uma janela aberta, foca nela
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Senão, abre uma nova
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync para offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-appointments') {
    console.log('[SW] Syncing appointments...');
  }
});

console.log('[SW] Service Worker loaded - v4 Navigation Lock');
