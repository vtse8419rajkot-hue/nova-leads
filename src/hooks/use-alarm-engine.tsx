"use client"

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { playAlarm, startVibration, unlockAudio, vibrateOnce, type StopFn } from "@/lib/alarm-sounds"
import { api } from "@/components/nova/api"
import { useI18n } from "@/i18n"

// ---------------- types ----------------

export interface AlarmLeadInfo {
  id: string
  name: string
  phone: string
  email?: string | null
  company?: string | null
  city?: string | null
  address?: string | null
  source?: string
  status?: string
  priority?: string
  value?: number
  requirement?: string | null
  notes?: string | null
  tags?: string
  aiScore?: number
  assignedTo?: { id: string; name: string; avatarColor: string } | null
}

export interface ActiveAlarm {
  kind: "lead" | "task"
  id: string // lead id or task id
  leadId: string | null // lead to open on "view lead" (null for test)
  isTest?: boolean
  title: string
  taskType?: string
  taskNotes?: string | null
  dueAt: string
  lead: AlarmLeadInfo | null
}

export interface AlarmSettings {
  soundId: string
  volume: number
  soundOn: boolean
  vibrationOn: boolean
  leadMinutes: number // 0 = exactly on time, or ring X minutes before
}

type PermissionState = "granted" | "denied" | "default" | "unsupported"

const DEFAULT_SETTINGS: AlarmSettings = {
  soundId: "dhol",
  volume: 0.9,
  soundOn: true,
  vibrationOn: true,
  leadMinutes: 0,
}

const LS_SETTINGS = "nova-alarm-settings"
const LS_FIRED = "nova-alarm-fired"
const LS_LAST_ASK = "nova-alarm-last-ask"
const REASK_AFTER_MS = 12 * 60 * 60 * 1000 // ask again 12h after "not now"

// raw API payloads
interface RawLead {
  id: string
  name: string
  phone: string
  email?: string | null
  company?: string | null
  city?: string | null
  address?: string | null
  source?: string
  status?: string
  priority?: string
  value?: number
  requirement?: string | null
  notes?: string | null
  tags?: string
  aiScore?: number
  nextFollowUpAt: string
  assignedTo?: { id: string; name: string; avatarColor: string } | null
}
interface RawTask {
  id: string
  title: string
  type: string
  status: string
  dueAt: string
  notes?: string | null
  leadId?: string | null
  lead?: RawLead | null
}

interface AlarmContextValue {
  permission: PermissionState
  settings: AlarmSettings
  saveSettings: (patch: Partial<AlarmSettings>) => void
  active: ActiveAlarm | null
  ringing: boolean
  askOpen: boolean
  requestPermission: () => Promise<boolean>
  dismissAsk: () => void
  stopAlarm: () => void
  snoozeAlarm: (minutes: number) => Promise<void>
  completeAlarm: () => Promise<void>
  testAlarm: () => void
  previewSound: (soundId: string) => StopFn
  checkNow: () => void
}

const AlarmContext = createContext<AlarmContextValue | null>(null)

export function useAlarm(): AlarmContextValue {
  const v = useContext(AlarmContext)
  if (!v) throw new Error("useAlarm must be used inside <AlarmProvider>")
  return v
}

