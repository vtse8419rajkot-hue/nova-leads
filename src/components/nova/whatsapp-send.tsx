"use client"

/**
 * WhatsApp send with Business / Normal app choice (HelloLeads-style).
 *
 * On Android, `intent://` URLs can explicitly target:
 *   - com.whatsapp      (WhatsApp)
 *   - com.whatsapp.w4b  (WhatsApp Business)
 * with a wa.me browser fallback if the app is missing.
 * On iOS/desktop we open the universal wa.me click-to-chat link.
 *
 * Preference is stored per device: "ask" | "business" | "normal".
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { MessageCircle, Building2, HelpCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"

export type WaPref = "ask" | "business" | "normal"

const LS_KEY = "nova-wa-app"

export function getWaPref(): WaPref {
  try {
    const v = localStorage.getItem(LS_KEY)
    if (v === "business" || v === "normal") return v
  } catch {
    /* ignore */
  }
  return "ask"
}

export function setWaPref(p: WaPref) {
  try {
    if (p === "ask") localStorage.removeItem(LS_KEY)
    else localStorage.setItem(LS_KEY, p)
  } catch {
    /* ignore */
  }
}

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false
  return /android/i.test(navigator.userAgent)
}

/** Normalize to 91XXXXXXXXXX (India default, keeps + if present) */
export function waNumber(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "")
  if (digits.length === 10) return `91${digits}`
  return digits
}

function openWaApp(phone: string, text: string, app: "business" | "normal") {
  const enc = encodeURIComponent(text || "")
  const num = waNumber(phone)
  const waMe = `https://wa.me/${num}${text ? `?text=${enc}` : ""}`
  if (isAndroid()) {
    const pkg = app === "business" ? "com.whatsapp.w4b" : "com.whatsapp"
    const intent = `intent://send/${num}#Intent;scheme=whatsapp;package=${pkg};S.text=${enc};S.browser_fallback_url=${encodeURIComponent(waMe)};end`
    window.location.href = intent
  } else {
    window.open(waMe, "_blank")
  }
}

interface WaRequest {
  phone: string
  text: string
  onSent?: () => void
}

interface WaCtx {
  send: (phone: string, text: string, onSent?: () => void) => void
}

const WhatsAppContext = createContext<WaCtx>({ send: () => {} })

export function useWhatsApp(): WaCtx {
  return useContext(WhatsAppContext)
}

export function WhatsAppProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const [req, setReq] = useState<WaRequest | null>(null)

  const send = useCallback((phone: string, text: string, onSent?: () => void) => {
    const pref = getWaPref()
    if (pref === "ask") {
      setReq({ phone, text, onSent })
    } else {
      openWaApp(phone, text, pref)
      onSent?.()
    }
  }, [])

  const choose = useCallback(
    (app: "business" | "normal", remember: boolean) => {
      if (remember) setWaPref(app)
      if (req) {
        openWaApp(req.phone, req.text, app)
        req.onSent?.()
      }
      setReq(null)
    },
    [req]
  )

  return (
    <WhatsAppContext.Provider value={{ send }}>
      {children}
      <Dialog open={!!req} onOpenChange={(o) => !o && setReq(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4 text-primary" /> {t("wa.title")}
            </DialogTitle>
          </DialogHeader>
          <p className="-mt-1 text-xs text-muted-foreground">{t("wa.desc")}</p>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => choose("business", false)}
              className="flex items-center gap-3 rounded-xl border p-3.5 text-start transition-all hover:border-primary/50 active:scale-[0.98]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{t("wa.business")}</span>
                <span className="block text-[11px] text-muted-foreground">{t("wa.businessDesc")}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => choose("normal", false)}
              className="flex items-center gap-3 rounded-xl border p-3.5 text-start transition-all hover:border-primary/50 active:scale-[0.98]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{t("wa.normal")}</span>
                <span className="block text-[11px] text-muted-foreground">{t("wa.normalDesc")}</span>
              </span>
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HelpCircle className="h-3.5 w-3.5" /> {t("wa.always")}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => choose("normal", true)}
                className={cn("rounded-lg border bg-card px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:border-primary/50")}
              >
                {t("wa.normalShort")}
              </button>
              <button
                type="button"
                onClick={() => choose("business", true)}
                className={cn("rounded-lg border bg-card px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:border-primary/50")}
              >
                {t("wa.businessShort")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </WhatsAppContext.Provider>
  )
}

/** One-tap helper when no text is involved (quick action circles) */
export function WhatsAppQuickSend({
  phone,
  text,
  onSent,
  className,
  children,
}: {
  phone: string
  text?: string
  onSent?: () => void
  className?: string
  children: React.ReactNode
}) {
  const { send } = useWhatsApp()
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        send(phone, text || "", onSent)
      }}
    >
      {children}
    </button>
  )
}
