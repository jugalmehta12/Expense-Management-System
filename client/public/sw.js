// Service Worker for Progressive Web App
const CACHE_NAME = 'expense-manager-v1.0.0';
const STATIC_CACHE_NAME = 'expense-manager-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'expense-manager-dynamic-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /\/api\/auth\/me/,
  /\/api\/expenses\/categories/,
  /\/api\/users\/profile/,
  /\/api\/companies\/settings/
];

// API endpoints that should use network-first strategy
const NETWORK_FIRST_PATTERNS = [
  /\/api\/expenses\/create/,
  /\/api\/expenses\/update/,
  /\/api\/approvals\//,
  /\/api\/analytics\//
];

// ==========================================
// SERVICE WORKER EVENT LISTENERS
// ==========================================

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and pages
  event.respondWith(handleStaticRequest(request));
});

// ==========================================
// CACHING STRATEGIES
// ==========================================

// Handle API requests with different strategies
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Network-first strategy for critical API calls
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return networkFirst(request, DYNAMIC_CACHE_NAME);
  }
  
  // Cache-first strategy for less critical data
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return cacheFirst(request, DYNAMIC_CACHE_NAME);
  }
  
  // Default to network-only for other API calls
  return fetch(request);
}

// Handle static requests (HTML, CSS, JS, images)
async function handleStaticRequest(request) {
  // Cache-first for static assets
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    return cacheFirst(request, STATIC_CACHE_NAME);
  }
  
  // Network-first for HTML pages
  return networkFirst(request, DYNAMIC_CACHE_NAME);
}

// Network-first caching strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache-first caching strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    updateCacheInBackground(request, cacheName);
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Cache-first failed:', error);
    throw error;
  }
}

// Update cache in background
async function updateCacheInBackground(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
  } catch (error) {
    console.log('[SW] Background cache update failed:', error);
  }
}

// ==========================================
// BACKGROUND SYNC
// ==========================================

// Register for background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'expense-sync') {
    event.waitUntil(syncOfflineExpenses());
  }
  
  if (event.tag === 'receipt-upload') {
    event.waitUntil(syncOfflineReceipts());
  }
});

// Sync offline expenses when connection is restored
async function syncOfflineExpenses() {
  try {
    console.log('[SW] Syncing offline expenses...');
    
    // Get offline expenses from IndexedDB
    const offlineExpenses = await getOfflineExpenses();
    
    for (const expense of offlineExpenses) {
      try {
        const response = await fetch('/api/expenses/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expense.authToken
          },
          body: JSON.stringify(expense.data)
        });
        
        if (response.ok) {
          await removeOfflineExpense(expense.id);
          console.log('[SW] Offline expense synced:', expense.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync expense:', expense.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync offline receipts
async function syncOfflineReceipts() {
  try {
    console.log('[SW] Syncing offline receipts...');
    
    const offlineReceipts = await getOfflineReceipts();
    
    for (const receipt of offlineReceipts) {
      try {
        const formData = new FormData();
        formData.append('receipt', receipt.file);
        formData.append('expenseId', receipt.expenseId);
        
        const response = await fetch('/api/receipts/upload', {
          method: 'POST',
          headers: {
            'Authorization': receipt.authToken
          },
          body: formData
        });
        
        if (response.ok) {
          await removeOfflineReceipt(receipt.id);
          console.log('[SW] Offline receipt synced:', receipt.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync receipt:', receipt.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Receipt sync failed:', error);
  }
}

// ==========================================
// PUSH NOTIFICATIONS
// ==========================================

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'Expense Manager',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'default',
    data: {}
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[SW] Failed to parse notification data:', error);
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window/tab
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// IndexedDB operations (simplified - would need proper implementation)
async function getOfflineExpenses() {
  // Implementation would use IndexedDB to get offline expenses
  return [];
}

async function removeOfflineExpense(id) {
  // Implementation would remove expense from IndexedDB
  console.log('Removing offline expense:', id);
}

async function getOfflineReceipts() {
  // Implementation would use IndexedDB to get offline receipts
  return [];
}

async function removeOfflineReceipt(id) {
  // Implementation would remove receipt from IndexedDB
  console.log('Removing offline receipt:', id);
}

// ==========================================
// PERIODIC BACKGROUND SYNC
// ==========================================

// Handle periodic background sync (requires permission)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);
  
  if (event.tag === 'expense-analytics-update') {
    event.waitUntil(updateAnalyticsCache());
  }
});

// Update analytics cache periodically
async function updateAnalyticsCache() {
  try {
    console.log('[SW] Updating analytics cache...');
    
    const response = await fetch('/api/analytics/dashboard');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put('/api/analytics/dashboard', response.clone());
    }
  } catch (error) {
    console.error('[SW] Failed to update analytics cache:', error);
  }
}

// ==========================================
// MESSAGE HANDLING
// ==========================================

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    this.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION',
      version: CACHE_NAME
    });
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({
        type: 'CACHE_CLEARED',
        success: true
      });
    });
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

console.log('[SW] Service worker script loaded successfully');