// ---------------- provider ----------------

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported"
    return Notification.permission as PermissionState
  })
  const [settings, setSettings] = useState<AlarmSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS
    try {
      const s = localStorage.getItem(LS_SETTINGS)
      if (s) return { ...DEFAULT_SETTINGS, ...(JSON.parse(s) as Partial<AlarmSettings>) }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS
  })
  const [active, setActive] = useState<ActiveAlarm | null>(null)
  // "Not now" suppression - while false and permission is still "default", the ask dialog shows
  const [askSuppressed, setAskSuppressed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true
    try {
      return Date.now() - Number(localStorage.getItem(LS_LAST_ASK) || 0) < REASK_AFTER_MS
    } catch {
      return true
    }
  })
  const askOpen = permission === "default" && !askSuppressed

  const stopSoundRef = useRef<StopFn | null>(null)
  const stopVibRef = useRef<StopFn | null>(null)
  const firedRef = useRef<Set<string>>(new Set())
  const activeRef = useRef<ActiveAlarm | null>(null)
  const checkNowRef = useRef<(() => void) | null>(null)
  const settingsRef = useRef(settings)

  // keep latest settings / checkNow reachable from timers and listeners
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  // load previously-fired alarm keys
  useEffect(() => {
    try {
      const f = localStorage.getItem(LS_FIRED)
      if (f) firedRef.current = new Set(JSON.parse(f) as string[])
    } catch {
      // ignore
    }
  }, [])

  // unlock audio on first user gesture (so timer-driven alarms may play later)
  useEffect(() => {
    const un = () => unlockAudio()
    window.addEventListener("pointerdown", un, { once: true })
    window.addEventListener("keydown", un, { once: true })
    return () => {
      window.removeEventListener("pointerdown", un)
      window.removeEventListener("keydown", un)
    }
  }, [])

  // notification tap (app was background) -> route to the lead inside the app
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { type?: string; leadId?: string | null } | null
      if (d?.type === "ALARM_NOTIFICATION_CLICK") {
        if (d.leadId) {
          window.dispatchEvent(new CustomEvent("nova:open-lead", { detail: d.leadId }))
        } else {
          void checkNowRef.current?.()
        }
      }
    }
    navigator.serviceWorker.addEventListener("message", onMsg)
    return () => navigator.serviceWorker.removeEventListener("message", onMsg)
  }, [])

  const saveSettings = useCallback((patch: Partial<AlarmSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(LS_SETTINGS, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const markFired = useCallback((key: string) => {
    firedRef.current.add(key)
    let arr = Array.from(firedRef.current)
    if (arr.length > 300) arr = arr.slice(-300)
    firedRef.current = new Set(arr)
    try {
      localStorage.setItem(LS_FIRED, JSON.stringify(arr))
    } catch {
      // ignore
    }
  }, [])

  const alarmKey = (kind: string, id: string, dueAt: string) => `${kind}:${id}:${new Date(dueAt).getTime()}`

  const stopRinging = useCallback(() => {
    stopSoundRef.current?.()
    stopSoundRef.current = null
    stopVibRef.current?.()
    stopVibRef.current = null
  }, [])

  const showBackgroundNotification = useCallback(
    (alarm: ActiveAlarm) => {
      try {
        if (!("Notification" in window) || Notification.permission !== "granted") return
        if (!("serviceWorker" in navigator)) return
        const name = alarm.lead?.name || alarm.title
        const title = `⏰ ${t("alarm.notificationTitle").replace("{name}", name)}`
        const body = alarm.lead
          ? t("alarm.notificationBody").replace("{name}", name)
          : t("alarm.taskDue")
        navigator.serviceWorker.ready
          .then((reg) =>
            reg.showNotification(title, {
              body,
              tag: `nova-alarm-${alarm.kind}-${alarm.id}`,
              requireInteraction: true,
              vibrate: [400, 250, 400, 250, 900],
              data: { leadId: alarm.leadId },
            })
          )
          .catch(() => {})
      } catch {
        // ignore
      }
    },
    [t]
  )

  const fire = useCallback(
    (alarm: ActiveAlarm) => {
      stopRinging()
      activeRef.current = alarm
      setActive(alarm)
      markFired(alarmKey(alarm.kind, alarm.id, alarm.dueAt))
      const s = settingsRef.current
      if (s.soundOn) stopSoundRef.current = playAlarm(s.soundId, { volume: s.volume, loop: true })
      if (s.vibrationOn) stopVibRef.current = startVibration()
      if (typeof document !== "undefined" && document.hidden) {
        showBackgroundNotification(alarm)
      }
    },
    [markFired, showBackgroundNotification, stopRinging]
  )

  // ------- due check / polling -------
  const checkNow = useCallback(async () => {
    if (activeRef.current) return // already ringing
    try {
      const data = await api.get<{ leads: RawLead[]; tasks: RawTask[] }>("/api/alarms/due")
      if (activeRef.current) return
      const s = settingsRef.current
      const cutoff = Date.now() + s.leadMinutes * 60 * 1000
      const items: ActiveAlarm[] = []
      for (const l of data.leads || []) {
        const due = new Date(l.nextFollowUpAt).getTime()
        if (due <= cutoff && !firedRef.current.has(`lead:${l.id}:${due}`)) {
          items.push({
            kind: "lead",
            id: l.id,
            leadId: l.id,
            title: l.name,
            dueAt: l.nextFollowUpAt,
            lead: {
              id: l.id,
              name: l.name,
              phone: l.phone,
              email: l.email,
              company: l.company,
              city: l.city,
              address: l.address,
              source: l.source,
              status: l.status,
              priority: l.priority,
              value: l.value,
              requirement: l.requirement,
              notes: l.notes,
              tags: l.tags,
              aiScore: l.aiScore,
              assignedTo: l.assignedTo,
            },
          })
        }
      }
      for (const tk of data.tasks || []) {
        const due = new Date(tk.dueAt).getTime()
        if (due <= cutoff && !firedRef.current.has(`task:${tk.id}:${due}`)) {
          const l = tk.lead
          items.push({
            kind: "task",
            id: tk.id,
            leadId: tk.leadId || null,
            title: tk.title,
            taskType: tk.type,
            taskNotes: tk.notes,
            dueAt: tk.dueAt,
            lead: l
              ? {
                  id: l.id,
                  name: l.name,
                  phone: l.phone,
                  email: l.email,
                  company: l.company,
                  city: l.city,
                  address: l.address,
                  source: l.source,
                  status: l.status,
                  priority: l.priority,
                  value: l.value,
                  requirement: l.requirement,
                  notes: l.notes,
                  tags: l.tags,
                  aiScore: l.aiScore,
                  assignedTo: l.assignedTo,
                }
              : null,
          })
        }
      }
      items.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      if (items.length > 0) fire(items[0])
    } catch {
      // offline / server busy - try again next tick
    }
  }, [fire])

  useEffect(() => {
    checkNowRef.current = () => void checkNow()
  }, [checkNow])

  useEffect(() => {
    const iv = setInterval(() => void checkNow(), 30000)
    const onVis = () => {
      if (document.visibilityState === "visible") void checkNow()
    }
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("focus", onVis)
    // initial check shortly after mount (deferred so it runs in a timer callback)
    const t0 = setTimeout(() => void checkNow(), 600)
    return () => {
      clearInterval(iv)
      clearTimeout(t0)
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("focus", onVis)
    }
  }, [checkNow])

  // ------- permission -------
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) return false
    unlockAudio()
    let result: PermissionState = Notification.permission as PermissionState
    if (result === "default") {
      try {
        result = (await Notification.requestPermission()) as PermissionState
      } catch {
        result = "denied"
      }
    }
    setPermission(result)
    try {
      localStorage.setItem(LS_LAST_ASK, String(Date.now()))
    } catch {
      // ignore
    }
    if (result === "granted") {
      // confirm with sound + vibration so the user feels it working
      vibrateOnce([150, 80, 150])
      playAlarm("chime", { volume: 0.5, loop: false })
    }
    return result === "granted"
  }, [])

  const dismissAsk = useCallback(() => {
    setAskSuppressed(true)
    try {
      localStorage.setItem(LS_LAST_ASK, String(Date.now()))
    } catch {
      // ignore
    }
  }, [])

  // ------- alarm actions -------
  const stopAlarm = useCallback(() => {
    stopRinging()
    activeRef.current = null
    setActive(null)
  }, [stopRinging])

  const snoozeAlarm = useCallback(
    async (minutes: number) => {
      const cur = activeRef.current
      stopRinging()
      activeRef.current = null
      setActive(null)
      if (cur && !cur.isTest) {
        try {
          await api.post("/api/alarms/snooze", { kind: cur.kind, id: cur.id, minutes })
        } catch {
          // offline: local dedup still prevents re-ring for this dueAt
        }
      }
    },
    [stopRinging]
  )

  const completeAlarm = useCallback(async () => {
    const cur = activeRef.current
    stopRinging()
    activeRef.current = null
    setActive(null)
    if (cur && !cur.isTest) {
      try {
        await api.post("/api/alarms/complete", { kind: cur.kind, id: cur.id })
      } catch {
        // ignore - local dedup already set
      }
    }
  }, [stopRinging])

  const testAlarm = useCallback(() => {
    unlockAudio()
    const now = new Date()
    fire({
      kind: "lead",
      id: "test",
      leadId: null,
      isTest: true,
      title: `🧪 ${t("alarm.test")}`,
      dueAt: now.toISOString(),
      lead: {
        id: "test",
        name: `🧪 ${t("alarm.test")}`,
        phone: "+91 98765 43210",
        company: t("app.name"),
        city: "Ahmedabad",
        address: "21, Ring Road, Ahmedabad",
        source: "whatsapp",
        status: "negotiation",
        priority: "hot",
        value: 125000,
        requirement: t("alarm.desc"),
        notes: t("alarm.testDesc"),
        tags: "",
        aiScore: 85,
        assignedTo: { id: "test", name: t("app.name"), avatarColor: "#10b981" },
      },
    })
    void s
  }, [fire, t])

  const previewSound = useCallback((soundId: string): StopFn => {
    unlockAudio()
    return playAlarm(soundId, { volume: settingsRef.current.volume, loop: false })
  }, [])

  // stop everything if page unloads while ringing
  useEffect(() => {
    return () => {
      stopRinging()
    }
  }, [stopRinging])

  const value: AlarmContextValue = {
    permission,
    settings,
    saveSettings,
    active,
    ringing: !!active,
    askOpen,
    requestPermission,
    dismissAsk,
    stopAlarm,
    snoozeAlarm,
    completeAlarm,
    testAlarm,
    previewSound,
    checkNow: () => void checkNow(),
  }

  return <AlarmContext.Provider value={value}>{children}</AlarmContext.Provider>
}
