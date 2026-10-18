"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useI18n } from "@/i18n"
import { api, formatMoney, type ReportData } from "./api"
import { Avatar } from "./ui-bits"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie, Legend,
} from "recharts"
import { TrendingUp, Trophy, Wallet, IndianRupee, FileText, Loader2 } from "lucide-react"

const PIE_COLORS = ["#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#ec4899", "#84cc16", "#f97316", "#14b8a6", "#6366f1"]

export function ReportsView({ refreshKey }: { refreshKey: number }) {
  const { t } = useI18n()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.get<ReportData>("/api/reports")
      setData(d)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  if (loading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const sourceData = Object.entries(data.bySource).map(([k, v]) => ({ name: t(`source.${k}`), value: v }))
  const statusData = Object.entries(data.byStatus).map(([k, v]) => ({ name: t(`status.${k}`), value: v }))
  const maxTeam = Math.max(1, ...data.teamPerformance.map((m) => m.total))

  return (
    <div className="space-y-5 nova-anim">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border bg-card p-4">
          <Wallet className="mb-2 h-5 w-5 text-emerald-600" />
          <p className="text-lg font-bold tabular-nums">{formatMoney(data.totalRevenue)}</p>
          <p className="text-[11px] text-muted-foreground">{t("reports.totalRevenue")}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <TrendingUp className="mb-2 h-5 w-5 text-primary" />
          <p className="text-lg font-bold tabular-nums">{data.conversionRate}%</p>
          <p className="text-[11px] text-muted-foreground">{t("reports.conversionRate")}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <IndianRupee className="mb-2 h-5 w-5 text-amber-600" />
          <p className="text-lg font-bold tabular-nums">{formatMoney(data.avgDealSize)}</p>
          <p className="text-[11px] text-muted-foreground">{t("reports.avgDealSize")}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <FileText className="mb-2 h-5 w-5 text-sky-600" />
          <p className="text-lg font-bold tabular-nums">{formatMoney(data.quotationsValue)}</p>
          <p className="text-[11px] text-muted-foreground">{t("reports.quotationsValue")}</p>
        </div>
      </div>

      {/* Monthly trend */}
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">{t("reports.monthlyTrend")}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.monthly} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={26} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }}
              cursor={{ fill: "rgba(16,185,129,0.06)" }}
            />
            <Bar dataKey="count" name={t("leads.title")} radius={[6, 6, 0, 0]}>
              {data.monthly.map((_, i) => (
                <Cell key={i} fill="#10b981" />
              ))}
            </Bar>
            <Bar dataKey="won" name={t("status.won")} radius={[6, 6, 0, 0]}>
              {data.monthly.map((_, i) => (
                <Cell key={i} fill="#f59e0b" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> {t("leads.title")}</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> {t("status.won")}</span>
        </div>
      </section>

      {/* Leads by source */}
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">{t("reports.leadsBySource")}</h3>
        {sourceData.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">{t("common.noData")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {sourceData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Leads by status */}
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">{t("reports.leadsByStatus")}</h3>
        {statusData.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">{t("common.noData")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} cursor={{ fill: "rgba(16,185,129,0.06)" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Team performance */}
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">{t("reports.teamPerformance")}</h3>
        {data.teamPerformance.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">{t("common.noData")}</p>
        ) : (
          <div className="space-y-3.5">
            {data.teamPerformance.map((m) => (
              <div key={m.id}>
                <div className="mb-1.5 flex items-center gap-2.5">
                  <Avatar name={m.name} color={m.avatarColor} className="h-7 w-7 text-[9px]" />
                  <span className="flex-1 truncate text-xs font-medium">{m.name}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    <Trophy className="me-0.5 inline h-3 w-3 text-amber-500" />
                    {m.won}/{m.total} · {formatMoney(m.wonValue)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-emerald-500" style={{ width: `${(m.won / maxTeam) * 100}%` }} />
                  </div>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-sky-500" style={{ width: `${(m.open / maxTeam) * 100}%` }} />
                  </div>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-rose-400" style={{ width: `${(m.lost / maxTeam) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
