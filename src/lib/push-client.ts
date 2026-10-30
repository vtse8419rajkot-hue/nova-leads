"use client"

/**
 * Client-side Web Push helpers (background follow-up reminders).
 *
 * Subscribes the service worker to push notifications and uploads the
 * subscription to the server, so the server cron can remind the user at
 * follow-up time even when the PWA is fully closed (home screen).
 */

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

/**
 * Ensure a push subscription exists and is registered with the server.
 * Safe to call repeatedly (idempotent). Returns true when subscribed.
 */
export async function ensurePushSubscription(leadMinutes = 0): Promise<boolean> {
  try {
    if (!pushSupported() || Notification.permission !== "granted") return false
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()

    if (!sub) {
      const res = await fetch("/api/push/public-key")
      if (!res.ok) return false
      const { publicKey } = (await res.json()) as { publicKey: string | null }
      if (!publicKey) return false
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })
    }

    const json = sub.toJSON() as { endpoint: string; keys?: { p256dh?: string; auth?: string } }
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, leadMinutes }),
    })
    return true
  } catch {
    return false
  }
}

/** Ask the server to send a test push to all of this account's devices. */
export async function sendTestPush(): Promise<{ ok: boolean; sent: number }> {
  try {
    const res = await fetch("/api/reminders/test-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
    if (!res.ok) return { ok: false, sent: 0 }
    const data = (await res.json()) as { sent?: number }
    return { ok: true, sent: data.sent || 0 }
  } catch {
    return { ok: false, sent: 0 }
  }
}
