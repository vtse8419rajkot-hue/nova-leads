import { db } from "@/lib/db"
import { sendWebPush, formatIst, type PushPayload } from "@/lib/push"

/**
 * Core reminder dispatcher - finds follow-ups (leads) and tasks that just
 * became due and sends a web push for each, so the user is reminded even
 * when the PWA is completely closed. Idempotent via `reminderSentFor`
 * (records which due-time already fired).
 */

const OPEN_LEAD_STATUSES = ["new", "contacted", "in_progress", "quotation", "negotiation"]

export const DEFAULT_WINDOW_MINUTES = 15
export const MAX_WINDOW_MINUTES = 1439

export interface DispatchResult {
  leads: number
  tasks: number
  sent: number
  subs: number
  windowMinutes: number
  skipped: boolean
}

export async function runDispatch(windowMinutes: number): Promise<DispatchResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)

  const dueLeads = await db.lead.findMany({
    where: {
      nextFollowUpAt: { lte: now, gte: windowStart },
      reminderSentFor: null,
      status: { in: OPEN_LEAD_STATUSES },
    },
    select: { id: true, accountId: true, name: true, value: true, requirement: true, nextFollowUpAt: true },
  })
  const dueTasks = await db.task.findMany({
    where: {
      dueAt: { lte: now, gte: windowStart },
      reminderSentFor: null,
      status: "pending",
    },
    select: {
      id: true,
      accountId: true,
      title: true,
      type: true,
      dueAt: true,
      leadId: true,
      lead: { select: { name: true } },
    },
  })

  if (dueLeads.length === 0 && dueTasks.length === 0) {
    return { leads: 0, tasks: 0, sent: 0, subs: 0, windowMinutes, skipped: true }
  }

  const subs = await db.pushSubscription.findMany()
  const goneIds: string[] = []
  let sent = 0

  const targetsFor = (accountId: string | null) =>
    subs.filter((s) => !accountId || s.accountId === accountId || s.accountId === null)

  for (const lead of dueLeads) {
    const targets = targetsFor(lead.accountId)
    let any = false
    for (const sub of targets) {
      const payload: PushPayload = {
        title: `⏰ Follow-up: ${lead.name}`,
        body: [formatIst(lead.nextFollowUpAt), lead.requirement || (lead.value > 0 ? `₹${lead.value}` : "")]
          .filter(Boolean)
          .join(" · "),
        tag: `nova-push-lead-${lead.id}`,
        kind: "lead",
        id: lead.id,
        leadId: lead.id,
      }
      const result = await sendWebPush(sub, payload)
      if (result === "sent") {
        sent++
        any = true
      }
      if (result === "gone") goneIds.push(sub.id)
    }
    if (any) {
      // Guarded update: only mark if neither the follow-up time nor the
      // sent-marker changed while we were sending (reschedule race).
      await db.lead.updateMany({
        where: { id: lead.id, nextFollowUpAt: lead.nextFollowUpAt, reminderSentFor: null },
        data: { reminderSentFor: lead.nextFollowUpAt },
      })
      await db.activity.create({
        data: {
          leadId: lead.id,
          type: "reminder",
          title: "🔔 Reminder sent",
          notes: `Push notification sent for follow-up at ${formatIst(lead.nextFollowUpAt)}`,
        },
      })
    }
  }

  for (const task of dueTasks) {
    const targets = targetsFor(task.accountId)
    let any = false
    for (const sub of targets) {
      const payload: PushPayload = {
        title: `⏰ Task due: ${task.title}`,
        body: [formatIst(task.dueAt), task.lead?.name].filter(Boolean).join(" · "),
        tag: `nova-push-task-${task.id}`,
        kind: "task",
        id: task.id,
        leadId: task.leadId,
      }
      const result = await sendWebPush(sub, payload)
      if (result === "sent") {
        sent++
        any = true
      }
      if (result === "gone") goneIds.push(sub.id)
    }
    if (any) {
      await db.task.updateMany({
        where: { id: task.id, dueAt: task.dueAt, reminderSentFor: null },
        data: { reminderSentFor: task.dueAt },
      })
    }
  }

  if (goneIds.length > 0) {
    await db.pushSubscription.deleteMany({ where: { id: { in: goneIds } } })
  }

  return { leads: dueLeads.length, tasks: dueTasks.length, sent, subs: subs.length, windowMinutes, skipped: false }
}
