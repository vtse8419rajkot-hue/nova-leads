"use client"

import React, { useRef, useState } from "react"
import { useI18n } from "@/i18n"
import { useAlarm } from "@/hooks/use-alarm-engine"
import { ALARM_SOUNDS } from "@/lib/alarm-sounds"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  BellRing, Play, Square, Vibrate, Volume2, FlaskConical, TriangleAlert, CheckCircle2,
} from "lucide-react"

export function AlarmSettingsCard() {
  const { t } = useI18n()
  const { permission, settings, saveSettings, requestPermission, testAlarm, previewSound } = useAlarm()
  const [playingId, setPlayingId] = useState<string | null>(null)
  const stopPreviewRef = useRef<(() => void) | null>(null)

  const preview = (id: string) => {
    stopPreviewRef.current?.()
    setPlayingId(id)
    stopPreviewRef.current = previewSound(id)
    window.setTimeout(() => setPlayingId((cur) => (cur === id ? null : cur)), 3200)
  }

  const onTest = () => {
    testAlarm()
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }

  const permChip =
    permission === "granted"
      ? { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: t("alarm.grantedFull"), cls: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" }
      : permission === "denied"
        ? { icon: <TriangleAlert className="h-3.5 w-3.5" />, text: t("alarm.deniedFull"), cls: "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" }
        : { icon: <BellRing className="h-3.5 w-3.5" />, text: t("alarm.defaultFull"), cls: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300" }

  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <BellRing className="h-4 w-4 text-primary" /> {t("alarm.title")}
      </h3>
      <p className="mb-2.5 text-xs text-muted-foreground">{t("alarm.desc")}</p>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        {/* status chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", permChip.cls)}>
            {permChip.icon} {permChip.text}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
              settings.soundOn
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            )}
          >
            <Volume2 className="h-3.5 w-3.5" /> {settings.soundOn ? t("alarm.on") : t("alarm.soundOff")}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
              settings.vibrationOn
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            )}
          >
            <Vibrate className="h-3.5 w-3.5" /> {t("alarm.vibration")} {settings.vibrationOn ? t("alarm.on") : t("alarm.off")}
          </span>
        </div>

        {/* enable permission */}
        {permission !== "granted" && (
          <div>
            <Button
              onClick={() =>
                void requestPermission().then((ok) => {
                  if (ok) toast({ title: t("alarm.permission.granted") })
                  else toast({ title: t("alarm.permission.blockedTitle"), variant: "destructive" })
                })
              }
              size="sm"
            >
              <BellRing className="me-2 h-4 w-4" />
              {permission === "denied" ? t("alarm.permission.openSettings") : t("alarm.permission.enable")}
            </Button>
            {permission === "denied" && (
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                {t("alarm.permission.blockedDesc")}
              </p>
            )}
          </div>
        )}

        {/* sound picker */}
        <div>
          <p className="mb-1 text-xs font-semibold">{t("alarm.sound")}</p>
          <p className="mb-2 text-[11px] text-muted-foreground">{t("alarm.soundDesc")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ALARM_SOUNDS.map((s) => {
              const selected = settings.soundId === s.id
              return (
                <div
                  key={s.id}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all active:scale-[0.97]",
                    selected ? "border-primary bg-primary/10 text-primary" : "bg-card hover:border-primary/40"
                  )}
                >
                  <button
                    className="flex w-full flex-col items-center gap-1"
                    onClick={() => {
                      saveSettings({ soundId: s.id })
                      preview(s.id)
                    }}
                    aria-pressed={selected}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <span className="text-[11px] font-semibold leading-tight">{t(s.nameKey)}</span>
                    {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-foreground/60 transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      preview(s.id)
                    }}
                    aria-label={`${t("alarm.preview")}: ${t(s.nameKey)}`}
                  >
                    {playingId === s.id ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* volume */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <Volume2 className="h-3.5 w-3.5" /> {t("alarm.volume")}
            </p>
            <span className="text-xs font-medium text-muted-foreground">{Math.round(settings.volume * 100)}%</span>
          </div>
          <Slider
            value={[settings.volume]}
            min={0.1}
            max={1}
            step={0.05}
            onValueChange={(v) => saveSettings({ volume: v[0] ?? settings.volume })}
          />
        </div>

        {/* vibration */}
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <Vibrate className="h-3.5 w-3.5" /> {t("alarm.vibration")}
            </p>
            <p className="text-[11px] text-muted-foreground">{t("alarm.vibrationDesc")}</p>
          </div>
          <Switch checked={settings.vibrationOn} onCheckedChange={(v) => saveSettings({ vibrationOn: v })} />
        </div>

        {/* sound on/off */}
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <BellRing className="h-3.5 w-3.5" /> {t("alarm.sound")}
            </p>
            <p className="text-[11px] text-muted-foreground">{t("alarm.soundDesc")}</p>
          </div>
          <Switch checked={settings.soundOn} onCheckedChange={(v) => saveSettings({ soundOn: v })} />
        </div>

        {/* lead time */}
        <div>
          <p className="mb-1.5 text-xs font-semibold">{t("alarm.leadTime")}</p>
          <Select
            value={String(settings.leadMinutes)}
            onValueChange={(v) => saveSettings({ leadMinutes: Number(v) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t("alarm.leadTimeOnTime")}</SelectItem>
              <SelectItem value="5">{t("alarm.leadTime5")}</SelectItem>
              <SelectItem value="10">{t("alarm.leadTime10")}</SelectItem>
              <SelectItem value="15">{t("alarm.leadTime15")}</SelectItem>
              <SelectItem value="30">{t("alarm.leadTime30")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* test alarm */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-sm font-semibold">{t("alarm.test")}</p>
          <p className="mb-2.5 text-xs text-muted-foreground">{t("alarm.testDesc")}</p>
          <Button size="sm" onClick={onTest}>
            <FlaskConical className="me-2 h-4 w-4" />
            {t("alarm.test")}
          </Button>
        </div>
      </div>
    </section>
  )
}
