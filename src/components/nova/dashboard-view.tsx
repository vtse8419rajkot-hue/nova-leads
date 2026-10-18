"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useI18n } from "@/i18n"
import { api, formatMoney, relTime, type DashboardStats, type TeamMember } from "./api"
import { StatCard, StatusBadge, EmptyState, SectionTitle } from "./ui-bits"
import { Button } from "@/components/ui/button"
import {
  Users, Flame, Trophy, Wallet, CalendarClock, IndianRupee, TrendingUp,
  Plus, ClipboardList, FileText, AlarmClock, Loader2, ChevronRight,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { STATUS_DOT } from "./ui-bits"
import { useI18n as useI18nHook } from "@/i18n"

export function DashboardView({
  members,
  onOpenLead,
  onGoTo,
  onAddLead,
  refreshKey,
}: {
  members: TeamMember[]
  onOpenLead: (id: string) => void
  onGoTo: (tab: string) => void
  onAddLead: () => void
  refreshKey: number
}) {
  const { t, lang } = useI18n()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<DashboardStats>("/api/dashboard")
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const pipelineData = Object.entries(stats.pipeline)
    .filter(([status]) => !["won", "lost"].includes(status))
    .map(([status, v]) => ({ status, count: v.count, value: v.value }))
  const maxCount = Math.max(1, ...pipelineData.map((p) => p.count))

  const statusLabels: Record<string, string> = {}
  for (const [status] of Object.entries(stats.pipeline)) {
    statusLabels[status] = t(`status.${status}`)
  }

  return (
    <div className="space-y-5 nova-anim">
      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2.5">
        <Button className="h-auto flex-col gap-1 py-3" onClick={onAddLead}>
          <Plus className="h-5 w-5" />
          <span className="text-[11px] font-medium">{t("dashboard.addLead")}</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1 py-3" onClick={() => onGoTo("tasks")}>
          <ClipboardList className="h-5 w-5 text-primary" />
          <span className="text-[11px] font-medium">{t("dashboard.addTask")}</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1 py-3" onClick={() => onGoTo("quotes")}>
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-[11px] font-medium">{t("dashboard.newQuote")}</span>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard label={t("dashboard.totalLeads")} value={stats.totalLeads} tone="default" icon={<Users className="h-4 w-4" />} onClick={() => onGoTo("leads")} />
        <StatCard label={t("dashboard.hotLeads")} value={stats.hotLeads} tone="rose" icon={<Flame className="h-4 w-4" />} onClick={() => onGoTo("leads")} />
        <StatCard label={t("dashboard.followUpsToday")} value={stats.followUpsToday} tone="amber" icon={<CalendarClock className="h-4 w-4" />} onClick={() => onGoTo("tasks")} />
        <StatCard label={t("dashboard.wonDeals")} value={stats.wonLeads} tone="green" icon={<Trophy className="h-4 w-4" />} onClick={() => onGoTo("pipeline")} />
        <StatCard label={t("dashboard.pipelineValue")} value={formatMoney(stats.pipelineValue)} tone="sky" icon={<TrendingUp className="h-4 w-4" />} onClick={() => onGoTo("pipeline")} />
        <StatCard label={t("dashboard.revenue")} value={formatMoney(stats.revenueWon)} tone="green" icon={<Wallet className="h-4 w-4" />} />
        <StatCard label={t("dashboard.conversionRate")} value={`${stats.conversionRate}%`} tone="default" icon={<IndianRupee className="h-4 w-4" />} onClick={() => onGoTo("reports")} />
        <StatCard label={t("dashboard.overdueTasks")} value={stats.overdueTasks} tone="rose" icon={<AlarmClock className="h-4 w-4" />} onClick={() => onGoTo("tasks")} />
      </div>

      {/* Pipeline overview */}
      <section>
        <SectionTitle action={<Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onGoTo("pipeline")}>{t("common.viewMore")} <ChevronRight className="h-3.5 w-3.5" /></Button>}>
          {t("dashboard.pipelineOverview")}
        </SectionTitle>
        <div className="rounded-xl border bg-card p-4">
          <div className="space-y-3">
            {pipelineData.map((p) => (
              <div key={p.status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[p.status]}`} />
                    {statusLabels[p.status]}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {p.count} · {formatMoney(p.value)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${STATUS_DOT[p.status]}`}
                    style={{ width: `${(p.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {pipelineData.length === 0 && (
              <p className="py-2 text-center text-xs text-muted-foreground">{t("common.noData")}</p>
            )}
          </div>
        </div>
      </section>

      {/* Recent leads */}
      <section>
        <SectionTitle action={<Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onGoTo("leads")}>{t("common.viewMore")} <ChevronRight className="h-3.5 w-3.5" /></Button>}>
          {t("dashboard.recentLeads")}
        </SectionTitle>
        {stats.recentLeads.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title={t("leads.noLeads")}
            desc={t("leads.noLeadsDesc")}
            action={<Button onClick={onAddLead}><Plus className="me-2 h-4 w-4" /> {t("leads.addLead")}</Button>}
          />
        ) : (
          <div className="space-y-2">
            {stats.recentLeads.map((l) => (
              <button
                key={l.id}
                onClick={() => onOpenLead(l.id)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border bg-card p-3 text-start shadow-sm transition-all hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {t(`source.${l.source}`)} · {relTime(l.createdAt, lang)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={l.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming follow-ups */}
      {stats.upcomingTasks.length > 0 && (
        <section>
          <SectionTitle>{t("dashboard.upcomingFollowUps")}</SectionTitle>
          <div className="space-y-2">
            {stats.upcomingTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
                <CalendarClock className="h-4 w-4 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{task.title}</p>
                  <p className="text-[10px] text-muted-foreground">{relTime(task.dueAt, lang)}</p>
                </div>
                {task.lead && (
                  <button className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-primary" onClick={() => onOpenLead(task.lead!.id)}>
                    {task.lead.name}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
