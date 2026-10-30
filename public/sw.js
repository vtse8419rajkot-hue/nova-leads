// Nova Leads Service Worker - offline-first PWA
// v4: background follow-up reminders via Web Push (works when app is closed)
const CACHE_NAME = "nova-leads-v4"
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

// ---------------- Web Push (background reminders) ----------------

function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

// Push received at follow-up time (server cron) -> show system notification.
// Skipped when the app window is visible - the in-app full-screen alarm rings.
self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: "\u23f0 Nova Leads", body: event.data ? event.data.text() : "" }
  }
  const title = data.title || "\u23f0 Nova Leads"
  const options = {
    body: data.body || "",
    tag: data.tag || "nova-push",
    requireInteraction: true,
    vibrate: [400, 250, 400, 250, 900],
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { leadId: data.leadId || null },
  }
  event.waitUntil(
    (async () => {
      try {
        const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
        if (clientList.some((c) => c.visibilityState === "visible")) return
      } catch {
        // if client check fails, still show the notification
      }
      await self.registration.showNotification(title, options)
    })()
  )
})

// Browser rotated the push subscription -> re-subscribe and re-upload
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const res = await fetch("/api/push/public-key")
        if (!res.ok) return
        const { publicKey } = await res.json()
        if (!publicKey) return
        const sub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(publicKey),
        })
        const json = sub.toJSON()
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
        })
      } catch {
        // best effort - next app open will re-subscribe anyway
      }
    })()
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

  // Page navigations: network-first (fallback to cached page when offline)
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("/")))
    )
    return
  }

  // Immutable build assets: cache-first (hashed file names)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy))
        return res
      }))
    )
    return
  }

  // Other static assets: stale-while-revalidate
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
