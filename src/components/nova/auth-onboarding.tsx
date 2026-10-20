"use client"

import React, { useState } from "react"
import { useI18n, LANGUAGES, type LanguageCode } from "@/i18n"
import { toast } from "@/hooks/use-toast"
import { api, type Account } from "./api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles, Target, Building2, Globe, UserCheck, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export const BUSINESS_TYPES = [
  "real_estate", "finance", "digital", "consulting", "it", "manufacturing",
  "retail", "training", "healthcare", "automotive", "business_services",
  "travel", "food", "other",
] as const

export const BUSINESS_CATEGORIES = ["b2b", "b2c", "both"] as const
export const ROLES = ["owner", "sales_manager", "sales_rep", "marketing", "it_ops", "other"] as const
export const TEAM_SIZES = ["just_me", "2_5", "6_15", "16_50", "50_plus"] as const
export const GOALS = ["manage_leads", "generate_leads", "both", "productivity"] as const

type Mode = "auth" | "wizard"

function Brand({ subtitle }: { subtitle?: string }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-xl font-black text-white shadow-lg">
        N
      </div>
      <div>
        <h1 className="text-lg font-bold">{t("app.name")}</h1>
        <p className="text-xs text-muted-foreground">{subtitle || t("app.tagline")}</p>
      </div>
    </div>
  )
}

function LangRow() {
  const { lang, setLang } = useI18n()
  return (
    <div className="nova-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => {
            setLang(l.code as LanguageCode)
            document.documentElement.lang = l.code
            document.documentElement.dir = l.code === "ur" ? "rtl" : "ltr"
          }}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
            lang === l.code ? "border-primary bg-primary/10 text-primary" : "bg-card hover:border-primary/40"
          )}
        >
          {l.name}
        </button>
      ))}
    </div>
  )
}

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-start text-sm font-medium transition-all active:scale-[0.97]",
        selected ? "border-primary bg-primary/10 text-primary" : "bg-card hover:border-primary/40"
      )}
    >
      {children}
    </button>
  )
}

