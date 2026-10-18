"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useI18n, type LanguageCode } from "@/i18n"
import { api, type Lead, type TeamMember } from "./api"
import { DashboardView } from "./dashboard-view"
import { LeadsView } from "./leads-view"
import { PipelineView } from "./pipeline-view"
import { TasksView } from "./tasks-view"
import { QuotesView } from "./quotes-view"
import { ContactsView } from "./contacts-view"
import { ProductsView } from "./products-view"
import { TeamView } from "./team-view"
import { ReportsView } from "./reports-view"
import { SettingsView } from "./settings-view"
import { LeadForm } from "./lead-form"
import { LeadDetail } from "./lead-detail"
import { AlarmOverlay } from "./alarm-overlay"
import { AlarmPermissionDialog } from "./alarm-permission-dialog"
import { AlarmProvider } from "@/hooks/use-alarm-engine"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard, Users, KanbanSquare, ClipboardList, Receipt,
  Contact, Package, UsersRound, BarChart3, Settings, MoreHorizontal, Plus, WifiOff, Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LANGUAGES } from "@/i18n"

type Tab = "dashboard" | "leads" | "pipeline" | "tasks" | "quotes" | "contacts" | "products" | "team" | "reports" | "settings"

const BOTTOM_TABS: { key: Tab; icon: React.ReactNode; labelKey: string }[] = [
  { key: "dashboard", icon: <LayoutDashboard className="h-5 w-5" />, labelKey: "nav.dashboard" },
  { key: "leads", icon: <Users className="h-5 w-5" />, labelKey: "nav.leads" },
  { key: "pipeline", icon: <KanbanSquare className="h-5 w-5" />, labelKey: "nav.pipeline" },
  { key: "tasks", icon: <ClipboardList className="h-5 w-5" />, labelKey: "nav.tasks" },
]

const MORE_ITEMS: { key: Tab; icon: React.ReactNode; labelKey: string }[] = [
  { key: "quotes", icon: <Receipt className="h-5 w-5" />, labelKey: "nav.quotes" },
  { key: "contacts", icon: <Contact className="h-5 w-5" />, labelKey: "nav.contacts" },
  { key: "products", icon: <Package className="h-5 w-5" />, labelKey: "nav.products" },
  { key: "team", icon: <UsersRound className="h-5 w-5" />, labelKey: "nav.team" },
  { key: "reports", icon: <BarChart3 className="h-5 w-5" />, labelKey: "nav.reports" },
  { key: "settings", icon: <Settings className="h-5 w-5" />, labelKey: "nav.settings" },
]

function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
  }, [])
  return null
}

function OfflineBanner() {
  const { t } = useI18n()
  const [offline, setOffline] = useState(() => (typeof navigator !== "undefined" ? !navigator.onLine : false))
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])
  if (!offline) return null
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500/95 px-4 py-1.5 text-[11px] font-medium text-white">
      <WifiOff className="h-3.5 w-3.5" />
      {t("settings.youAreOffline")}
    </div>
  )
}

