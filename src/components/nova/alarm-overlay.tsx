"use client"

import React, { useState } from "react"
import { useI18n } from "@/i18n"
import { useAlarm, type ActiveAlarm } from "@/hooks/use-alarm-engine"
import { formatMoney, dateTimeLabel } from "./api"
import { cn } from "@/lib/utils"
import {
  BellRing, Phone, MessageCircle, Clock, CheckCheck, X, User,
  Building2, MapPin, IndianRupee, Star, FileText, StickyNote, Tag,
  UserRound, Calendar, ClipboardList, ChevronDown, Eye,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className="mt-0.5 text-emerald-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-200/60">{label}</p>
        <div className="break-words text-sm font-medium text-white">{children}</div>
      </div>
    </div>
  )
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {children}
    </span>
  )
}

const STATUS_COLORS: Record<string, string> = {
  new: "#f59e0b",
  contacted: "#8b5cf6",
  in_progress: "#06b6d4",
  quotation: "#ec4899",
  negotiation: "#f97316",
  won: "#10b981",
  lost: "#ef4444",
}
const PRIORITY_COLORS: Record<string, string> = { hot: "#ef4444", warm: "#f59e0b", cold: "#64748b" }

const SNOOZE_OPTIONS = [5, 10, 30, 60]

export function AlarmOverlay() {
  const { t } = useI18n()
  const { active, stopAlarm, snoozeAlarm, completeAlarm } = useAlarm()
  const [busy, setBusy] = useState(false)

  if (!active) return null
  const alarm: ActiveAlarm = active
  const lead = alarm.lead
  const isTask = alarm.kind === "task"

  const snooze = async (m: number) => {
    setBusy(true)
    try {
      await snoozeAlarm(m)
    } finally {
      setBusy(false)
    }
  }
  const done = async () => {
    setBusy(true)
    try {
      await completeAlarm()
    } finally {
      setBusy(false)
    }
  }

  const telHref = lead?.phone ? `tel:${lead.phone.replace(/[^\d+]/g, "")}` : "#"
  const waHref = lead?.phone
    ? `https://wa.me/${lead.phone.replace(/[^\d]/g, "")}`
    : "#"

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-gradient-to-b from-emerald-950 via-zinc-950 to-black"
      role="alertdialog"
      aria-modal="true"
      aria-label={t("alarm.ringTitle")}
    >
      {/* subtle animated glow rings */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl nova-alarm-glow" />
      </div>

      {/* header */}
      <div className="relative flex items-center justify-between px-5 pt-safe">
        <div className="flex items-center gap-2 pt-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-base">⏰</div>
          <span className="text-xs font-semibold text-emerald-300/80">{t("app.name")}</span>
        </div>
        <button
          onClick={stopAlarm}
          className="mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20"
          aria-label={t("alarm.stop")}
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* ringing title with pulsing bell */}
      <div className="relative flex flex-col items-center px-5 pt-5">
        <div className="relative mb-3">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
          <span className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/40 blur-md" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-xl shadow-emerald-900/50">
            <BellRing className="h-10 w-10 animate-bounce text-white" style={{ animationDuration: "0.9s" }} />
          </div>
        </div>
        <h2 className="text-center text-lg font-bold uppercase tracking-widest text-emerald-400">
          {isTask ? t("alarm.taskDue") : t("alarm.ringTitle")}
        </h2>
        <p className="mt-0.5 text-xs text-white/50">{dateTimeLabel(alarm.dueAt)}</p>

        {/* big name */}
        <h1 className="mt-3 text-center text-3xl font-black leading-tight text-white">
          {isTask ? alarm.title : lead?.name}
        </h1>
        {isTask && alarm.taskType && (
          <p className="mt-1 text-sm font-medium text-emerald-300">
            {t(`tasks.${alarm.taskType}`) || alarm.taskType}
          </p>
        )}
        {!isTask && (lead?.company || lead?.city) && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
            {lead?.company && (
              <>
                <Building2 className="h-3.5 w-3.5" /> {lead.company}
              </>
            )}
            {lead?.company && lead?.city && <span className="text-white/30">·</span>}
            {lead?.city && (
              <>
                <MapPin className="h-3.5 w-3.5" /> {lead.city}
              </>
            )}
          </p>
        )}
      </div>

      {/* full details scroll area */}
      <div className="nova-scroll relative mx-4 mt-4 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
        {lead ? (
          <>
            <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300/80">
              <User className="h-3.5 w-3.5" /> {t("alarm.details")}
            </p>

            {/* contact action row */}
            <div className="mb-3 grid grid-cols-2 gap-2">
              <a
                href={telHref}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition-transform active:scale-95"
              >
                <Phone className="h-4 w-4" /> {lead.phone}
              </a>
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-95"
              >
                <MessageCircle className="h-4 w-4" /> {t("alarm.whatsapp")}
              </a>
            </div>

            {/* chips row */}
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {lead.status && <Chip color={STATUS_COLORS[lead.status] || "#10b981"}>{t(`status.${lead.status}`)}</Chip>}
              {lead.priority && (
                <Chip color={PRIORITY_COLORS[lead.priority] || "#64748b"}>
                  {lead.priority === "hot" ? "🔥" : lead.priority === "warm" ? "🌤" : "❄️"} {t(`priority.${lead.priority}`)}
                </Chip>
              )}
              {typeof lead.aiScore === "number" && (
                <Chip color="#10b981">
                  <Star className="h-3 w-3" /> AI {lead.aiScore}
                </Chip>
              )}
              {isTask && alarm.taskType && (
                <Chip color="#06b6d4">
                  <ClipboardList className="h-3 w-3" /> {t(`tasks.${alarm.taskType}`)}
                </Chip>
              )}
            </div>

            <div className="divide-y divide-white/5">
              <DetailRow icon={<Phone className="h-4 w-4" />} label={t("leads.phone")}>
                {lead.phone}
              </DetailRow>
              {lead.email && (
                <DetailRow icon={<UserRound className="h-4 w-4" />} label={t("leads.email")}>
                  {lead.email}
                </DetailRow>
              )}
              {lead.company && (
                <DetailRow icon={<Building2 className="h-4 w-4" />} label={t("leads.company")}>
                  {lead.company}
                </DetailRow>
              )}
              {(lead.city || lead.address) && (
                <DetailRow icon={<MapPin className="h-4 w-4" />} label={t("leads.city")}>
                  {[lead.address, lead.city].filter(Boolean).join(", ")}
                </DetailRow>
              )}
              {typeof lead.value === "number" && lead.value > 0 && (
                <DetailRow icon={<IndianRupee className="h-4 w-4" />} label={t("leads.value")}>
                  <span className="text-emerald-300">{formatMoney(lead.value)}</span>
                </DetailRow>
              )}
              {lead.source && (
                <DetailRow icon={<Tag className="h-4 w-4" />} label={t("leads.source") || "Source"}>
                  {t(`source.${lead.source}`) || lead.source}
                </DetailRow>
              )}
              <DetailRow icon={<Calendar className="h-4 w-4" />} label={t("alarm.dueAt")}>
                {dateTimeLabel(alarm.dueAt)}
              </DetailRow>
              {lead.assignedTo?.name && (
                <DetailRow icon={<UserRound className="h-4 w-4" />} label={t("team.title") || "Team"}>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: lead.assignedTo.avatarColor }}
                    />
                    {lead.assignedTo.name}
                  </span>
                </DetailRow>
              )}
              {lead.requirement && (
                <DetailRow icon={<FileText className="h-4 w-4" />} label={t("leads.requirement")}>
                  {lead.requirement}
                </DetailRow>
              )}
              {isTask && alarm.taskNotes && (
                <DetailRow icon={<StickyNote className="h-4 w-4" />} label={t("leads.notes")}>
                  {alarm.taskNotes}
                </DetailRow>
              )}
              {lead.notes && (
                <DetailRow icon={<StickyNote className="h-4 w-4" />} label={t("leads.notes")}>
                  {lead.notes}
                </DetailRow>
              )}
              {lead.tags && (
                <DetailRow icon={<Tag className="h-4 w-4" />} label={t("leads.tags")}>
                  <div className="flex flex-wrap gap-1">
                    {lead.tags
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <span key={tag} className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">
                          #{tag}
                        </span>
                      ))}
                  </div>
                </DetailRow>
              )}
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <ClipboardList className="mx-auto mb-2 h-10 w-10 text-emerald-400" />
            <p className="text-sm font-semibold text-white">{alarm.title}</p>
            {alarm.taskNotes && <p className="mt-1 text-xs text-white/60">{alarm.taskNotes}</p>}
          </div>
        )}
      </div>

      {/* action bar */}
      <div className="relative px-4 pb-safe">
        <div className="flex items-center justify-center gap-2.5 py-4">
          {/* Snooze */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={busy}
                className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl bg-white/10 text-white transition-all active:scale-95 disabled:opacity-50"
              >
                <Clock className="h-5 w-5" />
                <span className="text-[11px] font-semibold">{t("alarm.snooze")}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="center"
              className="z-[110] rounded-xl border-white/10 bg-zinc-900/95 backdrop-blur"
            >
              {SNOOZE_OPTIONS.map((m) => (
                <DropdownMenuItem
                  key={m}
                  onClick={() => void snooze(m)}
                  className="gap-2 rounded-lg text-white focus:bg-white/10"
                >
                  <Clock className="h-4 w-4 text-emerald-400" />
                  {m >= 60 ? `${m / 60} hr` : `${m} min`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Done */}
          <button
            onClick={() => void done()}
            disabled={busy}
            className={cn(
              "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-900/50 transition-all active:scale-95",
              busy && "opacity-50"
            )}
          >
            <CheckCheck className="h-5 w-5" />
            <span className="text-[11px] font-bold">{t("alarm.markDone")}</span>
          </button>

          {/* Open lead */}
          {alarm.leadId && (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("nova:open-lead", { detail: alarm.leadId }))
                stopAlarm()
              }}
              className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl bg-white/10 text-white transition-all active:scale-95"
            >
              <Eye className="h-5 w-5" />
              <span className="text-[11px] font-semibold">{t("alarm.viewLead")}</span>
            </button>
          )}
        </div>
        <p className="pb-3 text-center text-[10px] text-white/30">
          <ChevronDown className="mr-1 inline h-3 w-3" />
          {t("alarm.desc")}
        </p>
      </div>
    </div>
  )
}
