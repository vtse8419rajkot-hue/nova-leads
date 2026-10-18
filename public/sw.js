// Nova Leads Service Worker - offline-first PWA
const CACHE_NAME = "nova-leads-v2"
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
]

// API GET responses cached for offline read
const API_CACHE = "nova-leads-api-v1"
const CACHEABLE_API = ["/api/dashboard", "/api/leads", "/api/tasks", "/api/contacts", "/api/team", "/api/quotes", "/api/products", "/api/reports", "/api/settings"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Alarm reminder notification tap -> focus app and open the lead
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const data = (event.notification && event.notification.data) || {}
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      for (const client of clientList) {
        client.postMessage({ type: "ALARM_NOTIFICATION_CLICK", leadId: data.leadId || null })
        return client.focus()
      }
      const url = data.leadId ? "/?tab=leads&lead=" + encodeURIComponent(data.leadId) : "/"
      return self.clients.openWindow(url)
    })()
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // API requests: network-first, fallback to cache (offline read)
  if (url.pathname.startsWith("/api/")) {
    const cacheable = CACHEABLE_API.some((p) => url.pathname === p || url.pathname.startsWith(p + "?"))
    if (!cacheable) return
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(API_CACHE).then((cache) => cache.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then((cached) => cached || Response.error()))
    )
    return
  }

  // i18n dictionaries: cache-first
  if (url.pathname.startsWith("/i18n/")) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy))
        return res
      }))
    )
    return
  }

  // Static assets & pages: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy))
          return res
        })
        .catch(() => cached)
      return cached || fetchPromise
    })
  )
})
