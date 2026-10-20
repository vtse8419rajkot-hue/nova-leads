"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useI18n } from "@/i18n"
import { toast } from "@/hooks/use-toast"
import { api, LEAD_STATUSES, SOURCES, PRIORITIES, relTime, type Lead, type TeamMember } from "./api"
import { useWhatsApp } from "./whatsapp-send"
import { StatusBadge, PriorityBadge, Avatar, EmptyState } from "./ui-bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search, Plus, Phone, MessageCircle, CalendarClock, Inbox, Loader2, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function LeadsView({
  members,
  onOpenLead,
  onAddLead,
  refreshKey,
}: {
  members: TeamMember[]
  onOpenLead: (id: string) => void
  onAddLead: () => void
  refreshKey: number
}) {
  const { t, lang } = useI18n()
  const wa = useWhatsApp()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [source, setSource] = useState("all")
  const [priority, setPriority] = useState("all")
  const [fav, setFav] = useState("all")
  const [sort, setSort] = useState("newest")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Lead[]>("/api/leads")
      setLeads(data)
    } catch {
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const filtered = useMemo(() => {
    let out = [...leads]
    const q = search.trim().toLowerCase()
    if (q) {
      out = out.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          (l.company || "").toLowerCase().includes(q) ||
          (l.city || "").toLowerCase().includes(q)
      )
    }
    if (status !== "all") out = out.filter((l) => l.status === status)
    if (source !== "all") out = out.filter((l) => l.source === source)
    if (priority !== "all") out = out.filter((l) => l.priority === priority)
    if (fav === "fav") out = out.filter((l) => l.favorite)
    if (sort === "oldest") out.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    else if (sort === "value") out.sort((a, b) => b.value - a.value)
    else out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    return out
  }, [leads, search, status, source, priority, fav, sort])

  async function toggleFavorite(l: Lead) {
    // optimistic update
    setLeads((prev) => prev.map((x) => (x.id === l.id ? { ...x, favorite: !x.favorite } : x)))
    try {
      await api.patch(`/api/leads/${l.id}`, { favorite: !l.favorite })
    } catch {
      setLeads((prev) => prev.map((x) => (x.id === l.id ? { ...x, favorite: l.favorite } : x)))
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  const isFollowUpOverdue = (l: Lead) =>
    l.nextFollowUpAt && new Date(l.nextFollowUpAt) < new Date() && !["won", "lost"].includes(l.status)

  return (
    <div className="space-y-3">
      {/* Search + filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder={t("leads.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 nova-scroll">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-auto min-w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-8 w-auto min-w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("leads.filterBySource")}</SelectItem>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>{t(`source.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-8 w-auto min-w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("leads.filterByPriority")}</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{t(`priority.${p}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fav} onValueChange={setFav}>
            <SelectTrigger className="h-8 w-auto min-w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="fav">⭐ {t("leads.favorites")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-8 w-auto min-w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("leads.newest")}</SelectItem>
              <SelectItem value="oldest">{t("leads.oldest")}</SelectItem>
              <SelectItem value="value">{t("leads.valueHigh")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-7 w-7" />}
          title={leads.length === 0 ? t("leads.noLeads") : t("common.noData")}
          desc={leads.length === 0 ? t("leads.noLeadsDesc") : t("common.noDataDesc")}
          action={
            leads.length === 0 ? (
              <Button onClick={onAddLead}>
                <Plus className="me-2 h-4 w-4" /> {t("leads.addLead")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((l) => (
            <button
              key={l.id}
              onClick={() => onOpenLead(l.id)}
              className="block w-full rounded-xl border bg-card p-3.5 text-start shadow-sm transition-all hover:border-primary/40 active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <Avatar name={l.name} color={l.assignedTo?.avatarColor} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 truncate text-sm font-semibold">
                        {l.favorite && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                        {l.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {l.company || t(`source.${l.source}`)}{l.city ? ` · ${l.city}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {l.value > 0 ? `₹${l.value.toLocaleString("en-IN")}` : ""}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={l.favorite ? t("leads.unfavorite") : t("leads.favorite")}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                          l.favorite
                            ? "text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
                            : "text-muted-foreground/40 hover:bg-amber-50 hover:text-amber-400 dark:hover:bg-amber-950"
                        )}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(l) }}
                        onKeyDown={(e) => e.key === "Enter" && toggleFavorite(l)}
                      >
                        <Star className={cn("h-4 w-4", l.favorite && "fill-amber-400")} />
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={l.status} />
                    <PriorityBadge priority={l.priority} />
                    {isFollowUpOverdue(l) && (
                      <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        <CalendarClock className="h-3 w-3" /> {t("leads.followUpOverdue")}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      {l.assignedTo?.name || t("leads.unassigned")} · {relTime(l.createdAt, lang)}
                    </p>
                    <div className="flex gap-1">
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={t("common.call")}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                        onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${l.phone}` }}
                        onKeyDown={(e) => e.key === "Enter" && (window.location.href = `tel:${l.phone}`)}
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={t("common.whatsapp")}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400"
                        onClick={(e) => {
                          e.stopPropagation()
                          wa.send(l.phone, "")
                        }}
                        onKeyDown={(e) => e.key === "Enter" && wa.send(l.phone, "")}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
