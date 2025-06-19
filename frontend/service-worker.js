self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener('push', (event) => {
    const data = event.data.json();
    const title = data.title;
    const options = {
      body: data.body,
      icon: data.icon || '/images/grocery-icon.png',
      badge: '/images/grocery-badge.png'
    };
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // Open or focus the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no matching window, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow('/home.html');
        }
      })
    );
  });