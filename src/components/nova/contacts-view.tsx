"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useI18n } from "@/i18n"
import { toast } from "@/hooks/use-toast"
import { api, formatMoneyFull, type Contact } from "./api"
import { useWhatsApp } from "./whatsapp-send"
import { EmptyState } from "./ui-bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search, Plus, Phone, MessageCircle, Mail, Users, Pencil, Trash2, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function ContactsView({ refreshKey }: { refreshKey: number }) {
  const { t } = useI18n()
  const wa = useWhatsApp()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [form, setForm] = useState({ name: "", phone: "", email: "", company: "", city: "", address: "", tags: "", notes: "" })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Contact[]>("/api/contacts")
      setContacts(data)
    } catch {
      setContacts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const filtered = contacts.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.company || "").toLowerCase().includes(q) || (c.city || "").toLowerCase().includes(q)
  })

  function openAdd() {
    setEditing(null)
    setForm({ name: "", phone: "", email: "", company: "", city: "", address: "", tags: "", notes: "" })
    setFormOpen(true)
  }

  function openEdit(c: Contact) {
    setEditing(c)
    setForm({
      name: c.name, phone: c.phone, email: c.email || "", company: c.company || "",
      city: c.city || "", address: c.address || "", tags: c.tags, notes: c.notes || "",
    })
    setFormOpen(true)
  }

  async function save() {
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: t("common.required"), variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      if (editing) await api.patch(`/api/contacts/${editing.id}`, form)
      else await api.post("/api/contacts", form)
      toast({ title: t("common.saved") })
      setFormOpen(false)
      await load()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    try {
      await api.del(`/api/contacts/${id}`)
      toast({ title: t("common.deleted") })
      await load()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-9" placeholder={t("contacts.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="icon" className="h-10 w-10 shrink-0" onClick={openAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title={t("contacts.noContacts")}
          desc={t("contacts.noContactsDesc")}
          action={
            <Button onClick={openAdd}>
              <Plus className="me-2 h-4 w-4" /> {t("contacts.addContact")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <button className="min-w-0 flex-1 text-start" onClick={() => openEdit(c)}>
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.company || c.city || c.phone}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {c.totalBusiness > 0 ? formatMoneyFull(c.totalBusiness) : ""}
                    </span>
                    {c.email && <span className="truncate text-[10px] text-muted-foreground">{c.email}</span>}
                  </div>
                </button>
                <div className="flex shrink-0 gap-1">
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={t("common.call")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={() => (window.location.href = `tel:${c.phone}`)}
                    onKeyDown={(e) => e.key === "Enter" && (window.location.href = `tel:${c.phone}`)}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={t("common.whatsapp")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400"
                    onClick={() => wa.send(c.phone, "")}
                    onKeyDown={(e) => e.key === "Enter" && wa.send(c.phone, "")}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </span>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive" onClick={() => remove(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("contacts.editContact") : t("contacts.addContact")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("common.name")} *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("common.phone")} *</Label>
                <Input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("leads.company")}</Label>
                <Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("leads.city")}</Label>
                <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.email")}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("leads.address")}</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.notes")}</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
              <Button className="flex-1" onClick={save} disabled={saving}>
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
