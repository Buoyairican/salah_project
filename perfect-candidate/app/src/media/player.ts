import { gsap } from 'gsap'
import type { Expert } from '../../content/experts'
import { el } from '../dom'
import { photoEl } from '../card'
import { cueAt, parseVtt, type Cue } from './vtt'

export type PlayResult = 'ended' | 'skipped' | 'error' | 'aborted'

/** The clip currently playing, so the S key can skip it in an emergency. */
let current: Player | null = null
/** Set by the expert slide while its card is showing, so S also skips the introduction. */
let skipHandler: (() => void) | null = null
export function setSkipHandler(fn: (() => void) | null): void {
  skipHandler = fn
}
export function skipCurrent(): void {
  if (current) current.skip()
  else skipHandler?.()
}

/**
 * One clip on screen: a video in a frame, or a voice note drawn as a ring around the person's photo, with
 * subtitles from its .vtt file. `play` resolves when the clip ends, fails, is skipped or the slide is left; it never
 * rejects, so the show always goes on.
 */
export class Player {
  readonly frame: HTMLElement
  readonly media: HTMLMediaElement
  readonly subs: HTMLElement
  readonly progress: HTMLElement
  readonly time: HTMLElement
  private bar: HTMLElement
  private line: HTMLElement
  private cues: Cue[]
  private shown: Cue | null = null
  private ring: CanvasRenderingContext2D | null = null
  private wave: number[]
  private finish: ((r: PlayResult) => void) | null = null
  private failed = false

  /** `panel`: where the subtitles go beside the picture (portrait video, voice note); null puts them over the video. */
  constructor(mediaBox: HTMLElement, panel: HTMLElement | null, private expert: Expert, vtt: string, wave: number[]) {
    this.cues = parseVtt(vtt)
    this.wave = wave
    const { kind, file } = expert.media
    this.frame = el('div', 'xp-frame', mediaBox)
    if (kind === 'video') {
      const v = el('video', '', this.frame)
      v.preload = 'auto'
      v.playsInline = true
      v.poster = `media/${file}-poster.jpg`
      this.addSources(v, [[`media/${file}.webm`, 'video/webm'], [`media/${file}.mp4`, 'video/mp4']])
      this.media = v
    } else {
      const a = el('audio', '', this.frame)
      a.preload = 'auto'
      this.addSources(a, [[`media/${file}.webm`, 'audio/webm'], [`media/${file}.m4a`, 'audio/mp4']])
      this.media = a
      const voice = el('div', 'voice', this.frame)
      const canvas = el('canvas', '', voice)
      canvas.width = 700
      canvas.height = 700
      this.ring = canvas.getContext('2d')
      photoEl(voice, expert)
      this.drawRing(0, 0)
    }
    this.media.addEventListener('error', () => this.fail())

    this.progress = el('div', 'xp-progress', mediaBox)
    this.bar = el('i', '', this.progress)
    this.time = el('div', 'xp-time', mediaBox)
    this.time.textContent = ''

    this.subs = el('div', 'subs', panel ?? this.frame)
    if (panel) {
      const what = expert.media.language === 'fr' ? 'Translated from French' : 'Subtitles'
      el('span', 'subs-tag', this.subs).textContent = kind === 'audio' ? `Voice note · ${what}` : what
    }
    this.line = el('span', 'subs-line', this.subs)
    this.line.style.visibility = 'hidden'
  }

  private addSources(m: HTMLMediaElement, list: Array<[string, string]>): void {
    list.forEach(([src, type], i) => {
      const s = el('source', '', m)
      s.src = src
      s.type = type
      // When the last source fails, nothing can play.
      if (i === list.length - 1) s.addEventListener('error', () => this.fail())
    })
  }

  private fail(): void {
    this.failed = true
    this.finish?.('error')
  }

  /** Back to the start, silent, no subtitle. */
  reset(): void {
    try {
      this.media.pause()
      this.media.currentTime = 0
    } catch {
      /* not loaded yet */
    }
    this.shown = null
    this.line.textContent = ''
    this.line.style.visibility = 'hidden'
    gsap.set(this.bar, { scaleX: 0 })
    this.time.textContent = ''
    this.drawRing(0, 0)
  }

  skip(): void {
    this.finish?.('skipped')
  }

