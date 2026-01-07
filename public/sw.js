// Service Worker for GestBarber PWA - v3 with Update Notifications
const SW_VERSION = '3.0.0';
const CACHE_NAME = 'gestbarber-v3';
const STATIC_CACHE = 'gestbarber-static-v3';
const DYNAMIC_CACHE = 'gestbarber-dynamic-v3';

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
// NÃO chama skipWaiting automaticamente para permitir que o usuário controle quando atualizar
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new version:', SW_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      // Não chama self.skipWaiting() aqui - deixa o usuário decidir quando atualizar
  );
});

// Ativação - limpa caches antigos e notifica clientes
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new version:', SW_VERSION);
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
      .then(() => {
        // Notifica todos os clientes sobre a atualização
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: SW_VERSION
            });
          });
        });
      })
  );
});

// Escuta mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
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

  // Navegação - Network First com fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a resposta de navegação
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback para cache
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Assets estáticos - Cache First com stale-while-revalidate
  if (CACHEABLE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Atualiza cache em background (stale-while-revalidate)
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, response);
              });
            }
          }).catch(() => {});
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

console.log('[SW] Service Worker loaded - v3 with Update Notifications');
