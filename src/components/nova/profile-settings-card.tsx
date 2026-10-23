"use client"

import React, { useEffect, useState } from "react"
import { useI18n } from "@/i18n"
import { toast } from "@/hooks/use-toast"
import { api, type Account } from "./api"
import { useAuth } from "./auth-context"
import { BUSINESS_TYPES, BUSINESS_CATEGORIES, ROLES, TEAM_SIZES, VaultRow } from "./auth-onboarding"
import { listVault } from "@/lib/account-vault"
import { getWaPref, setWaPref, type WaPref } from "./whatsapp-send"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Loader2, UserCircle2, LogOut, Save, UsersRound, MessageCircle } from "lucide-react"

export function ProfileSettingsCard() {
  const { t } = useI18n()
  const { account, onAccountChange } = useAuth()
  const [form, setForm] = useState({
    name: account.name,
    phone: account.phone || "",
    businessName: account.businessName || "",
    businessType: account.businessType || "",
    businessCategory: account.businessCategory || "",
    role: account.role || "",
    teamSize: account.teamSize || "",
    website: account.website || "",
    about: account.about || "",
  })
  const [saving, setSaving] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  const [waPref, setWaPrefState] = useState<WaPref>("ask")
  const vaultAccounts = listVault()

  useEffect(() => {
    setWaPrefState(getWaPref())
  }, [])

  useEffect(() => {
    setForm({
      name: account.name,
      phone: account.phone || "",
      businessName: account.businessName || "",
      businessType: account.businessType || "",
      businessCategory: account.businessCategory || "",
      role: account.role || "",
      teamSize: account.teamSize || "",
      website: account.website || "",
      about: account.about || "",
    })
  }, [account])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function save() {
    setSaving(true)
    try {
      const updated = await api.patch<Account>("/api/auth/profile", form)
      onAccountChange(updated)
      // Keep the {business} variable in message templates in sync
      try {
        await api.post("/api/settings", { businessName: form.businessName })
      } catch {
        /* non-critical */
      }
      toast({ title: t("profile.saved") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    setLoggingOut(true)
    try {
      await api.post("/api/auth/logout")
      window.location.reload()
    } catch {
      setLoggingOut(false)
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  async function addAnotherAccount() {
    try {
      await api.post("/api/auth/logout")
    } catch {
      /* ignore */
    }
    window.location.href = "/?action=add-account"
    window.location.reload()
  }

  const selCls = "w-full"

  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <UserCircle2 className="h-4 w-4 text-primary" /> {t("profile.title")}
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">{t("profile.desc")}</p>

      {/* Switch Account (HelloLeads-style multiple business accounts) */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary/40 p-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <UsersRound className="h-4 w-4 text-primary" /> {t("switch.title")}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {account.businessName || account.name} · {account.email}
          </p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0" onClick={() => setSwitchOpen(true)}>
          {t("switch.open")}
        </Button>
      </div>

      {/* WhatsApp app preference */}
      <div className="mb-4 rounded-xl border p-3">
        <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
          <MessageCircle className="h-4 w-4 text-primary" /> {t("wa.prefTitle")}
        </p>
        <p className="mb-2 text-[11px] text-muted-foreground">{t("wa.prefDesc")}</p>
        <Select value={waPref} onValueChange={(v) => { setWaPrefState(v as WaPref); setWaPref(v as WaPref) }}>
          <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ask">{t("wa.prefAsk")}</SelectItem>
            <SelectItem value="normal">{t("wa.normal")}</SelectItem>
            <SelectItem value="business">{t("wa.business")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Account */}
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("profile.account")}</p>
      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="pf-name" className="text-xs">{t("auth.yourName")}</Label>
          <Input id="pf-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pf-email" className="text-xs">{t("profile.emailReadOnly")}</Label>
          <Input id="pf-email" value={account.email} disabled />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pf-phone" className="text-xs">{t("common.phone")}</Label>
          <Input id="pf-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pf-biz" className="text-xs">{t("auth.orgName")}</Label>
          <Input id="pf-biz" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
        </div>
      </div>

      {/* Business info */}
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("profile.businessInfo")}</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">{t("onboarding.businessType")}</Label>
          <Select value={form.businessType || "none"} onValueChange={(v) => set("businessType", v === "none" ? "" : v)}>
            <SelectTrigger className={selCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-</SelectItem>
              {BUSINESS_TYPES.map((bt) => (
                <SelectItem key={bt} value={bt}>{t(`onboarding.bt.${bt}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("onboarding.categoryTitle")}</Label>
          <Select value={form.businessCategory || "none"} onValueChange={(v) => set("businessCategory", v === "none" ? "" : v)}>
            <SelectTrigger className={selCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-</SelectItem>
              {BUSINESS_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{t(`onboarding.cat.${c}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("onboarding.roleTitle")}</Label>
          <Select value={form.role || "none"} onValueChange={(v) => set("role", v === "none" ? "" : v)}>
            <SelectTrigger className={selCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{t(`onboarding.role.${r}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("onboarding.teamSizeTitle")}</Label>
          <Select value={form.teamSize || "none"} onValueChange={(v) => set("teamSize", v === "none" ? "" : v)}>
            <SelectTrigger className={selCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-</SelectItem>
              {TEAM_SIZES.map((s) => (
                <SelectItem key={s} value={s}>{t(`onboarding.ts.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="pf-web" className="text-xs">{t("onboarding.website")}</Label>
          <Input id="pf-web" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="www.mybusiness.in" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="pf-about" className="text-xs">{t("onboarding.about")}</Label>
          <Textarea
            id="pf-about"
            rows={3}
            maxLength={300}
            value={form.about}
            onChange={(e) => set("about", e.target.value)}
            placeholder={t("profile.personalMsgsHint")}
          />
          <p className="text-end text-[10px] text-muted-foreground">{form.about.length}/300</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
          {t("common.save")}
        </Button>
        <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setLogoutOpen(true)}>
          <LogOut className="me-2 h-4 w-4" /> {t("auth.logout")}
        </Button>
      </div>

      {/* Switch account dialog */}
      <Dialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{t("switch.title")}</DialogTitle>
            <DialogDescription>{t("switch.desc")}</DialogDescription>
          </DialogHeader>
          <div className="nova-scroll max-h-64 space-y-2 overflow-y-auto">
            {vaultAccounts.map((v) => (
              <VaultRow key={v.id} entry={v} currentId={account.id} />
            ))}
          </div>
          <Button variant="outline" className="w-full" onClick={addAnotherAccount}>
            <UsersRound className="me-2 h-4 w-4" /> {t("switch.addAccount")}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">{t("switch.addAccountDesc")}</p>
        </DialogContent>
      </Dialog>

      {/* Logout confirm */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("auth.logout")}</DialogTitle>
            <DialogDescription>{t("auth.logoutConfirm")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setLogoutOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={logout} disabled={loggingOut}>
              {loggingOut && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("auth.logout")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
