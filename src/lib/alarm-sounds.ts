"use client"

// Nova Leads - Synthesized alarm tones via Web Audio API
// No audio files needed - every tone is generated in real time,
// works fully offline and costs zero bytes of storage.

export interface AlarmSoundDef {
  id: string
  nameKey: string
  emoji: string
}

export const ALARM_SOUNDS: AlarmSoundDef[] = [
  { id: "beep", nameKey: "alarm.soundNames.beep", emoji: "📟" },
  { id: "radar", nameKey: "alarm.soundNames.radar", emoji: "📡" },
  { id: "chime", nameKey: "alarm.soundNames.chime", emoji: "🔔" },
  { id: "siren", nameKey: "alarm.soundNames.siren", emoji: "🚨" },
  { id: "marimba", nameKey: "alarm.soundNames.marimba", emoji: "🎵" },
  { id: "dhol", nameKey: "alarm.soundNames.dhol", emoji: "🥁" },
  { id: "temple", nameKey: "alarm.soundNames.temple", emoji: "🛕" },
  { id: "birds", nameKey: "alarm.soundNames.birds", emoji: "🐦" },
]

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
  }
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

/** Call once on the first user gesture so a timer-driven alarm is allowed to play later */
export function unlockAudio() {
  try {
    getCtx()
  } catch {
    // audio unsupported
  }
}

let noiseBuf: AudioBuffer | null = null
function noise(): AudioBuffer {
  const a = getCtx()
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, Math.floor(a.sampleRate * 0.5), a.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuf
}

type PatternFn = (a: AudioContext, out: GainNode, t0: number) => number

function tone(
  a: AudioContext,
  out: GainNode,
  t: number,
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  sweepTo?: number
) {
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(Math.max(20, freq), t)
  if (sweepTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g)
  g.connect(out)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function slap(a: AudioContext, out: GainNode, t: number, freq: number, vol: number, dur = 0.08) {
  const s = a.createBufferSource()
  const bp = a.createBiquadFilter()
  const g = a.createGain()
  s.buffer = noise()
  bp.type = "bandpass"
  bp.frequency.value = freq
  bp.Q.value = 1.1
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  s.connect(bp)
  bp.connect(g)
  g.connect(out)
  s.start(t)
  s.stop(t + dur + 0.05)
}

const PATTERNS: Record<string, PatternFn> = {
  // 📟 Classic dual-tone beep-beep-beep
  beep: (a, out, t0) => {
    for (let i = 0; i < 3; i++) {
      tone(a, out, t0 + i * 0.32, 880, 0.16, "square", 0.4)
      tone(a, out, t0 + i * 0.32, 1760, 0.16, "square", 0.1)
    }
    return 1.2
  },
  // 📡 Rising radar sweep (double chirp)
  radar: (a, out, t0) => {
    tone(a, out, t0, 500, 0.55, "sine", 0.55, 1150)
    tone(a, out, t0 + 0.7, 500, 0.55, "sine", 0.4, 1150)
    return 1.6
  },
  // 🔔 Gentle crystal bell arpeggio
  chime: (a, out, t0) => {
    const notes = [659.25, 783.99, 987.77, 1318.5]
    notes.forEach((f, i) => {
      tone(a, out, t0 + i * 0.22, f, 0.9, "sine", 0.42)
      tone(a, out, t0 + i * 0.22, f * 2, 0.5, "sine", 0.07)
    })
    return 2.2
  },
  // 🚨 Emergency siren wail
  siren: (a, out, t0) => {
    const o = a.createOscillator()
    const g = a.createGain()
    o.type = "sawtooth"
    o.frequency.setValueAtTime(600, t0)
    o.frequency.linearRampToValueAtTime(1250, t0 + 0.6)
    o.frequency.linearRampToValueAtTime(600, t0 + 1.2)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.05)
    g.gain.setValueAtTime(0.4, t0 + 1.1)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.25)
    o.connect(g)
    g.connect(out)
    o.start(t0)
    o.stop(t0 + 1.3)
    return 1.4
  },
  // 🎵 Marimba wooden melody
  marimba: (a, out, t0) => {
    const seq: [number, number][] = [
      [523.25, 0],
      [659.25, 0.15],
      [783.99, 0.3],
      [1046.5, 0.45],
      [783.99, 0.6],
      [659.25, 0.75],
    ]
    seq.forEach(([f, dt]) => {
      tone(a, out, t0 + dt, f, 0.35, "triangle", 0.5)
      tone(a, out, t0 + dt, f * 4, 0.08, "sine", 0.05)
    })
    return 1.5
  },
  // 🥁 Indian dhol groove - dha dha dhin tak
  dhol: (a, out, t0) => {
    const hits: [number, number][] = [
      [0, 95],
      [0.25, 95],
      [0.5, 160],
      [0.75, 95],
    ]
    hits.forEach(([dt, f], i) => {
      tone(a, out, t0 + dt, f, 0.2, "sine", 0.95, f * 0.45)
      slap(a, out, t0 + dt + (i % 2 === 0 ? 0.12 : 0.06), 2300, 0.18)
    })
    return 1.0
  },
  // 🛕 Deep temple bell - shankh like
  temple: (a, out, t0) => {
    const partials: [number, number, number][] = [
      [196, 0.9, 2.6],
      [392, 0.32, 2.2],
      [588.5, 0.16, 1.8],
      [786, 0.09, 1.4],
    ]
    partials.forEach(([f, v, d]) => tone(a, out, t0, f, d, "sine", v))
    partials.forEach(([f, v, d]) => tone(a, out, t0 + 1.7, f, d * 0.8, "sine", v * 0.5))
    return 3.4
  },
  // 🐦 Morning birds chirping
  birds: (a, out, t0) => {
    const chirps: [number, number][] = [
      [0, 2400],
      [0.12, 2900],
      [0.28, 2300],
      [0.55, 3100],
      [0.67, 2700],
      [1.0, 2500],
    ]
    chirps.forEach(([dt, f]) => tone(a, out, t0 + dt, f * 0.75, 0.09, "sine", 0.35, f * 1.4))
    return 1.8
  },
}