export function AuthOnboarding({
  initialMode,
  account,
  onAuthenticated,
}: {
  initialMode: Mode
  account: Account | null
  onAuthenticated: (a: Account) => void
}) {
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [authTab, setAuthTab] = useState<"login" | "signup">("signup")
  const [busy, setBusy] = useState(false)

  // Auth fields
  const [aName, setAName] = useState("")
  const [aOrg, setAOrg] = useState("")
  const [aEmail, setAEmail] = useState("")
  const [aPhone, setAPhone] = useState("")
  const [aPass, setAPass] = useState("")

  // Wizard answers
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState<string>(account?.goal || "")
  const [bType, setBType] = useState<string>(account?.businessType || "")
  const [bCat, setBCat] = useState<string>(account?.businessCategory || "")
  const [role, setRole] = useState<string>(account?.role || "")
  const [teamSize, setTeamSize] = useState<string>(account?.teamSize || "")
  const [wBusinessName, setWBusinessName] = useState(account?.businessName || "")
  const [wWebsite, setWWebsite] = useState(account?.website || "")
  const [wAbout, setWAbout] = useState(account?.about || "")

  const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  async function submitAuth() {
    setBusy(true)
    try {
      if (authTab === "signup") {
        if (!aName.trim() || !aEmail.trim() || aPass.length < 6) {
          toast({ title: t("common.required"), variant: "destructive" })
          setBusy(false)
          return
        }
        if (!emailOk(aEmail)) {
          toast({ title: t("auth.emailInvalid"), variant: "destructive" })
          setBusy(false)
          return
        }
        const acc = await api.post<Account>("/api/auth/register", {
          name: aName,
          businessName: aOrg,
          email: aEmail,
          phone: aPhone,
          password: aPass,
        })
        setWBusinessName(aOrg)
        setMode("wizard")
        onAuthenticated(acc)
      } else {
        const acc = await api.post<Account>("/api/auth/login", { email: aEmail, password: aPass })
        toast({ title: t("auth.welcomeBack") })
        if (acc.onboardingDone) {
          onAuthenticated(acc)
        } else {
          setWBusinessName(acc.businessName || "")
          setMode("wizard")
          onAuthenticated(acc)
        }
      }
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : t("common.error"), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function finishOnboarding() {
    setBusy(true)
    try {
      const acc = await api.patch<Account>("/api/auth/profile", {
        goal,
        businessType: bType,
        businessCategory: bCat,
        role,
        teamSize,
        businessName: wBusinessName,
        website: wWebsite,
        about: wAbout.slice(0, 300),
        onboardingDone: true,
      })
      // Use the business name as the {business} signature in message templates
      try {
        await api.post("/api/settings", { businessName: wBusinessName })
      } catch {
        /* non-critical */
      }
      toast({ title: t("auth.welcomeBack") })
      onAuthenticated(acc)
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  // ============ AUTH SCREEN (Login / Sign Up) ============
  if (mode === "auth") {
    return (
      <div className="flex min-h-dvh flex-col bg-background px-4 py-8" style={{ maxWidth: "26rem", margin: "0 auto" }}>
        <div className="flex flex-1 flex-col justify-center gap-6">
          <Brand subtitle={t("auth.welcomeDesc")} />
          <LangRow />

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["signup", "login"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setAuthTab(m)}
                className={cn(
                  "rounded-lg py-2 text-sm font-semibold transition-all",
                  authTab === m ? "bg-background shadow-sm" : "text-muted-foreground"
                )}
              >
                {m === "signup" ? t("auth.signup") : t("auth.login")}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {authTab === "signup" ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="auth-name">{t("auth.yourName")} *</Label>
                  <Input id="auth-name" value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Rajesh Patel" autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="auth-org">{t("auth.orgName")}</Label>
                  <Input id="auth-org" value={aOrg} onChange={(e) => setAOrg(e.target.value)} placeholder="Patel Properties" />
                </div>
              </>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="auth-email">{t("auth.businessEmail")} *</Label>
              <Input id="auth-email" type="email" inputMode="email" value={aEmail} onChange={(e) => setAEmail(e.target.value)} placeholder="you@business.com" />
            </div>
            {authTab === "signup" ? (
              <div className="space-y-1.5">
                <Label htmlFor="auth-phone">{t("auth.phone")}</Label>
                <Input id="auth-phone" type="tel" inputMode="tel" value={aPhone} onChange={(e) => setAPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="auth-pass">{t("auth.password")} *</Label>
              <Input
                id="auth-pass"
                type="password"
                value={aPass}
                onChange={(e) => setAPass(e.target.value)}
                placeholder="••••••"
                onKeyDown={(e) => e.key === "Enter" && submitAuth()}
              />
            </div>
            <Button className="w-full" onClick={submitAuth} disabled={busy}>
              {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {authTab === "signup" ? t("auth.createAccount") : t("auth.signIn")}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {authTab === "signup" ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
              <button
                className="font-semibold text-primary underline-offset-2 hover:underline"
                onClick={() => setAuthTab(authTab === "signup" ? "login" : "signup")}
              >
                {authTab === "signup" ? t("auth.login") : t("auth.signup")}
              </button>
            </p>
          </div>
        </div>
        <p className="mt-6 text-center text-[10px] text-muted-foreground">
          {t("settings.version")} 1.0.0 · {t("settings.madeInIndia")}
        </p>
      </div>
    )
  }

  // ============ ONBOARDING WIZARD (4 steps, HelloLeads style) ============
  const TOTAL = 4
  return (
    <div className="flex min-h-dvh flex-col bg-background px-4 py-8" style={{ maxWidth: "32rem", margin: "0 auto" }}>
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("onboarding.stepOf").replace("{n}", String(step)).replace("{total}", String(TOTAL))}</span>
          <button
            className="font-medium text-primary hover:underline"
            onClick={finishOnboarding}
            disabled={busy}
          >
            {t("onboarding.skip")}
          </button>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              className={cn("h-1.5 flex-1 rounded-full", i < step ? "bg-primary" : "bg-muted")}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {/* STEP 1: Goal */}
        {step === 1 && (
          <div className="space-y-4 nova-anim">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">{t("onboarding.goalTitle")}</h2>
            </div>
            <p className="text-xs text-muted-foreground">{t("onboarding.goalDesc")}</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {GOALS.map((g) => (
                <OptionCard key={g} selected={goal === g} onClick={() => setGoal(g)}>
                  {t(`onboarding.goal.${g}`)}
                </OptionCard>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Business type (14 options like HelloLeads) */}
        {step === 2 && (
          <div className="space-y-4 nova-anim">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">{t("onboarding.businessTypeTitle")}</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BUSINESS_TYPES.map((bt) => (
                <OptionCard key={bt} selected={bType === bt} onClick={() => setBType(bt)}>
                  {t(`onboarding.bt.${bt}`)}
                </OptionCard>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Category + Role + Team size */}
        {step === 3 && (
          <div className="space-y-5 nova-anim">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">{t("onboarding.categoryTitle")}</h2>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{t("onboarding.categoryTitle")}</Label>
              <div className="flex gap-2">
                {BUSINESS_CATEGORIES.map((c) => (
                  <OptionCard key={c} selected={bCat === c} onClick={() => setBCat(c)}>
                    {t(`onboarding.cat.${c}`)}
                  </OptionCard>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{t("onboarding.roleTitle")}</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ROLES.map((r) => (
                  <OptionCard key={r} selected={role === r} onClick={() => setRole(r)}>
                    {t(`onboarding.role.${r}`)}
                  </OptionCard>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">{t("onboarding.teamSizeTitle")}</Label>
              <div className="flex flex-wrap gap-2">
                {TEAM_SIZES.map((s) => (
                  <OptionCard key={s} selected={teamSize === s} onClick={() => setTeamSize(s)}>
                    {t(`onboarding.ts.${s}`)}
                  </OptionCard>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: About / business info */}
        {step === 4 && (
          <div className="space-y-4 nova-anim">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">{t("onboarding.aboutTitle")}</h2>
            </div>
            <p className="text-xs text-muted-foreground">{t("onboarding.aboutDesc")}</p>
            <div className="space-y-1.5">
              <Label htmlFor="wz-biz">{t("auth.orgName")}</Label>
              <Input id="wz-biz" value={wBusinessName} onChange={(e) => setWBusinessName(e.target.value)} placeholder="Patel Properties" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wz-web">{t("onboarding.website")}</Label>
              <Input id="wz-web" value={wWebsite} onChange={(e) => setWWebsite(e.target.value)} placeholder="www.mybusiness.in" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wz-about">{t("onboarding.about")}</Label>
              <Textarea
                id="wz-about"
                rows={4}
                maxLength={300}
                value={wAbout}
                onChange={(e) => setWAbout(e.target.value)}
                placeholder={t("profile.personalMsgsHint")}
              />
              <p className="text-end text-[10px] text-muted-foreground">{wAbout.length}/300</p>
            </div>
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {t("onboarding.businessType")}: {bType ? t(`onboarding.bt.${bType}`) : "-"}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {t("profile.desc")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="mt-6 flex gap-2.5">
        {step > 1 && (
          <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)} disabled={busy}>
            <ArrowLeft className="me-1 h-4 w-4" /> {t("common.back")}
          </Button>
        )}
        {step < TOTAL ? (
          <Button className="flex-1" onClick={() => setStep(step + 1)}>
            {t("common.next")} <ArrowRight className="ms-1 h-4 w-4" />
          </Button>
        ) : (
          <Button className="flex-1" onClick={finishOnboarding} disabled={busy}>
            {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("onboarding.getStarted")}
          </Button>
        )}
      </div>
    </div>
  )
}
