"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useI18n } from "@/i18n"
import { toast } from "@/hooks/use-toast"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Phone, MessageCircle, Mail, StickyNote, MapPin, Building2, Calendar, User, IndianRupee,
  Trash2, Pencil, CheckCircle2, XCircle, FileText, Plus, Sparkles, Copy, Loader2, ClipboardList,
  Star, Paperclip, Upload, FileSpreadsheet, Image as ImageIcon, Video, File as FileIcon, Download,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { fillTemplate, templateVarsFromLead, TEMPLATE_VARS } from "@/lib/message-templates"
import {
  api, LEAD_STATUSES, relTime, dateLabel, dateTimeLabel, toLocalInput,
  type Lead, type TeamMember, type Task, type Quote, type MessageTemplate, type LeadMessage, type LeadAttachment,
} from "./api"
import { StatusBadge, PriorityBadge, Avatar, STATUS_DOT, EmptyState } from "./ui-bits"
import { LeadForm } from "./lead-form"

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="h-3.5 w-3.5" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  meeting: <Calendar className="h-3.5 w-3.5" />,
  note: <StickyNote className="h-3.5 w-3.5" />,
  status_change: <CheckCircle2 className="h-3.5 w-3.5" />,
  created: <Plus className="h-3.5 w-3.5" />,
  visit: <MapPin className="h-3.5 w-3.5" />,
  sms: <MessageSquare className="h-3.5 w-3.5" />,
  attachment: <Paperclip className="h-3.5 w-3.5" />,
}

