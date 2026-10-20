"use client"

import React, { useEffect, useState } from "react"
import { useI18n } from "@/i18n"
import { toast } from "@/hooks/use-toast"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Sparkles } from "lucide-react"
import { api, SOURCES, PRIORITIES, LEAD_STATUSES, toLocalInput, type Lead, type TeamMember } from "./api"

export function LeadForm({
  open,
  onOpenChange,
  onSaved,
  lead,
  members,
  defaultStatus,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: (lead: Lead) => void
  lead?: Lead | null
  members: TeamMember[]
  defaultStatus?: string
}) {
  const { t, lang } = useI18n()
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiScore, setAiScore] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    city: "",
    address: "",
    source: "manual",
    status: defaultStatus || "new",
    priority: "warm",
    value: "",
    requirement: "",
    notes: "",
    tags: "",
    assignedToId: "",
    nextFollowUpAt: "",
  })

  useEffect(() => {
    if (open) {
      setAiScore(lead?.aiScore ?? null)
      setForm({
        name: lead?.name || "",
        phone: lead?.phone || "",
        email: lead?.email || "",
        company: lead?.company || "",
        city: lead?.city || "",
        address: lead?.address || "",
        source: lead?.source || "manual",
        status: lead?.status || defaultStatus || "new",
        priority: lead?.priority || "warm",
        value: lead?.value ? String(lead.value) : "",
        requirement: lead?.requirement || "",
        notes: lead?.notes || "",
        tags: lead?.tags || "",
        assignedToId: lead?.assignedToId || "",
        // Use LOCAL time for the datetime-local input (toISOString shifted by TZ)
        nextFollowUpAt: toLocalInput(lead?.nextFollowUpAt),
      })
    }
  }, [open, lead, defaultStatus])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function runAiScore() {
    if (!form.name.trim()) {
      toast({ title: t("leads.name") + " " + t("common.required") })
      return
    }
    setAiLoading(true)
    try {
      const res = await api.post<{ score: number }>("/api/ai/score", {
        name: form.name,
        company: form.company,
        requirement: form.requirement,
        value: Number(form.value) || 0,
        source: form.source,
        notes: form.notes,
      })
      setAiScore(res.score)
      toast({ title: t("ai.scoreUpdated") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setAiLoading(false)
    }
  }

  async function save() {
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: t("common.required"), variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        value: Number(form.value) || 0,
        nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : null,
      }
      const saved = lead
        ? await api.patch<Lead>(`/api/leads/${lead.id}`, payload)
        : await api.post<Lead>("/api/leads", payload)
      toast({ title: t("common.saved") })
      onOpenChange(false)
      onSaved(saved)
    } catch (e) {
      toast({ title: t("common.error"), description: String(e instanceof Error ? e.message : e), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const langNames: Record<string, string> = {
    en: "English", gu: "Gujarati", hi: "Hindi", mr: "Marathi", bn: "Bengali",
    ta: "Tamil", te: "Telugu", kn: "Kannada", ml: "Malayalam", pa: "Punjabi",
    or: "Odia", as: "Assamese", ur: "Urdu",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{lead ? t("leads.editLead") : t("leads.addLead")}</DialogTitle>
        </DialogHeader>
        <div className="nova-scroll flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lead-name">{t("leads.name")} *</Label>
              <Input id="lead-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Rajesh Patel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone">{t("leads.phone")} *</Label>
              <Input id="lead-phone" type="tel" inputMode="numeric" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98765 43210" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lead-company">{t("leads.company")}</Label>
              <Input id="lead-company" value={form.company} onChange={(e) => set("company", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-city">{t("leads.city")}</Label>
              <Input id="lead-city" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("leads.source")}</Label>
              <Select value={form.source} onValueChange={(v) => set("source", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{t(`source.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("leads.status")}</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("leads.priority")}</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{t(`priority.${p}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-value">{t("leads.value")}</Label>
              <Input id="lead-value" type="number" inputMode="decimal" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="25000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("leads.assignedTo")}</Label>
              <Select value={form.assignedToId || "none"} onValueChange={(v) => set("assignedToId", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("leads.unassigned")}</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-followup">{t("leads.nextFollowUp")}</Label>
              <Input
                id="lead-followup"
                type="datetime-local"
                value={form.nextFollowUpAt}
                onChange={(e) => set("nextFollowUpAt", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-req">{t("leads.requirement")}</Label>
            <Textarea id="lead-req" rows={2} value={form.requirement} onChange={(e) => set("requirement", e.target.value)} placeholder="..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-tags">{t("leads.tags")}</Label>
            <Input id="lead-tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder={t("leads.tagsHint")} />
          </div>

          {/* AI Score */}
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t("leads.aiScore")}
                </p>
                <p className="text-xs text-muted-foreground">{t("ai.scoreTip")}</p>
              </div>
              <div className="flex items-center gap-2">
                {aiScore !== null && (
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      aiScore >= 70 ? "bg-emerald-100 text-emerald-700" : aiScore >= 40 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {aiScore}
                  </span>
                )}
                <Button type="button" size="sm" variant="outline" onClick={runAiScore} disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-notes">{t("leads.notes")}</Label>
            <Textarea id="lead-notes" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 border-t px-5 py-4 pb-safe">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {lead ? t("common.update") : t("common.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