  async play(signal: AbortSignal): Promise<PlayResult> {
    if (signal.aborted) return 'aborted'
    if (this.failed) return 'error'
    current = this
    const result = await new Promise<PlayResult>((resolve) => {
      let raf = 0
      let lastT = -1
      let still = 0
      let lastNow = performance.now()
      const done = (r: PlayResult) => {
        if (!this.finish) return
        this.finish = null
        cancelAnimationFrame(raf)
        this.media.removeEventListener('ended', onEnded)
        signal.removeEventListener('abort', onAbort)
        resolve(r)
      }
      this.finish = done
      const onEnded = () => done('ended')
      const onAbort = () => done('aborted')
      this.media.addEventListener('ended', onEnded)
      signal.addEventListener('abort', onAbort, { once: true })
      const loop = (now: number) => {
        const dt = (now - lastNow) / 1000
        lastNow = now
        const t = this.media.currentTime
        const d = this.media.duration
        // Watchdog: a clip that stops advancing for 8 s is treated as finished, so the show never hangs.
        if (Math.abs(t - lastT) < 1e-4) still += dt
        else still = 0
        lastT = t
        if (still > 8) return done('error')
        this.update(t, Number.isFinite(d) ? d : 0, now / 1000)
        raf = requestAnimationFrame(loop)
      }
      try {
        this.media.currentTime = 0
      } catch {
        /* metadata not ready: starts at 0 anyway */
      }
      this.media.play().then(
        () => void (raf = requestAnimationFrame(loop)),
        (err: unknown) => {
          console.error('clip could not play', this.expert.media.file, err)
          done('error')
        },
      )
    })
    if (current === this) current = null
    try {
      this.media.pause()
    } catch {
      /* ignore */
    }
    return result
  }

  private update(t: number, d: number, now: number): void {
    const cue = cueAt(this.cues, t)
    if (cue !== this.shown) {
      this.shown = cue
      if (cue) {
        this.line.textContent = cue.text
        this.line.style.visibility = 'visible'
        gsap.fromTo(this.subs, { opacity: 0.2, y: 6 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out', overwrite: true })
      } else {
        this.line.style.visibility = 'hidden'
      }
    }
    if (d > 0) {
      gsap.set(this.bar, { scaleX: Math.min(1, t / d) })
      const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
      this.time.textContent = `${fmt(t)} / ${fmt(d)}`
    }
    if (this.ring) {
      const i = t * 30
      const a = this.wave[Math.floor(i)] ?? 0
      const b = this.wave[Math.floor(i) + 1] ?? a
      const level = this.wave.length ? a + (b - a) * (i - Math.floor(i)) : 0.35 + 0.15 * Math.sin(now * 3)
      this.drawRing(level, now)
    }
  }

  /** The voice, drawn as light around the photo: 120 rays, longer where the voice is louder. */
  private drawRing(level: number, now: number): void {
    const g = this.ring
    if (!g) return
    const W = 700, C = 350, R = 168
    g.clearRect(0, 0, W, W)
    const glow = g.createRadialGradient(C, C, R * 0.8, C, C, R + 150)
    glow.addColorStop(0, `rgba(108, 192, 255, ${0.1 + level * 0.28})`)
    glow.addColorStop(1, 'rgba(108, 192, 255, 0)')
    g.fillStyle = glow
    g.beginPath()
    g.arc(C, C, R + 150, 0, Math.PI * 2)
    g.fill()
    const n = 120
    g.lineCap = 'round'
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 - Math.PI / 2
      const shape = 0.55 + 0.45 * Math.sin(a * 3 + now * 1.7) * Math.sin(a * 5 - now * 1.1)
      const len = 6 + level * 92 * Math.max(0.15, shape)
      const alpha = 0.35 + level * 0.6
      g.strokeStyle = `rgba(${200 + Math.round(55 * level)}, 236, 255, ${alpha})`
      g.lineWidth = 3.2
      g.beginPath()
      g.moveTo(C + Math.cos(a) * (R + 8), C + Math.sin(a) * (R + 8))
      g.lineTo(C + Math.cos(a) * (R + 8 + len), C + Math.sin(a) * (R + 8 + len))
      g.stroke()
    }
    g.strokeStyle = 'rgba(223, 243, 255, 0.5)'
    g.lineWidth = 2
    g.beginPath()
    g.arc(C, C, R, 0, Math.PI * 2)
    g.stroke()
  }
}