export type StopFn = () => void

/**
 * Play an alarm pattern.
 * loop=true keeps repeating until the returned stop function is called.
 */
export function playAlarm(soundId: string, opts?: { volume?: number; loop?: boolean }): StopFn {
  let a: AudioContext
  try {
    a = getCtx()
  } catch {
    return () => {}
  }
  const pattern = PATTERNS[soundId] || PATTERNS.beep
  const master = a.createGain()
  master.gain.value = Math.min(1, Math.max(0, opts?.volume ?? 0.85))
  master.connect(a.destination)

  let stopped = false
  let timer: ReturnType<typeof setTimeout> | null = null
  const loop = opts?.loop !== false

  const run = () => {
    if (stopped) return
    try {
      const dur = pattern(a, master, a.currentTime + 0.03)
      if (loop) timer = setTimeout(run, Math.max(60, dur * 1000 - 25))
    } catch {
      // ignore scheduling errors
    }
  }
  run()

  return () => {
    if (stopped) return
    stopped = true
    if (timer) clearTimeout(timer)
    try {
      master.gain.cancelScheduledValues(a.currentTime)
      master.gain.setValueAtTime(master.gain.value, a.currentTime)
      master.gain.linearRampToValueAtTime(0.0001, a.currentTime + 0.08)
    } catch {
      // ignore
    }
    setTimeout(() => {
      try {
        master.disconnect()
      } catch {
        // ignore
      }
    }, 160)
  }
}

// ---------- vibration helpers ----------

let vibTimer: ReturnType<typeof setInterval> | null = null

export function startVibration(): StopFn {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return () => {}
  const pattern = [400, 250, 400, 250, 900]
  try {
    navigator.vibrate(pattern)
  } catch {
    return () => {}
  }
  vibTimer = setInterval(() => {
    try {
      navigator.vibrate(pattern)
    } catch {
      // ignore
    }
  }, 2400)
  return () => {
    if (vibTimer) {
      clearInterval(vibTimer)
      vibTimer = null
    }
    try {
      navigator.vibrate(0)
    } catch {
      // ignore
    }
  }
}

export function vibrateOnce(pattern: number | number[] = [120, 60, 120]) {
  try {
    navigator.vibrate(pattern)
  } catch {
    // ignore
  }
}
