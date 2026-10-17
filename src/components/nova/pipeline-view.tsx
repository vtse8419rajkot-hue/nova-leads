"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useI18n } from "@/i18n"
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
} from "@dnd-kit/core"
import { api, OPEN_STATUSES, formatMoney, type Lead, type TeamMember } from "./api"
import { PriorityBadge, Avatar } from "./ui-bits"
import { Loader2, KanbanSquare, GripVertical, IndianRupee } from "lucide-react"
import { cn } from "@/lib/utils"

const STAGE_COLORS: Record<string, string> = {
  new: "border-t-sky-500",
  contacted: "border-t-amber-500",
  in_progress: "border-t-violet-500",
  quotation: "border-t-cyan-500",
  negotiation: "border-t-orange-500",
}

function DraggableLeadCard({
  lead,
  onOpen,
}: {
  lead: Lead
  onOpen: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group rounded-xl border bg-card p-3 shadow-sm transition-all active:cursor-grabbing",
        isDragging && "opacity-30"
      )}
      onClick={() => onOpen(lead.id)}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{lead.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{lead.company || lead.city || lead.phone}</p>
          <div className="mt-1.5 flex items-center justify-between">
            {lead.value > 0 && (
              <span className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <IndianRupee className="h-2.5 w-2.5" />
                {lead.value.toLocaleString("en-IN")}
              </span>
            )}
            <PriorityBadge priority={lead.priority} className="text-[9px] px-1.5" />
          </div>
          {lead.assignedTo && (
            <div className="mt-1.5 flex items-center gap-1">
              <Avatar name={lead.assignedTo.name} color={lead.assignedTo.avatarColor} className="h-4 w-4 text-[7px]" />
              <span className="truncate text-[9px] text-muted-foreground">{lead.assignedTo.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StageColumn({
  status,
  leads,
  onOpen,
}: {
  status: string
  leads: Lead[]
  onOpen: (id: string) => void
}) {
  const { t } = useI18n()
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${status}` })
  const total = leads.reduce((s, l) => s + l.value, 0)
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[220px] shrink-0 flex-col rounded-xl border border-t-4 bg-muted/40 transition-colors sm:w-[250px]",
        STAGE_COLORS[status],
        isOver && "border-primary bg-primary/10"
      )}
    >
      <div className="sticky top-0 rounded-t-xl bg-muted/80 px-3 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold">{t(`status.${status}`)}</p>
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold tabular-nums">{leads.length}</span>
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {t("pipeline.totalValue")}: {formatMoney(total)}
        </p>
      </div>
      <div className="nova-scroll flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-2">
        {leads.map((l) => (
          <DraggableLeadCard key={l.id} lead={l} onOpen={onOpen} />
        ))}
        {leads.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-[10px] text-muted-foreground">
            {t("pipeline.dragHint")}
          </div>
        )}
      </div>
    </div>
  )
}

export function PipelineView({
  members,
  onOpenLead,
  refreshKey,
}: {
  members: TeamMember[]
  onOpenLead: (id: string) => void
  refreshKey: number
}) {
  const { t } = useI18n()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

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

  const byStage = useMemo(() => {
    const map: Record<string, Lead[]> = {}
    for (const s of OPEN_STATUSES) map[s] = []
    for (const l of leads) {
      if (map[l.status]) map[l.status].push(l)
    }
    return map
  }, [leads])

  const activeLead = leads.find((l) => l.id === activeId)

  async function handleDragEnd(event: { active: { id: unknown }; over: { id: unknown } | null }) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const overId = String(over.id)
    if (!overId.startsWith("stage-")) return
    const newStatus = overId.replace("stage-", "")
    const lead = leads.find((l) => l.id === String(active.id))
    if (!lead || lead.status === newStatus) return

    // optimistic update
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l)))
    try {
      await api.patch(`/api/leads/${lead.id}`, { status: newStatus })
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l)))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("pipeline.dragHint")}</p>
      <DndContext
        sensors={sensors}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="nova-kanban nova-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {OPEN_STATUSES.map((s) => (
            <StageColumn key={s} status={s} leads={byStage[s] || []} onOpen={onOpenLead} />
          ))}
        </div>
        <DragOverlay>
          {activeLead ? (
            <div className="w-[210px] rotate-2 rounded-xl border bg-card p-3 shadow-xl">
              <p className="truncate text-xs font-semibold">{activeLead.name}</p>
              <p className="text-[10px] text-muted-foreground">{activeLead.phone}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