function formatBytes(n: number): string {
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`
  if (n >= 1024) return `${Math.round(n / 1024)} KB`
  return `${n} B`
}

function AttIcon({ kind }: { kind: string }) {
  if (kind === "image") return <ImageIcon className="h-4 w-4" />
  if (kind === "pdf") return <FileText className="h-4 w-4" />
  if (kind === "excel") return <FileSpreadsheet className="h-4 w-4" />
  if (kind === "video") return <Video className="h-4 w-4" />
  return <FileIcon className="h-4 w-4" />
}

export function LeadDetail({
  leadId,
  open,
  onOpenChange,
  onChanged,
  members,
  onCreateQuote,
}: {
  leadId: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onChanged: () => void
  members: TeamMember[]
  onCreateQuote: (lead: Lead) => void
}) {
  const { t, lang } = useI18n()
  const [lead, setLead] = useState<Lead | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState("")
  const [outcome, setOutcome] = useState("connected")
  const [editOpen, setEditOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [followUpAt, setFollowUpAt] = useState("")
  const [taskTitle, setTaskTitle] = useState("")
  // Message composer state (templates + editable text)
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedTid, setSelectedTid] = useState<string | null>(null)
  const [msgText, setMsgText] = useState("")
  const [businessName, setBusinessName] = useState("")
  // Personal (per-lead) custom messages state
  const [leadMsgs, setLeadMsgs] = useState<LeadMessage[]>([])
  const [selectedPid, setSelectedPid] = useState<string | null>(null)
  const [pmOpen, setPmOpen] = useState(false)
  const [pmEditing, setPmEditing] = useState<LeadMessage | null>(null)
  const [pmName, setPmName] = useState("")
  const [pmContent, setPmContent] = useState("")
  const [pmSaving, setPmSaving] = useState(false)
  const [pmConfirmDelete, setPmConfirmDelete] = useState(false)
  // Attachments (photo / pdf / excel / video)
  const [attachments, setAttachments] = useState<LeadAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [attConfirmId, setAttConfirmId] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!leadId) return
    setLoading(true)
    try {
      const data = await api.get<Lead>(`/api/leads/${leadId}`)
      setLead(data)
      setTasks(data.tasks || [])
      setQuotes(data.quotes || [])
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [leadId, t])

  useEffect(() => {
    if (open && leadId) {
      load()
      // Load message templates + business name for the composer
      api.get<MessageTemplate[]>("/api/templates")
        .then((ts) => setTemplates(ts))
        .catch(() => setTemplates([]))
      api.get<Record<string, string>>("/api/settings")
        .then((s) => setBusinessName(s.businessName || ""))
        .catch(() => {})
      api.get<LeadMessage[]>(`/api/leads/${leadId}/messages`)
        .then((ms) => setLeadMsgs(ms))
        .catch(() => setLeadMsgs([]))
      api.get<LeadAttachment[]>(`/api/leads/${leadId}/attachments`)
        .then((ats) => setAttachments(ats))
        .catch(() => setAttachments([]))
    }
    if (!open) {
      setMsgText("")
      setSelectedTid(null)
      setSelectedPid(null)
      setPmOpen(false)
      setNote("")
      setFollowUpAt("")
      setAttConfirmId(null)
    }
  }, [open, leadId, load])

  // Auto-fill the composer with the default template once lead + templates are ready
  useEffect(() => {
    if (!lead || !open) return
    if (msgText.trim()) return // already filled / user typing
    const def = templates.find((x) => x.isDefault) || templates[0]
    if (def) {
      setSelectedTid(def.id)
      setMsgText(fillTemplate(def.content, templateVarsFromLead(lead, businessName)))
    }
  }, [lead, templates, businessName, open, msgText])

  if (!leadId) return null

  async function addActivity(type: string, opts?: { notes?: string; title?: string }) {
    if (type === "note" && !note.trim()) return
    try {
      await api.post(`/api/leads/${leadId}/activities`, {
        type,
        title: opts?.title || (type === "note" ? "Note" : type),
        notes: opts?.notes ?? (type === "note" ? note : note || null),
        outcome: type === "call" ? outcome : null,
      })
      setNote("")
      await load()
      onChanged()
      toast({ title: t("common.saved") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  async function changeStatus(status: string) {
    try {
      await api.patch(`/api/leads/${leadId}`, { status })
      await load()
      onChanged()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  async function convertToCustomer() {
    try {
      await api.post(`/api/leads/${leadId}/convert`)
      await load()
      onChanged()
      toast({ title: t("common.saved") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  async function scheduleFollowUp() {
    if (!followUpAt || !taskTitle.trim()) {
      toast({ title: t("common.required"), variant: "destructive" })
      return
    }
    try {
      await api.post("/api/tasks", {
        title: taskTitle,
        leadId,
        type: "follow_up",
        dueAt: new Date(followUpAt).toISOString(),
      })
      // Also store on the lead so the selected date/time SHOWS on the lead
      // card, info card and fills the {followup} variable in messages.
      await api.patch(`/api/leads/${leadId}`, { nextFollowUpAt: new Date(followUpAt).toISOString() })
      setTaskTitle("")
      setFollowUpAt("")
      await load()
      onChanged()
      toast({ title: t("common.saved") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  async function deleteTask(taskId: string) {
    try {
      await api.del(`/api/tasks/${taskId}`)
      await load()
      onChanged()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  async function markTaskDone(taskId: string) {
    try {
      await api.patch(`/api/tasks/${taskId}`, { status: "done" })
      await load()
      onChanged()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  async function deleteLead() {
    try {
      await api.del(`/api/leads/${leadId}`)
      onOpenChange(false)
      onChanged()
      toast({ title: t("common.deleted") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  function pickTemplate(tp: MessageTemplate) {
    setSelectedTid(tp.id)
    setSelectedPid(null)
    if (lead) setMsgText(fillTemplate(tp.content, templateVarsFromLead(lead, businessName)))
  }

  function pickPersonal(pm: LeadMessage) {
    setSelectedPid(pm.id)
    setSelectedTid(null)
    if (lead) setMsgText(fillTemplate(pm.content, templateVarsFromLead(lead, businessName)))
  }

  function openPmNew() {
    setPmEditing(null)
    setPmName("")
    setPmContent("")
    setPmConfirmDelete(false)
    setPmOpen(true)
  }

  function openPmEdit(pm: LeadMessage) {
    setPmEditing(pm)
    setPmName(pm.name)
    setPmContent(pm.content)
    setPmConfirmDelete(false)
    setPmOpen(true)
  }

  async function refreshLeadMsgs() {
    try {
      const list = await api.get<LeadMessage[]>(`/api/leads/${leadId}/messages`)
      setLeadMsgs(list)
    } catch {
      /* keep current list */
    }
  }

  async function savePm() {
    if (!pmName.trim()) {
      toast({ title: t("personal.emptyName"), variant: "destructive" })
      return
    }
    if (!pmContent.trim()) {
      toast({ title: t("personal.emptyContent"), variant: "destructive" })
      return
    }
    setPmSaving(true)
    try {
      const saved = pmEditing
        ? await api.patch<LeadMessage>(`/api/lead-messages/${pmEditing.id}`, { name: pmName, content: pmContent })
        : await api.post<LeadMessage>(`/api/leads/${leadId}/messages`, { name: pmName, content: pmContent })
      await refreshLeadMsgs()
      setPmOpen(false)
      // Select the saved message and fill the composer with it
      setSelectedPid(saved.id)
      setSelectedTid(null)
      if (lead) setMsgText(fillTemplate(saved.content, templateVarsFromLead(lead, businessName)))
      toast({ title: t("personal.saved") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setPmSaving(false)
    }
  }

  async function deletePm() {
    if (!pmEditing) return
    try {
      await api.del(`/api/lead-messages/${pmEditing.id}`)
      await refreshLeadMsgs()
      if (selectedPid === pmEditing.id) setSelectedPid(null)
      setPmOpen(false)
      toast({ title: t("personal.deleted") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  async function generateAiMessage(kind: string) {
    setAiLoading(true)
    try {
      const res = await api.post<{ message: string }>("/api/ai/message", {
        leadName: lead?.name,
        requirement: lead?.requirement,
        value: lead?.value,
        language: lang === "gu" ? "Gujarati" : lang === "hi" ? "Hindi" : lang === "mr" ? "Marathi" : lang === "bn" ? "Bengali" : lang === "ta" ? "Tamil" : lang === "te" ? "Telugu" : lang === "kn" ? "Kannada" : lang === "ml" ? "Malayalam" : lang === "pa" ? "Punjabi" : lang === "or" ? "Odia" : lang === "as" ? "Assamese" : lang === "ur" ? "Urdu" : "English",
        context: kind,
      })
      setSelectedTid(null)
      setSelectedPid(null)
      setMsgText(res.message)
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setAiLoading(false)
    }
  }

  function sendWhatsapp() {
    if (!msgText.trim()) {
      toast({ title: t("templates.emptyContent"), variant: "destructive" })
      return
    }
    window.open(waLink(msgText), "_blank")
    const tp = templates.find((x) => x.id === selectedTid)
    const pm = leadMsgs.find((x) => x.id === selectedPid)
    addActivity("whatsapp", {
      title: "WhatsApp",
      notes: pm
        ? `${t("personal.sentActivity")}: ${pm.name}`
        : tp
          ? `${t("templates.sentActivity")}: ${tp.name}`
          : msgText.slice(0, 120),
    })
  }

  // SMS: hands off to the phone's own SMS app (same as HelloLeads)
  function sendSms(text?: string) {
    const body = (text ?? msgText).trim()
    const digits = lead?.phone.replace(/\D/g, "").slice(-10) || ""
    window.location.href = `sms:+91${digits}${body ? `?body=${encodeURIComponent(body)}` : ""}`
    addActivity("sms", { title: "SMS", notes: t("sms.sentActivity") })
  }

  function sendEmail() {
    if (!lead?.email) {
      toast({ title: t("common.error"), description: t("common.email"), variant: "destructive" })
      return
    }
    const subject = encodeURIComponent(`${businessName || "Nova Leads"} - ${lead.name}`)
    const body = encodeURIComponent(msgText.trim())
    window.location.href = `mailto:${lead.email}?subject=${subject}${msgText.trim() ? `&body=${body}` : ""}`
    addActivity("email", { title: "Email", notes: msgText.trim().slice(0, 120) })
  }

  async function toggleFavoriteLead() {
    if (!lead) return
    const next = !lead.favorite
    setLead({ ...lead, favorite: next })
    try {
      await api.patch(`/api/leads/${leadId}`, { favorite: next })
      onChanged()
    } catch {
      setLead({ ...lead, favorite: !next })
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  function pickFile() {
    fileInputRef.current?.click()
  }

  async function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    const list = Array.from(files)
    for (const f of list) {
      if (f.size > 4 * 1024 * 1024) {
        toast({ title: `${f.name}: ${t("attachments.tooBig")}`, variant: "destructive" })
        continue
      }
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append("file", f)
        const res = await fetch(`/api/leads/${leadId}/attachments`, { method: "POST", body: fd })
        if (!res.ok) throw new Error()
        const att = (await res.json()) as LeadAttachment
        setAttachments((prev) => [att, ...prev])
        await load()
      } catch {
        toast({ title: t("common.error"), variant: "destructive" })
      } finally {
        setUploading(false)
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function deleteAttachment(id: string) {
    if (attConfirmId !== id) {
      setAttConfirmId(id)
      return
    }
    setAttConfirmId(null)
    try {
      await api.del(`/api/attachments/${id}`)
      setAttachments((prev) => prev.filter((a) => a.id !== id))
      await load()
      toast({ title: t("attachments.deleted") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  function copyMsg() {
    navigator.clipboard.writeText(msgText)
    toast({ title: t("ai.copied") })
  }

  const waLink = (msg?: string) =>
    `https://wa.me/91${lead?.phone.replace(/\D/g, "").slice(-10)}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex h-[94dvh] flex-col rounded-t-2xl p-0 sm:max-w-lg sm:rounded-2xl">
          {loading || !lead ? (
            <>
              <SheetTitle className="sr-only">{t("leads.leadDetails")}</SheetTitle>
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="border-b px-5 py-4">
                <SheetTitle className="flex items-center gap-3">
                  <Avatar name={lead.name} color={lead.assignedTo?.avatarColor} className="h-10 w-10 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold">{lead.name}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {lead.company || lead.city || ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={lead.favorite ? t("leads.unfavorite") : t("leads.favorite")}
                      onClick={toggleFavoriteLead}
                      className={lead.favorite ? "text-amber-400" : "text-muted-foreground"}
                    >
                      <Star className={cn("h-4 w-4", lead.favorite && "fill-amber-400 text-amber-400")} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditOpen(true)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={deleteLead}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="nova-scroll flex-1 space-y-5 overflow-y-auto px-5 py-4">
                {/* Status chips + priority */}
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={lead.status} />
                  <PriorityBadge priority={lead.priority} />
                  {lead.value > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <IndianRupee className="h-3 w-3" />
                      {lead.value.toLocaleString("en-IN")}
                    </span>
                  )}
                  {lead.aiScore > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      lead.aiScore >= 70 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : lead.aiScore >= 40 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    }`}>
                      {t("leads.aiScore")}: {lead.aiScore}
                    </span>
                  )}
                </div>

                {/* Quick action circles (HelloLeads style): call / whatsapp / SMS / email / visit */}
                <div className="grid grid-cols-5 gap-2">
                  <Button variant="outline" className="flex h-auto flex-col gap-1 py-2.5" onClick={() => { window.location.href = `tel:${lead.phone}`; addActivity("call") }}>
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-[10px]">{t("common.call")}</span>
                  </Button>
                  <Button variant="outline" className="flex h-auto flex-col gap-1 py-2.5" onClick={() => window.open(waLink(msgText.trim() || undefined), "_blank")}>
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-[10px]">{t("common.whatsapp")}</span>
                  </Button>
                  <Button variant="outline" className="flex h-auto flex-col gap-1 py-2.5" onClick={() => sendSms(msgText.trim() || undefined)}>
                    <MessageSquare className="h-4 w-4 text-sky-600" />
                    <span className="text-[10px]">{t("sms.send")}</span>
                  </Button>
                  <Button variant="outline" className="flex h-auto flex-col gap-1 py-2.5" onClick={sendEmail}>
                    <Mail className="h-4 w-4 text-amber-600" />
                    <span className="text-[10px]">{t("common.email")}</span>
                  </Button>
                  <Button variant="outline" className="flex h-auto flex-col gap-1 py-2.5" onClick={() => addActivity("visit")}>
                    <MapPin className="h-4 w-4 text-rose-600" />
                    <span className="text-[10px]">{t("leads.logVisit")}</span>
                  </Button>
                </div>

                {/* Info */}
                <div className="space-y-2 rounded-xl border bg-card p-4 text-sm">
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{lead.phone}</span>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Mail className="h-4 w-4" /> {lead.email}
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Building2 className="h-4 w-4" /> {lead.company}
                    </div>
                  )}
                  {lead.city && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {lead.city}
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <User className="h-4 w-4" /> {lead.assignedTo?.name || t("leads.unassigned")}
                  </div>
                  {lead.nextFollowUpAt && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Calendar className="h-4 w-4" /> {t("leads.nextFollowUp")}: {dateTimeLabel(lead.nextFollowUpAt)}
                    </div>
                  )}
                  {lead.requirement && (
                    <p className="pt-1 text-muted-foreground">{lead.requirement}</p>
                  )}
                  {lead.tags && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {lead.tags.split(",").filter(Boolean).map((tg) => (
                        <span key={tg} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{tg.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status change */}
                <div>
                  <Label className="mb-1.5 block text-xs">{t("leads.status")}</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {LEAD_STATUSES.filter((s) => s !== "won" && s !== "lost").map((s) => (
                      <button
                        key={s}
                        onClick={() => changeStatus(s)}
                        className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-[9px] leading-tight transition-all active:scale-95 ${
                          lead.status === s ? "border-primary bg-primary/10 font-semibold" : "hover:border-primary/40"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s]}`} />
                        {t(`status.${s}`)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => changeStatus("won")}>
                      <CheckCircle2 className="me-1 h-4 w-4" /> {t("leads.markWon")}
                    </Button>
                    <Button size="sm" variant="outline" className="text-rose-600" onClick={() => changeStatus("lost")}>
                      <XCircle className="me-1 h-4 w-4" /> {t("leads.markLost")}
                    </Button>
                  </div>
                  {lead.status === "won" && !lead.convertedAt && (
                    <Button size="sm" variant="outline" className="mt-2 w-full border-primary text-primary" onClick={convertToCustomer}>
                      {t("leads.convertToCustomer")}
                    </Button>
                  )}
                </div>

                {/* Quote action */}
                <Button variant="outline" className="w-full" onClick={() => onCreateQuote(lead)}>
                  <FileText className="me-2 h-4 w-4" /> {t("leads.createQuote")}
                </Button>

                {/* Attachments: photos / PDF / Excel / video (up to 4 MB each) */}
                <div className="rounded-xl border p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <Paperclip className="h-4 w-4 text-primary" /> {t("attachments.title")}
                    </p>
                    <Button size="sm" variant="outline" onClick={pickFile} disabled={uploading}>
                      {uploading ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="me-1.5 h-3.5 w-3.5" />}
                      {uploading ? t("attachments.uploading") : t("attachments.add")}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*,application/pdf,.pdf,.xls,.xlsx,.csv,video/*"
                    onChange={onFilesChosen}
                  />
                  {attachments.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-3 text-center text-[11px] text-muted-foreground">
                      {t("attachments.empty")}
                    </p>
                  ) : (
                    <div className="max-h-64 space-y-1.5 overflow-y-auto nova-scroll">
                      {attachments.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 rounded-lg border bg-card p-2 text-sm">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <AttIcon kind={a.kind} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{a.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {t(`attachments.kind.${a.kind}`)} · {formatBytes(a.size)} · {dateLabel(a.createdAt)}
                            </p>
                          </div>
                          <a
                            href={`/api/attachments/${a.id}?inline=1`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={t("attachments.view")}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <FileIcon className="h-3.5 w-3.5" />
                          </a>
                          <a
                            href={`/api/attachments/${a.id}`}
                            download={a.name}
                            aria-label={t("attachments.download")}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          <button
                            aria-label={t("common.delete")}
                            onClick={() => deleteAttachment(a.id)}
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-destructive/10",
                              attConfirmId === a.id ? "bg-destructive text-white hover:bg-destructive" : "text-muted-foreground hover:text-destructive"
                            )}
                            title={attConfirmId === a.id ? t("attachments.confirmDelete") : t("common.delete")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* WhatsApp message composer: templates + AI + editable text */}
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <MessageCircle className="h-4 w-4 text-emerald-600" /> {t("templates.composerTitle")}
                  </p>
                  {templates.length === 0 ? (
                    <p className="mb-2 rounded-lg border border-dashed bg-card p-2.5 text-[11px] text-muted-foreground">
                      {t("templates.noTemplatesDesc")}
                    </p>
                  ) : (
                    <>
                      <p className="mb-1.5 text-[11px] text-muted-foreground">{t("templates.pickTemplate")}</p>
                      <div className="nova-scroll -mx-1 mb-2.5 flex gap-1.5 overflow-x-auto px-1 pb-1">
                        {templates.map((tp) => (
                          <button
                            key={tp.id}
                            onClick={() => pickTemplate(tp)}
                            className={cn(
                              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                              selectedTid === tp.id
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card hover:border-primary/40"
                            )}
                          >
                            {tp.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {/* Personal (per-lead) custom messages */}
                  <p className="mb-1.5 mt-1 text-[11px] text-muted-foreground">{t("personal.title")}</p>
                  <div className="nova-scroll -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
                    {leadMsgs.map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => pickPersonal(pm)}
                        className={cn(
                          "flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                          selectedPid === pm.id
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-border bg-card hover:border-emerald-500/50"
                        )}
                      >
                        <User className="h-3 w-3" />
                        {pm.name}
                        {selectedPid === pm.id && (
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label={t("common.edit")}
                            className="ms-0.5 rounded-full bg-white/25 p-0.5 hover:bg-white/40"
                            onClick={(e) => {
                              e.stopPropagation()
                              openPmEdit(pm)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation()
                                openPmEdit(pm)
                              }
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={openPmNew}
                      className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-emerald-600/60 bg-card px-3 py-1.5 text-xs font-medium text-emerald-700 transition-all active:scale-95 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950"
                    >
                      <Plus className="h-3 w-3" /> {t("personal.add")}
                    </button>
                  </div>
                  {leadMsgs.length === 0 && (
                    <p className="mb-2 text-[11px] text-muted-foreground">{t("personal.empty")}</p>
                  )}
                  <Textarea
                    rows={6}
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder={t("templates.contentPh")}
                    className="bg-card"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={copyMsg} disabled={!msgText.trim()}>
                      <Copy className="me-1 h-3.5 w-3.5" /> {t("ai.copyMessage")}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => generateAiMessage("follow_up")} disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="me-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="me-1 h-3.5 w-3.5" />}
                      {aiLoading ? t("ai.generating") : t("templates.aiGenerate")}
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={sendWhatsapp}
                    disabled={!msgText.trim()}
                  >
                    <MessageCircle className="me-1.5 h-4 w-4" /> {t("ai.sendWhatsapp")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => sendSms()}
                    disabled={!msgText.trim()}
                  >
                    <MessageSquare className="me-1.5 h-4 w-4" /> {t("sms.send")}
                  </Button>
                </div>

                {/* Schedule follow-up */}
                <div className="space-y-2 rounded-xl border p-4">
                  <p className="text-sm font-semibold">{t("leads.scheduleFollowUp")}</p>
                  <Input placeholder={t("tasks.taskTitle")} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                  <Input type="datetime-local" value={followUpAt || toLocalInput(lead.nextFollowUpAt)} onChange={(e) => setFollowUpAt(e.target.value)} />
                  <Button size="sm" className="w-full" onClick={scheduleFollowUp}>{t("common.save")}</Button>
                </div>

                {/* Tasks for this lead */}
                {tasks.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold">{t("tasks.title")}</p>
                    <div className="space-y-2">
                      {tasks.map((tk) => (
                        <div key={tk.id} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                          <button
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary/50 text-transparent hover:text-primary"
                            onClick={() => markTaskDone(tk.id)}
                            aria-label={t("tasks.markDone")}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{tk.title}</p>
                            <p className="text-[10px] text-muted-foreground">{dateTimeLabel(tk.dueAt)}</p>
                          </div>
                          <button className="text-muted-foreground hover:text-destructive" onClick={() => deleteTask(tk.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quotes for this lead */}
                {quotes.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold">{t("quotes.title")}</p>
                    <div className="space-y-2">
                      {quotes.map((q) => (
                        <div key={q.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                          <div>
                            <p className="text-xs font-semibold">{q.quoteNo}</p>
                            <p className="text-[10px] text-muted-foreground">{dateLabel(q.createdAt)}</p>
                          </div>
                          <span className="text-xs font-bold text-primary">₹{q.total.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Add note */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{t("leads.addNote")}</p>
                  <Textarea rows={2} placeholder={t("activity.addNotePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="flex gap-2">
                    <Select value={outcome} onValueChange={setOutcome}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="connected">{t("activity.connected")}</SelectItem>
                        <SelectItem value="no_answer">{t("activity.no_answer")}</SelectItem>
                        <SelectItem value="busy">{t("activity.busy")}</SelectItem>
                        <SelectItem value="interested">{t("activity.interested")}</SelectItem>
                        <SelectItem value="not_interested">{t("activity.not_interested")}</SelectItem>
                        <SelectItem value="callback">{t("activity.callback")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="flex-1" onClick={() => addActivity("note")}>{t("common.save")}</Button>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <p className="mb-3 text-sm font-semibold">{t("leads.timeline")}</p>
                  {(lead.activities?.length ?? 0) === 0 ? (
                    <p className="text-xs text-muted-foreground">{t("activity.noActivities")}</p>
                  ) : (
                    <div className="space-y-0">
                      {lead.activities?.map((a, i) => (
                        <div key={a.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full ${
                              a.type === "call" ? "bg-amber-100 text-amber-600 dark:bg-amber-950"
                              : a.type === "whatsapp" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950"
                              : a.type === "status_change" ? "bg-sky-100 text-sky-600 dark:bg-sky-950"
                              : "bg-muted text-muted-foreground"
                            }`}>
                              {ACTIVITY_ICONS[a.type] || <StickyNote className="h-3.5 w-3.5" />}
                            </span>
                            {i < (lead.activities?.length || 0) - 1 && <span className="my-1 w-px flex-1 bg-border" />}
                          </div>
                          <div className="min-w-0 flex-1 pb-4">
                            <p className="text-xs font-medium">
                              {a.type === "status_change" ? `${t("activity.status_change")}: ${t(`status.${a.title}`)}` : a.type === "created" ? t("activity.created") : t(`activity.${a.type}`)}
                            </p>
                            {a.notes && <p className="mt-0.5 text-xs text-muted-foreground">{a.notes}</p>}
                            {a.outcome && (
                              <p className="mt-0.5 text-[10px] text-muted-foreground">{t("activity.outcome")}: {t(`activity.${a.outcome}`)}</p>
                            )}
                            <p className="mt-0.5 text-[10px] text-muted-foreground">{relTime(a.createdAt, lang)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Personal message add/edit dialog */}
      <Dialog open={pmOpen} onOpenChange={setPmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pmEditing ? t("personal.editTitle") : t("personal.addTitle")}</DialogTitle>
            <DialogDescription>{t("personal.desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block text-xs">{t("personal.name")}</Label>
              <Input
                value={pmName}
                onChange={(e) => setPmName(e.target.value)}
                placeholder={t("personal.namePh")}
                autoFocus
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{t("templates.content")}</Label>
              <div className="nova-scroll mb-2 flex gap-1 overflow-x-auto pb-1">
                {TEMPLATE_VARS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPmContent((c) => (c ? `${c}{${v}}` : `{${v}}`))}
                    className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {`{${v}}`}
                  </button>
                ))}
              </div>
              <Textarea
                rows={5}
                value={pmContent}
                onChange={(e) => setPmContent(e.target.value)}
                placeholder={t("personal.contentPh")}
              />
              {lead && pmContent.trim() && (
                <div className="mt-2 whitespace-pre-wrap rounded-lg border bg-muted/40 p-2.5 text-xs">
                  <span className="mb-1 block text-[10px] font-semibold text-muted-foreground">{t("templates.preview")}</span>
                  {fillTemplate(pmContent, templateVarsFromLead(lead, businessName))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {pmEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => (pmConfirmDelete ? deletePm() : setPmConfirmDelete(true))}
                >
                  <Trash2 className="me-1 h-4 w-4" />
                  {pmConfirmDelete ? t("personal.confirmDelete") : t("common.delete")}
                </Button>
              )}
              <div className="flex flex-1 justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setPmOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button size="sm" onClick={savePm} disabled={pmSaving}>
                  {pmSaving && <Loader2 className="me-1 h-4 w-4 animate-spin" />}
                  {t("common.save")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LeadForm
        open={editOpen}
        onOpenChange={setEditOpen}
        lead={lead}
        members={members}
        onSaved={() => {
          setEditOpen(false)
          load()
          onChanged()
        }}
      />
    </>
  )
}
