class PushNotificationManager {
    constructor() {
      this.publicVapidKey = null;
    }
  
    async initialize() {
      // Fetch VAPID public key
      try {
        const response = await fetch('/api/push/vapid-public-key');
        const { publicKey } = await response.json();
        this.publicVapidKey = publicKey;
  
        // Check if service workers are supported
        if ('serviceWorker' in navigator) {
          await this.registerServiceWorker();
        }
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    }
  
    async registerServiceWorker() {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        await this.subscribeUser(registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  
    async subscribeUser(registration) {
      try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
  
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey)
        });
  
        // Send subscription to backend
        await fetch('/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(subscription),
          headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Assumes you store token in localStorage
          }
        });
      } catch (error) {
        console.error('Failed to subscribe:', error);
      }
    }

    async testPushNotification() {
        fetch('/api/push/test-notification', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          console.log('Test notification response:', data);
          alert(data.message);
        })
        .catch(error => {
          console.error('Test notification error:', error);
          alert('Failed to send test notification');
        });
      }

      async manualTriggerExpiryNotifications() {
        try {
          const response = await fetch('/api/push/trigger-expiry-notifications', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
  
          const data = await response.json();
          console.log('Expiry notifications trigger response:', data);
          return data;
        } catch (error) {
          console.error('Failed to trigger expiry notifications:', error);
          throw error;
        }
      }

      
      
  
    // Utility method to convert VAPID key
    urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
  
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
  
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
  }
  
  // Initialize push notifications when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    const pushManager = new PushNotificationManager();
    pushManager.initialize();
  });