function LanguagePicker() {
  const { lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find((l) => l.code === lang)
  return (
    <>
      <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2.5" onClick={() => setOpen(true)}>
        <Globe className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">{current?.name}</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-safe pt-4">
          <SheetHeader className="p-0">
            <SheetTitle className="mb-3 text-start">🌐 Language / ભાષા / भाषा</SheetTitle>
          </SheetHeader>
          <div className="nova-scroll mb-4 grid max-h-[50dvh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code as LanguageCode)
                  setOpen(false)
                }}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm font-medium transition-all active:scale-[0.97]",
                  lang === l.code ? "border-primary bg-primary/10 text-primary" : "bg-card hover:border-primary/40"
                )}
              >
                {l.name}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function NovaApp() {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const t = new URLSearchParams(window.location.search).get("tab")
      if (t) return t as Tab
    }
    return "dashboard"
  })
  const [moreOpen, setMoreOpen] = useState(false)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [leadFormOpen, setLeadFormOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("action") === "add-lead"
    }
    return false
  })
  const [openLeadId, setOpenLeadId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("lead")
    }
    return null
  })
  const [quotePrefill, setQuotePrefill] = useState<Lead | null>(null)
  const [dataChanged, setDataChanged] = useState(0)

  // Alarm notification tap -> open the lead directly
  useEffect(() => {
    const onOpenLead = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      if (id) {
        setTab("leads")
        setOpenLeadId(id)
      }
    }
    window.addEventListener("nova:open-lead", onOpenLead)
    return () => window.removeEventListener("nova:open-lead", onOpenLead)
  }, [])

  const loadMembers = useCallback(async () => {
    try {
      const m = await api.get<TeamMember[]>("/api/team")
      setMembers(m)
    } catch {
      setMembers([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    api
      .get<TeamMember[]>("/api/team")
      .then((m) => {
        if (!cancelled) setMembers(m)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [dataChanged])

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const onGoTo = useCallback((nextTab: string) => setTab(nextTab as Tab), [])

  const openLeadAndRefresh = useCallback((id: string) => {
    setOpenLeadId(id)
  }, [])

  const createQuoteFromLead = useCallback(async (lead: Lead) => {
    setOpenLeadId(null)
    try {
      const fresh = await api.get<Lead>(`/api/leads/${lead.id}`)
      setQuotePrefill(fresh)
    } catch {
      setQuotePrefill(lead)
    }
    setTab("quotes")
  }, [])

  const titleKeys: Record<Tab, string> = {
    dashboard: "nav.dashboard",
    leads: "nav.leads",
    pipeline: "nav.pipeline",
    tasks: "nav.tasks",
    quotes: "nav.quotes",
    contacts: "nav.contacts",
    products: "nav.products",
    team: "nav.team",
    reports: "nav.reports",
    settings: "nav.settings",
  }

  return (
    <AlarmProvider>
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col bg-background">
      <SWRegister />
      <OfflineBanner />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-lg pt-safe">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-black text-white shadow-md">
              N
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">{t("app.name")}</h1>
              <p className="text-[10px] leading-tight text-muted-foreground">{t("app.tagline")}</p>
            </div>
          </div>
          <LanguagePicker />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-28 pt-3">
        {tab === "dashboard" && (
          <DashboardView
            members={members}
            onOpenLead={openLeadAndRefresh}
            onGoTo={onGoTo}
            onAddLead={() => setLeadFormOpen(true)}
            refreshKey={refreshKey}
          />
        )}
        {tab === "leads" && (
          <LeadsView members={members} onOpenLead={openLeadAndRefresh} onAddLead={() => setLeadFormOpen(true)} refreshKey={refreshKey} />
        )}
        {tab === "pipeline" && (
          <PipelineView members={members} onOpenLead={openLeadAndRefresh} refreshKey={refreshKey} />
        )}
        {tab === "tasks" && (
          <TasksView refreshKey={refreshKey} onChanged={refresh} onOpenLead={openLeadAndRefresh} />
        )}
        {tab === "quotes" && (
          <QuotesView
            refreshKey={refreshKey}
            onChanged={refresh}
            prefillLead={quotePrefill}
            onPrefillConsumed={() => setQuotePrefill(null)}
          />
        )}
        {tab === "contacts" && <ContactsView refreshKey={refreshKey} />}
        {tab === "products" && <ProductsView refreshKey={refreshKey} />}
        {tab === "team" && <TeamView refreshKey={refreshKey} />}
        {tab === "reports" && <ReportsView refreshKey={refreshKey} />}
        {tab === "settings" && <SettingsView />}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-lg pb-safe" aria-label="Main navigation">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 py-1.5">
          {BOTTOM_TABS.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                "flex min-w-[56px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors",
                tab === item.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={tab === item.key ? "page" : undefined}
            >
              {item.icon}
              <span className="text-[9.5px] font-medium">{t(item.labelKey)}</span>
            </button>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-w-[56px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors",
              MORE_ITEMS.some((m) => m.key === tab) ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[9.5px] font-medium">{t("nav.more")}</span>
          </button>
        </div>
      </nav>

      {/* Floating add button */}
      {(tab === "leads" || tab === "dashboard" || tab === "pipeline") && (
        <Button
          size="icon"
          className="fixed bottom-20 end-4 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl transition-transform hover:scale-105 active:scale-95 sm:end-[max(1rem,calc(50%-20rem))]"

          onClick={() => setLeadFormOpen(true)}
          aria-label={t("leads.addLead")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* More sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-safe pt-4">
          <SheetHeader className="p-0">
            <SheetTitle className="mb-3 text-start">{t("nav.more")}</SheetTitle>
          </SheetHeader>
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            {MORE_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setTab(item.key)
                  setMoreOpen(false)
                }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-medium transition-all active:scale-[0.97]",
                  tab === item.key ? "border-primary bg-primary/10 text-primary" : "bg-card hover:border-primary/40"
                )}
              >
                {item.icon}
                {t(item.labelKey)}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Lead form */}
      <LeadForm
        open={leadFormOpen}
        onOpenChange={setLeadFormOpen}
        members={members}
        onSaved={() => {
          refresh()
          setDataChanged((d) => d + 1)
        }}
      />

      {/* Lead detail */}
      <LeadDetail
        leadId={openLeadId}
        open={!!openLeadId}
        onOpenChange={(v) => !v && setOpenLeadId(null)}
        members={members}
        onChanged={() => {
          refresh()
          setDataChanged((d) => d + 1)
        }}
        onCreateQuote={createQuoteFromLead}
      />

      {/* Alarm system: full-screen alarm + first-open permission ask */}
      <AlarmOverlay />
      <AlarmPermissionDialog />
    </div>
    </AlarmProvider>
  )
}
