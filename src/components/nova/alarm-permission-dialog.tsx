"use client"

import React, { useState } from "react"
import { useI18n } from "@/i18n"
import { useAlarm } from "@/hooks/use-alarm-engine"
import { BellRing, ShieldCheck, TriangleAlert, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/**
 * First-open onboarding: asks for alarm/notification/sound/vibration permission.
 * Shows on every app open until granted (re-asks 12h after "Not now").
 */
export function AlarmPermissionDialog() {
  const { t } = useI18n()
  const { askOpen, dismissAsk, requestPermission, permission } = useAlarm()
  const [loading, setLoading] = useState(false)
  const [askDenied, setAskDenied] = useState(false)

  const denied = permission === "denied" || askDenied
  const open = askOpen

  const enable = async () => {
    setLoading(true)
    try {
      const ok = await requestPermission()
      if (!ok) setAskDenied(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismissAsk()}>
      <DialogContent className="max-w-[92vw] rounded-2xl p-0 sm:max-w-md">
        <DialogTitle className="sr-only">{t("alarm.permission.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("alarm.permission.desc")}</DialogDescription>
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-emerald-500/20 to-transparent" />
          <div className="relative px-6 pb-6 pt-7 text-center">
            <div className="relative mx-auto mb-4 h-20 w-20">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/25" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 text-white shadow-xl shadow-emerald-600/30">
                <BellRing className="h-10 w-10" />
              </div>
            </div>

            {denied ? (
              <>
                <h2 className="flex items-center justify-center gap-2 text-lg font-bold text-destructive">
                  <TriangleAlert className="h-5 w-5" />
                  {t("alarm.permission.blockedTitle")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("alarm.permission.blockedDesc")}
                </p>
                <Button className="mt-5 w-full" onClick={dismissAsk}>
                  {t("common.confirm")}
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold">{t("alarm.permission.title")}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("alarm.permission.desc")}
                </p>

                <div className="mt-4 flex items-start gap-2.5 rounded-xl border bg-muted/50 p-3 text-start">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold">{t("alarm.permission.whyTitle")}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {t("alarm.permission.whyDesc")}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={dismissAsk} disabled={loading}>
                    {t("alarm.permission.later")}
                  </Button>
                  <Button className="flex-1" onClick={() => void enable()} disabled={loading}>
                    {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    {t("alarm.permission.enable")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
