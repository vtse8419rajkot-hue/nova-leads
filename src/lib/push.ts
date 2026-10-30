import webpush from "web-push"

/**
 * Web Push (VAPID) helper - background follow-up reminders.
 *
 * The dispatch job (GitHub Actions cron -> /api/reminders/dispatch) sends
 * pushes at follow-up time so the user gets reminded even when the PWA is
 * fully closed (notification shows on the home screen via the service worker).
 */

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:nova-leads@vtse.app"

export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

export interface PushPayload {
  title: string
  body: string
  tag?: string
  kind?: "lead" | "task" | "test"
  id?: string
  leadId?: string | null
  url?: string
}

export type SendResult = "sent" | "gone" | "failed"

/** Send one web push. Returns "gone" when the subscription is dead (404/410). */
export async function sendWebPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<SendResult> {
  if (!pushConfigured()) return "failed"
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!)
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 3600, urgency: "high" }
    )
    return "sent"
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) return "gone"
    console.error("web-push send failed", sub.endpoint.slice(-24), status, (err as Error)?.message)
    return "failed"
  }
}

/** Format a due time in IST for notification bodies. */
export function formatIst(d: Date): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d)
  } catch {
    return d.toISOString()
  }
}
