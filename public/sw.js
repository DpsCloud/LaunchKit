/// <reference lib="webworker" />

/** @type {ServiceWorkerGlobalScope} */
const swSelf = self;

swSelf.addEventListener('install', () => {
  swSelf.skipWaiting();
});

swSelf.addEventListener('activate', (e) => {
  e.waitUntil(swSelf.clients.claim());
});

swSelf.addEventListener('push', (e) => {
  if (!e.data) return;
  
  try {
    const data = e.data.json();

    e.waitUntil(
      swSelf.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { actionUrl: data.actionUrl },
        tag: data.tag,
      })
    );
  } catch (err) {
    console.error('Error in push event:', err);
  }
});

swSelf.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.actionUrl ?? '/';

  e.waitUntil(
    swSelf.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return swSelf.clients.openWindow(url);
      })
  );
});
