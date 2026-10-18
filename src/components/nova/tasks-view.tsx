"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useI18n } from "@/i18n"
import { toast } from "@/hooks/use-toast"
import { api, dateTimeLabel, TASK_TYPES, type Task, type TeamMember } from "./api"
import { EmptyState } from "./ui-bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  CheckCircle2, Plus, Trash2, CalendarClock, ClipboardList, Loader2, Phone, Users, MapPin, Presentation, Banknote, Repeat,
} from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = ["today", "overdue", "upcoming", "completed"] as const

const TYPE_ICONS: Record<string, React.ReactNode> = {
  follow_up: <Repeat className="h-4 w-4 text-primary" />,
  call: <Phone className="h-4 w-4 text-amber-600" />,
  meeting: <Users className="h-4 w-4 text-violet-600" />,
  visit: <MapPin className="h-4 w-4 text-rose-600" />,
  demo: <Presentation className="h-4 w-4 text-sky-600" />,
  payment: <Banknote className="h-4 w-4 text-emerald-600" />,
}

export function TasksView({
  refreshKey,
  onChanged,
  onOpenLead,
}: {
  refreshKey: number
  onChanged: () => void
  onOpenLead: (id: string) => void
}) {
  const { t } = useI18n()
  const [tab, setTab] = useState<(typeof TABS)[number]>("today")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    type: "follow_up",
    dueDate: "",
    dueTime: "10:00",
    notes: "",
    leadId: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Task[]>(`/api/tasks?tab=${tab === "completed" ? "completed" : tab}`)
      setTasks(data)
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  async function markDone(task: Task) {
    try {
      await api.patch(`/api/tasks/${task.id}`, { status: task.status === "done" ? "pending" : "done" })
      await load()
      onChanged()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  async function removeTask(id: string) {
    try {
      await api.del(`/api/tasks/${id}`)
      await load()
      onChanged()
      toast({ title: t("common.deleted") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  async function save() {
    if (!form.title.trim() || !form.dueDate) {
      toast({ title: t("common.required"), variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await api.post("/api/tasks", {
        title: form.title,
        type: form.type,
        dueAt: new Date(`${form.dueDate}T${form.dueTime}`).toISOString(),
        notes: form.notes,
        leadId: form.leadId || null,
      })
      toast({ title: t("common.saved") })
      setAddOpen(false)
      setForm({ title: "", type: "follow_up", dueDate: "", dueTime: "10:00", notes: "", leadId: "" })
      await load()
      onChanged()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto nova-scroll">
          {TABS.map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                tab === tb ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {t(`tasks.${tb}`)}
            </button>
          ))}
        </div>
        <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-7 w-7" />}
          title={t("tasks.noTasks")}
          desc={t("tasks.noTasksDesc")}
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="me-2 h-4 w-4" /> {t("tasks.addTask")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const overdue = task.status === "pending" && new Date(task.dueAt) < new Date()
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border bg-card p-3.5 shadow-sm",
                  task.status === "done" && "opacity-60"
                )}
              >
                <button
                  onClick={() => markDone(task)}
                  aria-label={t("tasks.markDone")}
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    task.status === "done"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-muted-foreground/40 text-transparent hover:border-primary hover:text-primary/30"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium", task.status === "done" && "line-through")}>
                      {task.title}
                    </p>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {TYPE_ICONS[task.type] || TYPE_ICONS.follow_up}
                      {t(`tasks.${task.type}`)}
                    </span>
                    <span className={cn("flex items-center gap-1", overdue && "font-semibold text-rose-600 dark:text-rose-400")}>
                      <CalendarClock className="h-3 w-3" />
                      {dateTimeLabel(task.dueAt)}
                      {overdue && ` · ${t("tasks.overdue")}`}
                    </span>
                  </div>
                  {task.lead && (
                    <button
                      onClick={() => onOpenLead(task.lead!.id)}
                      className="mt-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10"
                    >
                      {task.lead.name}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("tasks.addTask")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("tasks.taskTitle")} *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("tasks.type")}</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((tp) => (
                      <SelectItem key={tp} value={tp}>{t(`tasks.${tp}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("tasks.dueDate")} *</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("tasks.dueTime")}</Label>
                <Input type="time" value={form.dueTime} onChange={(e) => setForm((f) => ({ ...f, dueTime: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("tasks.relatedLead")}</Label>
              <TaskLeadSelect value={form.leadId} onChange={(v) => setForm((f) => ({ ...f, leadId: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.notes")}</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button className="flex-1" onClick={save} disabled={saving}>
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("common.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaskLeadSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n()
  const [leads, setLeads] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    api.get<{ id: string; name: string; status: string }[]>("/api/leads").then((all) =>
      setLeads(all.filter((l) => !["won", "lost"].includes(l.status)).map((l) => ({ id: l.id, name: l.name })))
    ).catch(() => {})
  }, [])
  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
      <SelectTrigger><SelectValue placeholder={t("common.select")} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{t("common.none")}</SelectItem>
        {leads.map((l) => (
          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
