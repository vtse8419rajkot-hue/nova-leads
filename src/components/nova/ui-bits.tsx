"use client"

import React from "react"
import { useI18n } from "@/i18n"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "./api"
import { cn } from "@/lib/utils"

export const STATUS_COLORS: Record<string, string> = {
  new: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900",
  contacted: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  in_progress: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-900",
  quotation: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-900",
  negotiation: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
  won: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  lost: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900",
}

export const PRIORITY_COLORS: Record<string, string> = {
  hot: "bg-red-500 text-white border-red-500",
  warm: "bg-amber-500 text-white border-amber-500",
  cold: "bg-sky-400 text-white border-sky-400",
}

export const STATUS_DOT: Record<string, string> = {
  new: "bg-sky-500",
  contacted: "bg-amber-500",
  in_progress: "bg-violet-500",
  quotation: "bg-cyan-500",
  negotiation: "bg-orange-500",
  won: "bg-emerald-500",
  lost: "bg-rose-500",
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { t } = useI18n()
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", STATUS_COLORS[status] || "", className)}>
      {t(`status.${status}`)}
    </Badge>
  )
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const { t } = useI18n()
  if (!priority) return null
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", PRIORITY_COLORS[priority] || "", className)}>
      {t(`priority.${priority}`)}
    </Badge>
  )
}

export function Money({ value, className }: { value: number; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatMoney(value)}</span>
}

export function Avatar({ name, color, className }: { name: string; color?: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
        className
      )}
      style={{ backgroundColor: color || "#10b981" }}
      aria-label={name}
    >
      {initials}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-muted-foreground">{children}</h2>
      {action}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="mb-1 text-base font-semibold">{title}</p>
      <p className="mb-5 max-w-xs text-sm text-muted-foreground">{desc}</p>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon,
  tone = "default",
  onClick,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  tone?: "default" | "green" | "amber" | "rose" | "sky"
  onClick?: () => void
}) {
  const tones: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    sky: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card p-3 text-start shadow-sm transition-all active:scale-[0.97]",
        onClick ? "cursor-pointer hover:border-primary/40" : "cursor-default"
      )}
    >
      <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-lg", tones[tone])}>{icon}</div>
      <div className="text-lg font-bold leading-tight tabular-nums">{value}</div>
      <div className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{label}</div>
    </button>
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
