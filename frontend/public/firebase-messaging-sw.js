/* eslint-disable no-undef */

// Keep this file crash-safe: service worker registration must not fail.
// If firebase import is blocked in any environment, we still keep SW active.
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');
} catch (e) {
  console.warn('[FCM SW] importScripts failed', e);
}

function initMessaging() {
  try {
    if (typeof firebase === 'undefined') {
      console.warn('[FCM SW] firebase global missing');
      return null;
    }

    // Public web config only (safe in client/SW).
    firebase.initializeApp({
      apiKey: 'AIzaSyDxCOcXlbgY9rQQj_GBNy1kQevFBHVQFTo',
      authDomain: 'assetforu1.firebaseapp.com',
      projectId: 'assetforu1',
      storageBucket: 'assetforu1.firebasestorage.app',
      messagingSenderId: '254384892016',
      appId: '1:254384892016:web:d358be8f3732b834966cb5',
      measurementId: 'G-9EE2VEZ6B8',
    });

    return firebase.messaging();
  } catch (error) {
    console.error('[FCM SW] initialization error', error);
    return null;
  }
}

var messaging = initMessaging();
if (messaging) {
  messaging.onBackgroundMessage(function (payload) {
    var notification = (payload && payload.notification) || {};
    var title = notification.title || 'Notification';
    var body = notification.body || '';
    var data = (payload && payload.data) || {};
    var link = data.link || '';
    var options = {
      body: body,
      icon: '/favicon.ico',
      data: data,
    };
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (allClients) {
        allClients.forEach(function (client) {
          client.postMessage({
            type: 'AF_FCM_NOTIFICATION',
            payload: {
              title: title,
              body: body,
              link: link,
              createdAt: new Date().toISOString(),
            },
          });
        });
      })
      .catch(function () {});
    self.registration.showNotification(title, options);
  });
}

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var data = event.notification && event.notification.data ? event.notification.data : {};
  var url = data.link || data.href;
  if (!url) return;
  event.waitUntil(
    (async function () {
      var allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      var same = allClients.find(function (c) {
        return c.url === url;
      });
      if (same) return same.focus();
      return clients.openWindow(url);
    })()
  );
});
