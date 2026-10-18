"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useI18n } from "@/i18n"
import { toast } from "@/hooks/use-toast"
import { api, type MessageTemplate } from "./api"
import { fillTemplate, templateVarsFromLead, sampleTemplateVars } from "@/lib/message-templates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  MessageSquareText, Plus, Pencil, Trash2, Loader2, Star, Eye,
} from "lucide-react"

const VAR_CHIPS = ["name", "company", "city", "value", "business", "date"] as const

export function TemplateSettingsCard() {
  const { t } = useI18n()
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MessageTemplate | null>(null)
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTemplates(await api.get<MessageTemplate[]>("/api/templates"))
    } catch {
      // silent - falls back to empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openAdd() {
    setEditing(null)
    setName("")
    setContent("")
    setIsDefault(templates.length === 0)
    setDialogOpen(true)
  }

  function openEdit(tp: MessageTemplate) {
    setEditing(tp)
    setName(tp.name)
    setContent(tp.content)
    setIsDefault(tp.isDefault)
    setDialogOpen(true)
  }

  function insertVar(v: string) {
    setContent((c) => (c ? `${c}{${v}}` : `{${v}}`))
  }

  async function save() {
    if (!name.trim()) {
      toast({ title: t("templates.emptyName"), variant: "destructive" })
      return
    }
    if (!content.trim()) {
      toast({ title: t("templates.emptyContent"), variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/api/templates/${editing.id}`, { name, content, isDefault })
      } else {
        await api.post("/api/templates", { name, content, isDefault })
      }
      toast({ title: t("common.saved") })
      setDialogOpen(false)
      await load()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function doDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.del(`/api/templates/${deleteId}`)
      toast({ title: t("common.deleted") })
      setDeleteId(null)
      await load()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const previewVars = sampleTemplateVars(undefined, t("templates.sampleName"))
  const previewText = fillTemplate(content || " ", previewVars)

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquareText className="h-4 w-4 text-primary" /> {t("templates.title")}
        </h3>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="me-1 h-3.5 w-3.5" /> {t("templates.add")}
        </Button>
      </div>
      <p className="mb-2.5 text-xs text-muted-foreground">{t("templates.desc")}</p>

      <div className="rounded-xl border bg-card p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="py-4 text-center">
            <MessageSquareText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">{t("templates.noTemplates")}</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">{t("templates.noTemplatesDesc")}</p>
          </div>
        ) : (
          <div className="nova-scroll max-h-96 space-y-2 overflow-y-auto">
            {templates.map((tp) => (
              <div key={tp.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{tp.name}</p>
                  {tp.isDefault && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      <Star className="h-2.5 w-2.5 fill-current" /> {t("templates.defaultBadge")}
                    </span>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => openEdit(tp)} aria-label={t("common.edit")}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive" onClick={() => setDeleteId(tp.id)} aria-label={t("common.delete")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="nova-scroll mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">{tp.content}</p>
              </div>
            ))}
          </div>
        )}
        {templates.length > 0 && (
          <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Eye className="mt-0.5 h-3 w-3 shrink-0" /> {t("templates.useHint")}
          </p>
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("templates.edit") : t("templates.add")}</DialogTitle>
            <DialogDescription>{t("templates.desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div>
              <Label className="mb-1.5 block text-xs">{t("templates.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("templates.namePh")} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{t("templates.content")}</Label>
              <Textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("templates.contentPh")} />
              <p className="mt-1.5 text-[11px] text-muted-foreground">{t("templates.insertVar")}:</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {VAR_CHIPS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVar(v)}
                    className="rounded-full border bg-muted px-2.5 py-1 font-mono text-[10px] transition-all hover:border-primary/50 hover:text-primary active:scale-95"
                  >
                    {`{${v}}`}
                  </button>
                ))}
              </div>
            </div>
            {content.trim() && (
              <div className="rounded-lg border border-dashed bg-muted/40 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("templates.preview")}</p>
                <p className="whitespace-pre-wrap text-xs">{previewText}</p>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <Star className="h-3.5 w-3.5 text-amber-500" /> {t("templates.makeDefault")}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t("templates.defaultDesc")}</p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button className="flex-1" onClick={save} disabled={saving}>
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">{t("common.delete")}</DialogTitle>
            <DialogDescription>{t("templates.confirmDelete")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={doDelete} disabled={deleting}>
              {deleting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("common.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
