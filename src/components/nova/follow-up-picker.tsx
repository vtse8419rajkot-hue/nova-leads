"use client"

/**
 * FollowUpField - HelloLeads-style follow-up date & time picker that ALWAYS
 * works on phones. The native `datetime-local` input alone is unreliable on
 * Android (segments focus but the picker often never opens - user reported).
 *
 * Tapping the field opens a bottom-sheet with:
 *  1. Quick picks (Today evening / Tomorrow morning ...)
 *  2. A 14-day strip (Today, Tomorrow, Tue 22 ...)
 *  3. A 30-minute time grid
 *  4. A "Custom" native datetime-local input that explicitly calls
 *     showPicker() inside the user gesture (reliable picker opener)
 *
 * Value format: local "YYYY-MM-DDTHH:mm" (same as datetime-local inputs).
 */

import React, { useMemo, useState } from "react"
import { CalendarDays, Clock, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"

const pad = (n: number) => String(n).padStart(2, "0")

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function toLocalInputValue(d: Date): string {
  return `${dateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "2026-10-22T17:30" -> "Thu, 22 Oct 2026, 5:30 pm" */
export function prettyFollowUp(value: string): string {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

interface DayOption {
  key: string
  label: string
  sub: string
  date: Date
}

function buildDays(t: (k: string) => string): DayOption[] {
  const out: DayOption[] = []
  const now = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    let label: string
    if (i === 0) label = t("common.today")
    else if (i === 1) label = t("common.tomorrow")
    else label = d.toLocaleDateString("en-IN", { weekday: "short" })
    out.push({
      key: dateKey(d),
      label,
      sub: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      date: d,
    })
  }
  return out
}

const TIME_SLOTS: string[] = []
for (let h = 7; h <= 21; h++) {
  TIME_SLOTS.push(`${pad(h)}:00`)
  TIME_SLOTS.push(`${pad(h)}:30`)
}

interface QuickPick {
  label: string
  value: string
}

function buildQuickPicks(t: (k: string) => string): QuickPick[] {
  const now = new Date()
  const picks: QuickPick[] = []
  const at = (dayOffset: number, hour: number, minute = 0) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, minute)
    return toLocalInputValue(d)
  }
  const labelFor = (v: string) => {
    const d = new Date(v)
    const day = d.toLocaleDateString("en-IN", { weekday: "short" })
    const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    return `${day}, ${time}`
  }
  // Today 6 pm only if still in the future
  if (new Date(at(0, 18)).getTime() > now.getTime()) {
    picks.push({ label: labelFor(at(0, 18)), value: at(0, 18) })
  }
  picks.push({ label: labelFor(at(1, 10)), value: at(1, 10) })
  picks.push({ label: labelFor(at(1, 17)), value: at(1, 17) })
  picks.push({ label: labelFor(at(2, 11)), value: at(2, 11) })
  return picks
}

export function FollowUpField({
  value,
  onChange,
  placeholder,
  clearable = true,
  id,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  clearable?: boolean
  id?: string
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [day, setDay] = useState<string>("")
  const [time, setTime] = useState<string>("")

  const days = useMemo(() => buildDays(t), [t])
  const quickPicks = useMemo(() => buildQuickPicks(t), [t])

  const openSheet = () => {
    if (value && value.includes("T")) {
      setDay(value.slice(0, 10))
      setTime(value.slice(11, 16))
    } else {
      const now = new Date()
      // default: today's day chip, no time selected yet
      setDay(dateKey(now))
      setTime("")
    }
    setOpen(true)
  }

  const apply = (d: string, tm: string) => {
    if (d && tm) onChange(`${d}T${tm}`)
  }

  const pickDay = (key: string) => {
    setDay(key)
    if (time) apply(key, time)
  }
  const pickTime = (tm: string) => {
    setTime(tm)
    if (day) apply(day, tm)
  }

  const label = prettyFollowUp(value)

  return (
    <>
      <button
        type="button"
        id={id}
        onClick={openSheet}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-start text-sm shadow-xs outline-none transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        )}
        aria-label={placeholder || t("leads.nextFollowUp")}
      >
        <span className={cn("truncate", !label && "text-muted-foreground")}>
          {label || placeholder || t("leads.nextFollowUp")}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {label && clearable && (
            <span
              role="button"
              tabIndex={0}
              aria-label={t("common.clear")}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  onChange("")
                }
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90dvh] flex-col p-0 sm:max-w-md" style={{}}>
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="text-base">{t("leads.nextFollowUp")}</DialogTitle>
          </DialogHeader>

          <div className="nova-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {/* Quick picks */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("fu.quick")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickPicks.map((q) => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => {
                      onChange(q.value)
                      setOpen(false)
                    }}
                    className="rounded-xl border p-2.5 text-start text-xs font-semibold transition-all active:scale-[0.97] hover:border-primary/50"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day strip */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("fu.pickDate")}
              </p>
              <div className="nova-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5">
                {days.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => pickDay(d.key)}
                    className={cn(
                      "flex w-[4.25rem] shrink-0 flex-col items-center rounded-xl border py-2 text-xs transition-all active:scale-[0.97]",
                      day === d.key ? "border-primary bg-primary/10 text-primary" : "bg-card hover:border-primary/40"
                    )}
                  >
                    <span className="font-semibold">{d.label}</span>
                    <span className="text-[10px] text-muted-foreground">{d.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time grid */}
            <div>
              <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3 w-3" /> {t("fu.pickTime")}
              </p>
              <div className="nova-scroll grid max-h-48 grid-cols-4 gap-1.5 overflow-y-auto pr-0.5">
                {TIME_SLOTS.map((tm) => {
                  const hh = Number(tm.slice(0, 2))
                  const h12 = hh % 12 === 0 ? 12 : hh % 12
                  const ampm = hh < 12 ? "am" : "pm"
                  return (
                    <button
                      key={tm}
                      type="button"
                      onClick={() => pickTime(tm)}
                      className={cn(
                        "rounded-lg border py-1.5 text-[11px] font-semibold transition-all active:scale-[0.95]",
                        time === tm ? "border-primary bg-primary/10 text-primary" : "bg-card hover:border-primary/40"
                      )}
                    >
                      {h12}:{tm.slice(3)} {ampm}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom native picker */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("fu.custom")}
              </p>
              <input
                type="datetime-local"
                value={day && time ? `${day}T${time}` : ""}
                onChange={(e) => {
                  const v = e.target.value
                  if (v && v.includes("T")) {
                    setDay(v.slice(0, 10))
                    setTime(v.slice(11, 16))
                    onChange(v)
                  }
                }}
                onClick={(e) => {
                  // Explicitly open the native picker inside the user gesture -
                  // many Android browsers don't open it on plain tap.
                  try {
                    const el = e.currentTarget
                    if (typeof el.showPicker === "function") el.showPicker()
                  } catch {
                    /* not supported - user can still type segments */
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 border-t px-4 py-3 pb-safe">
            {clearable && value && (
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                {t("common.clear")}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
              onClick={() => setOpen(false)}
            >
              {t("common.done")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
