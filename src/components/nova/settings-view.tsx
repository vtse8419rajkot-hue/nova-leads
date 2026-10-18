"use client"

import React, { useEffect, useState } from "react"
import { useI18n, LANGUAGES, type LanguageCode } from "@/i18n"
import { toast } from "@/hooks/use-toast"
import { api } from "./api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Globe, Moon, Sun, Monitor, Download, Database, Trash2, Info,
  Smartphone, WifiOff, Loader2, DownloadCloud, Store,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { AlarmSettingsCard } from "./alarm-settings-card"

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function SettingsView() {
  const { t, lang, setLang } = useI18n()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)
  const [clearLoading, setClearLoading] = useState(false)
  const [businessName, setBusinessName] = useState("")

  useEffect(() => {
    setMounted(true)
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    // iOS standalone check
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true
    setIsInstalled(standalone)
    api.get<Record<string, string>>("/api/settings").then((s) => setBusinessName(s.businessName || "")).catch(() => {})
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  async function saveBusinessName(v: string) {
    setBusinessName(v)
    try {
      await api.post("/api/settings", { businessName: v })
    } catch {
      // silent
    }
  }

  async function installApp() {
    if (!installEvt) return
    await installEvt.prompt()
    const choice = await installEvt.userChoice
    if (choice.outcome === "accepted") {
      setIsInstalled(true)
      toast({ title: t("settings.installed") })
    }
    setInstallEvt(null)
  }

  async function seedDemo() {
    setSeedLoading(true)
    try {
      await api.post("/api/seed")
      toast({ title: t("common.saved") })
      window.location.reload()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setSeedLoading(false)
    }
  }

  async function clearAll() {
    setClearLoading(true)
    try {
      await api.post("/api/clear")
      toast({ title: t("common.deleted") })
      setClearOpen(false)
      window.location.reload()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setClearLoading(false)
    }
  }

  const themeOptions = [
    { v: "light", label: t("settings.themeLight"), icon: <Sun className="h-4 w-4" /> },
    { v: "dark", label: t("settings.themeDark"), icon: <Moon className="h-4 w-4" /> },
    { v: "system", label: t("settings.themeSystem"), icon: <Monitor className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-5 nova-anim">
      {/* Language */}
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Globe className="h-4 w-4 text-primary" /> {t("settings.language")}
        </h3>
        <p className="mb-2.5 text-xs text-muted-foreground">{t("settings.languageDesc")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code as LanguageCode)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.97]",
                lang === l.code
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-card hover:border-primary/40"
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
      </section>

      {/* Appearance */}
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Moon className="h-4 w-4 text-primary" /> {t("settings.appearance")}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((o) => (
            <button
              key={o.v}
              onClick={() => setTheme(o.v)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-all active:scale-[0.97]",
                mounted && theme === o.v ? "border-primary bg-primary/10 text-primary" : "bg-card hover:border-primary/40"
              )}
            >
              {o.icon}
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* Alarms & Notifications */}
      <AlarmSettingsCard />

      {/* Business name */}
      <section>
        <h3 className="mb-2 text-sm font-semibold">{t("settings.businessName")}</h3>
        <p className="mb-2.5 text-xs text-muted-foreground">{t("settings.businessNameDesc")}</p>
        <Input value={businessName} onChange={(e) => saveBusinessName(e.target.value)} placeholder="My Business" />
      </section>

      {/* Install */}
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Smartphone className="h-4 w-4 text-primary" /> {t("settings.installApp")}
        </h3>
        {isInstalled ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            <Store className="h-4 w-4" /> {t("settings.installed")}
          </div>
        ) : installEvt ? (
          <Button className="w-full" onClick={installApp}>
            <Download className="me-2 h-4 w-4" /> {t("install.prompt")}
          </Button>
        ) : (
          <div className="rounded-xl border bg-card p-3.5 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <DownloadCloud className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {t("install.ios")}
            </p>
            <p className="mt-1.5 ps-6">{t("settings.installAppDesc")}</p>
          </div>
        )}
        <div className="mt-2 flex items-center gap-2 rounded-xl border bg-card p-3 text-xs text-muted-foreground">
          <WifiOff className="h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground">{t("settings.offlineReady")}</p>
            <p>{t("settings.offlineReadyDesc")}</p>
          </div>
        </div>
      </section>

      {/* Data management */}
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Database className="h-4 w-4 text-primary" /> {t("settings.dataManagement")}
        </h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <a href="/api/export/leads" download className="block">
              <Button variant="outline" className="w-full">
                <Download className="me-2 h-4 w-4" /> {t("settings.exportLeads")}
              </Button>
            </a>
            <a href="/api/export/contacts" download className="block">
              <Button variant="outline" className="w-full">
                <Download className="me-2 h-4 w-4" /> {t("settings.exportContacts")}
              </Button>
            </a>
          </div>
          <div className="rounded-xl border bg-card p-3.5">
            <p className="text-sm font-medium">{t("settings.seedDemoData")}</p>
            <p className="mb-2.5 text-xs text-muted-foreground">{t("settings.seedDemoDataDesc")}</p>
            <Button size="sm" variant="outline" onClick={seedDemo} disabled={seedLoading}>
              {seedLoading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Database className="me-2 h-4 w-4" />}
              {t("settings.seedDemoData")}
            </Button>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5">
            <p className="text-sm font-medium text-destructive">{t("settings.clearData")}</p>
            <p className="mb-2.5 text-xs text-muted-foreground">{t("settings.clearDataDesc")}</p>
            <Button size="sm" variant="destructive" onClick={() => setClearOpen(true)}>
              <Trash2 className="me-2 h-4 w-4" /> {t("settings.clearData")}
            </Button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="rounded-xl border bg-card p-4 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-xl font-black text-primary">
          N
        </div>
        <p className="text-sm font-bold">{t("app.name")}</p>
        <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
        <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3" />
          {t("settings.version")} 1.0.0 · {t("settings.madeInIndia")}
        </div>
      </section>

      {/* Clear confirm dialog */}
      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">{t("settings.clearData")}</DialogTitle>
            <DialogDescription>{t("settings.clearDataConfirm")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setClearOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={clearAll} disabled={clearLoading}>
              {clearLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("common.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
