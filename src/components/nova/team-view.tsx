"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useI18n } from "@/i18n"
import { toast } from "@/hooks/use-toast"
import { api, type TeamMember } from "./api"
import { EmptyState, Avatar } from "./ui-bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react"

export function TeamView({ refreshKey }: { refreshKey: number }) {
  const { t } = useI18n()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "sales" })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<TeamMember[]>("/api/team")
      setMembers(data)
    } catch {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  function openAdd() {
    setEditing(null)
    setForm({ name: "", phone: "", email: "", role: "sales" })
    setFormOpen(true)
  }

  function openEdit(m: TeamMember) {
    setEditing(m)
    setForm({ name: m.name, phone: m.phone || "", email: m.email || "", role: m.role })
    setFormOpen(true)
  }

  async function save() {
    if (!form.name.trim()) {
      toast({ title: t("common.required"), variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      if (editing) await api.patch(`/api/team/${editing.id}`, form)
      else await api.post("/api/team", form)
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
      await api.del(`/api/team/${id}`)
      toast({ title: t("common.deleted") })
      await load()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={openAdd}>
          <Plus className="me-1.5 h-4 w-4" /> {t("team.addMember")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title={t("team.noMembers")}
          desc={t("team.noMembersDesc")}
          action={
            <Button onClick={openAdd}>
              <Plus className="me-2 h-4 w-4" /> {t("team.addMember")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-sm">
              <Avatar name={m.name} color={m.avatarColor} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{m.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t(`team.${m.role}`)}
                  {m.phone ? ` · ${m.phone}` : ""}
                </p>
                <div className="mt-1 flex gap-2 text-[10px]">
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {t("team.leadsCount")}: {m.leadsCount ?? 0}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {t("team.wonCount")}: {m.wonCount ?? 0}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-primary" onClick={() => openEdit(m)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive" onClick={() => remove(m.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? t("team.editMember") : t("team.addMember")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label>{t("team.memberName")} *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("team.roleLabel")}</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">{t("team.owner")}</SelectItem>
                  <SelectItem value="manager">{t("team.manager")}</SelectItem>
                  <SelectItem value="sales">{t("team.sales")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.phone")}</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.email")}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
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
