"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import en from "./locales/en.json"
import gu from "./locales/gu.json"

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "gu", name: "ગુજરાતી" },
  { code: "hi", name: "हिन्दी" },
  { code: "mr", name: "मराठी" },
  { code: "bn", name: "বাংলা" },
  { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" },
  { code: "kn", name: "ಕನ್ನಡ" },
  { code: "ml", name: "മലയാളം" },
  { code: "pa", name: "ਪੰਜਾਬੀ" },
  { code: "or", name: "ଓଡ଼ିଆ" },
  { code: "as", name: "অসমীয়া" },
  { code: "ur", name: "اردو" },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]["code"]

const STATIC_LOCALES: Record<string, Record<string, unknown>> = { en, gu }

export type TranslationDict = typeof en

type I18nContextType = {
  lang: LanguageCode
  setLang: (lang: LanguageCode) => void
  t: (path: string) => string
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (p) => p,
  isRTL: false,
})

function resolve(dict: Record<string, unknown>, path: string): string {
  const parts = path.split(".")
  let cur: unknown = dict
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return ""
    }
  }
  return typeof cur === "string" ? cur : ""
}

function getNested(obj: Record<string, unknown>, path: string[]): unknown {
  let cur: unknown = obj
  for (const p of path) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p]
    } else return undefined
  }
  return cur
}

function mergeDeep(enObj: Record<string, unknown>, trObj: Record<string, unknown>): Record<string, unknown> {
  // English fallback with translated override - guarantees no missing keys
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(enObj)) {
    const enVal = enObj[key]
    const trVal = trObj ? trObj[key] : undefined
    if (enVal && typeof enVal === "object") {
      out[key] = mergeDeep(enVal as Record<string, unknown>, (trVal && typeof trVal === "object" ? trVal : {}) as Record<string, unknown>)
    } else {
      out[key] = typeof trVal === "string" && trVal.trim() !== "" ? trVal : enVal
    }
  }
  return out
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nova-leads-lang") as LanguageCode | null
      if (saved && LANGUAGES.some((l) => l.code === saved)) return saved
    }
    return "en"
  })
  const [dicts, setDicts] = useState<Record<string, Record<string, unknown>>>(STATIC_LOCALES)

  // Load dictionary for current language when it changes
  useEffect(() => {
    let cancelled = false
    if (dicts[lang]) return
    fetch(`/i18n/${lang}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((data) => {
        if (!cancelled) {
          setDicts((prev) => ({ ...prev, [lang]: data }))
        }
      })
      .catch(() => {
        if (!cancelled) setDicts((prev) => ({ ...prev, [lang]: en }))
      })
    return () => {
      cancelled = true
    }
  }, [lang, dicts])

  const setLang = useCallback((l: LanguageCode) => {
    setLangState(l)
    localStorage.setItem("nova-leads-lang", l)
    document.documentElement.lang = l
    document.documentElement.dir = l === "ur" ? "rtl" : "ltr"
  }, [])

  const t = useCallback(
    (path: string): string => {
      const enDict = STATIC_LOCALES.en
      const activeDict = dicts[lang]
      if (!activeDict || activeDict === enDict) {
        return resolve(enDict, path) || path
      }
      const merged = mergeDeep(enDict, activeDict)
      return resolve(merged, path) || resolve(enDict, path) || path
    },
    [lang, dicts]
  )

  const isRTL = lang === "ur"

  // Set dir on first mount too
  useEffect(() => {
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr"
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
