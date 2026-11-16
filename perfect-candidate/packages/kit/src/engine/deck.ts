import { gsap } from 'gsap'
import { brandToCss, type BrandTheme } from '../brand/types'
import { t, tokensToCss } from '../tokens'
import { eases, EXIT_RATIO, resolveDuration, type SlideTempo } from '../tokens/motion'
import { createComponents } from '../components'
import type { Components } from '../components/types'
import { createMotion } from '../motion'
import type { EnterDirection, SlideDefinition } from '../define-slide'
import { createStage, type Stage } from './stage'
import { fontsReady } from './fonts'
import { imagesReady } from './media'
import { hasExit, seekExact, stepTimes } from './labels'
import { clampPosition, nextPosition, prevPosition, type DeckPosition } from './position'
import { readHash, writeHash } from './hash-state'

export interface DeckConfig {
  title: string
  language: string
  brand: BrandTheme
  talkMinutes?: number
}

export interface DeckOptions {
  config: DeckConfig
  slides: SlideDefinition[]
  root: HTMLElement
  win?: Window
  reduced?: boolean
  qa?: boolean
  fontTimeoutMs?: number
  /**
   * Called once the stage exists and before any slide is built, so a deck can add layers that live across slides
   * (a backdrop under them, a heads-up display over them). Slides are appended after, so they stack above
   * whatever this appends unless it sets its own z-index.
   */
  onStage?: (stage: HTMLElement) => void
}

export interface SlideMeta {
  id: string
  claim: string
  notes: string
  transition: 'cut' | 'fade'
  fullBleed: boolean
  illustrative: boolean
  tempo: SlideTempo
  stepCount: number
}

interface MountedSlide {
  def: SlideDefinition
  el: HTMLElement
  tl: gsap.core.Timeline
  times: number[]
  exit: boolean
  /** The slide's ambient loops: playing while it is on screen, held at time 0 (everything at rest) otherwise. */
  ambient: gsap.core.Timeline[]
}

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0)

const OFF_VALUES = new Set(['0', 'false', 'off'])

/** A URL switch: absent gives undefined, `0`, `false` or `off` give false, any other value (or none) gives true. */
function urlFlag(params: URLSearchParams, name: string): boolean | undefined {
  const value = params.get(name)
  if (value === null) return undefined
  return !OFF_VALUES.has(value.trim().toLowerCase())
}

export class Deck {
  readonly config: DeckConfig
  readonly slides: SlideDefinition[]
  readonly ready: Promise<void>
  readonly reduced: boolean
  ambientEnabled: boolean
  position: DeckPosition = { slide: 0, step: 0 }
  stepCounts: number[] = []

  private readonly root: HTMLElement
  private readonly win: Window
  private readonly fontTimeoutMs: number
  private stage: Stage | null = null
  private black: HTMLElement | null = null
  private style: HTMLStyleElement | null = null
  private mounted: MountedSlide[] = []
  private queue: Promise<unknown> = Promise.resolve()
  private readonly onStage?: (stage: HTMLElement) => void
  /** The slide whose `enter` hook ran last: its abort controller and the holds it has taken. */
  private live: { index: number; abort: AbortController; holds: Set<symbol> } | null = null
  private resolveReady!: () => void
  private rejectReady!: (err: unknown) => void

  constructor(opts: DeckOptions) {
    this.config = opts.config
    this.slides = opts.slides
    this.root = opts.root
    this.win = opts.win ?? window
    this.fontTimeoutMs = opts.fontTimeoutMs ?? 3000
    this.onStage = opts.onStage
    const params = new URLSearchParams(this.win.location.search)
    // The URL wins over the OS setting, so `?reduced=0` gives full motion on a machine with Reduce Motion on.
    const prefersReduced = () =>
      typeof this.win.matchMedia === 'function' && this.win.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.reduced = opts.reduced ?? urlFlag(params, 'reduced') ?? prefersReduced()
    this.ambientEnabled = !(opts.qa ?? urlFlag(params, 'qa') ?? false)
    this.ready = new Promise<void>((resolve, reject) => {
      this.resolveReady = resolve
      this.rejectReady = reject
    })
    // A failed mount rejects `ready` so tools awaiting it fail instead of hanging; callers
    // that only await mount() still see the error there, without an unhandled rejection.
    this.ready.catch(() => undefined)
  }

  async mount(): Promise<void> {
    try {
      await this.mountSlides()
      this.resolveReady()
    } catch (err) {
      this.rejectReady(err)
      throw err
    }
  }

  private async mountSlides(): Promise<void> {
    const doc = this.root.ownerDocument
    const brand = this.config.brand

    this.style = doc.createElement('style')
    this.style.setAttribute('data-deck-tokens', '')
    this.style.textContent = tokensToCss() + brandToCss(brand)
    doc.head.appendChild(this.style)
    doc.documentElement.lang = this.config.language
    doc.title = this.config.title

    this.stage = createStage(this.root, this.win)
    this.onStage?.(this.stage.el)
    this.black = doc.createElement('div')
    this.black.className = 'deck-black'
    this.root.appendChild(this.black)

    await fontsReady([brand.fonts.display, brand.fonts.text], doc, this.fontTimeoutMs)

    const c = createComponents({ language: this.config.language, brand })
    this.mounted = this.slides.map((def, i) => this.buildSlide(def, i, c))
    this.stepCounts = this.mounted.map((m) => m.times.length)
    // Slides are built; their images (the brand logo, media) load under the same guard as the fonts.
    await imagesReady(this.stage!.el, this.fontTimeoutMs)

    const start = clampPosition(readHash(this.win) ?? { slide: 0, step: 0 }, this.stepCounts)
    this.applyPosition(start)
  }

  private buildSlide(def: SlideDefinition, index: number, c: Components): MountedSlide {
    const doc = this.root.ownerDocument
    const el = doc.createElement('section')
    el.className = 'slide'
    el.dataset.slideId = def.id
    el.dataset.index = String(index)
    this.stage!.el.appendChild(el)

    const brand = this.config.brand
    const tl = gsap.timeline({ paused: true })
    const ambient: gsap.core.Timeline[] = []
    const m = createMotion({
      brandTempo: brand.tempo,
      slideTempo: def.tempo ?? 'normal',
      reduced: this.reduced,
      risk: brand.data.risk,
      emphasisEase: brand.emphasisEase,
      registerAmbient: (loop) => ambient.push(loop),
    })
    def.build({ stage: el, tl, c, m, t, data: def.data ?? {} })
    const times = stepTimes(tl, def.id)
    return { def, el, tl, times, exit: hasExit(tl), ambient }
  }

  /**
   * Ambient loops play while their slide is active, ambient is enabled (not `?qa=1`) and motion is not reduced.
   * Anywhere else they are paused at time 0, which is the exact start state, so held frames stay deterministic.
   * `play()` resumes where a loop is, so syncing an already playing slide does not restart it.
   */
  private syncAmbient(slides: MountedSlide[] = this.mounted): void {
    for (const m of slides) {
      const live = this.ambientEnabled && !this.reduced && m.el.classList.contains('is-active')
      for (const loop of m.ambient) {
        if (live) loop.play()
        else loop.pause(0)
      }
    }
  }

  /** Turn ambient motion on or off, live. Off holds every loop at its start state. */
  setAmbient(on: boolean): void {
    this.ambientEnabled = on
    this.syncAmbient()
  }

  /** Put every slide in the exact state for `pos`, with no animation. */
  private applyPosition(pos: DeckPosition): void {
    this.mounted.forEach((m, i) => {
      if (i < pos.slide) seekExact(m.tl, m.tl.duration())
      else if (i > pos.slide) seekExact(m.tl, 0)
      else seekExact(m.tl, m.times[pos.step]!)
      m.el.classList.toggle('is-active', i === pos.slide)
      gsap.set(m.el, { opacity: 1 })
    })
    this.syncAmbient()
    const changed = this.live?.index !== pos.slide
    this.position = pos
    writeHash(pos, this.win)
    if (changed) this.enterSlide(pos.slide, 'jump')
  }

  /** Leave the live slide (abort its signal, drop its holds), then run the `enter` hook of `index`. */
  private enterSlide(index: number, direction: EnterDirection): void {
    this.leaveLive()
    const abort = new AbortController()
    const holds = new Set<symbol>()
    this.live = { index, abort, holds }
    const def = this.mounted[index]?.def
    if (!def?.enter) return
    const hold = () => {
      const key = Symbol('hold')
      holds.add(key)
      return () => {
        holds.delete(key)
      }
    }
    try {
      def.enter({ direction, signal: abort.signal, hold })
    } catch (err) {
      // A failing hook must never stop the show: the slide stays on screen and presses keep working.
      holds.clear()
      console.error(`slide "${def.id}" enter hook failed`, err)
    }
  }

  private leaveLive(): void {
    if (!this.live) return
    this.live.holds.clear()
    this.live.abort.abort()
    this.live = null
  }

  /** True while the live slide holds forward presses (a video is playing). */
  isHeld(): boolean {
    return (this.live?.holds.size ?? 0) > 0
  }

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn)
    this.queue = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  goTo(pos: DeckPosition): Promise<void> {
    return this.enqueue(async () => {
      this.applyPosition(clampPosition(pos, this.stepCounts))
    })
  }

  /** Advance one step. Ignored, at the moment of the press, while the live slide holds forward presses. */
  next(): Promise<void> {
    if (this.isHeld()) return Promise.resolve()
    return this.enqueue(() => (this.isHeld() ? Promise.resolve() : this.stepForward()))
  }

  prev(): Promise<void> {
    return this.enqueue(() => this.stepBackward())
  }

  private async stepForward(): Promise<void> {
    const target = nextPosition(this.position, this.stepCounts)
    if (!target) return
    const current = this.mounted[this.position.slide]!
    if (target.slide === this.position.slide) {
      await current.tl.tweenTo(`step-${target.step}`)
    } else {
      this.enterSlide(target.slide, 'forward')
      await this.transition(current, this.mounted[target.slide]!, 'forward')
    }
    this.position = target
    writeHash(target, this.win)
  }

  private async stepBackward(): Promise<void> {
    const target = prevPosition(this.position, this.stepCounts)
    if (!target) return
    const current = this.mounted[this.position.slide]!
    if (target.slide === this.position.slide) {
      await current.tl.tweenTo(`step-${target.step}`)
    } else {
      const incoming = this.mounted[target.slide]!
      seekExact(incoming.tl, incoming.times[target.step]!)
      this.enterSlide(target.slide, 'backward')
      await this.transition(current, incoming, 'backward')
    }
    this.position = target
    writeHash(target, this.win)
  }

  private async transition(out: MountedSlide, inc: MountedSlide, dir: 'forward' | 'backward'): Promise<void> {
    const later = dir === 'forward' ? inc : out
    const kind = later.def.transition ?? 'fade'
    const ctx = { brandTempo: this.config.brand.tempo, slideTempo: later.def.tempo ?? 'normal', reduced: this.reduced }
    const d = resolveDuration('s', ctx)

    inc.el.classList.add('is-active')
    if (dir === 'forward') seekExact(inc.tl, 0)
    this.syncAmbient([inc]) // the incoming loops start with the fade-in

    const tr = gsap.timeline()
    if (dir === 'forward' && out.exit) tr.add(out.tl.tweenTo(out.tl.duration())) // the exit segment runs from the `exit` label to the end
    const start = dir === 'forward' && out.exit ? '>' : 0
    if (kind === 'cut' || this.reduced) {
      // Keep the incoming slide hidden until the cut, so an outgoing exit segment stays visible.
      gsap.set(inc.el, { opacity: 0 })
      tr.set(out.el, { opacity: 0 }, start)
      tr.set(inc.el, { opacity: 1 }, start)
    } else {
      tr.fromTo(inc.el, { opacity: 0 }, { opacity: 1, duration: d, ease: eases.enter }, start)
      tr.to(out.el, { opacity: 0, duration: d * EXIT_RATIO, ease: eases.exit }, '<')
    }
    if (dir === 'forward') tr.add(inc.tl.tweenFromTo(0, 'step-0'), '<')
    await tr

    out.el.classList.remove('is-active')
    gsap.set([out.el, inc.el], { opacity: 1 })
    if (dir === 'backward') seekExact(out.tl, 0)
    this.syncAmbient([out]) // the outgoing loops go back to rest only now that the slide is hidden
  }

  seekWithin(pos: DeckPosition, progress: number): Promise<void> {
    return this.enqueue(async () => {
      const p = clampPosition(pos, this.stepCounts)
      const m = this.mounted[p.slide]!
      this.applyPosition(p)
      const end = m.times[p.step]!
      const start = p.step === 0 ? 0 : m.times[p.step - 1]!
      seekExact(m.tl, start + (end - start) * clamp01(progress))
    })
  }

  play(pos: DeckPosition): Promise<number[]> {
    return this.enqueue(async () => {
      const p = clampPosition(pos, this.stepCounts)
      const m = this.mounted[p.slide]!
      const before = p.step === 0 ? p : { slide: p.slide, step: p.step - 1 }
      this.applyPosition(before)
      if (p.step === 0) seekExact(m.tl, 0)
      const samples: number[] = []
      let raf = 0
      const loop = (ts: number) => {
        samples.push(ts)
        raf = this.win.requestAnimationFrame(loop)
      }
      raf = this.win.requestAnimationFrame(loop)
      await m.tl.tweenTo(`step-${p.step}`)
      this.win.cancelAnimationFrame(raf)
      this.position = p
      writeHash(p, this.win)
      return samples
    })
  }

  slideMeta(index: number): SlideMeta {
    const i = Math.min(Math.max(0, index), this.mounted.length - 1)
    const m = this.mounted[i]!
    return {
      id: m.def.id,
      claim: m.def.claim,
      notes: m.def.notes ?? '',
      transition: m.def.transition ?? 'fade',
      fullBleed: m.def.fullBleed ?? false,
      illustrative: m.def.illustrative ?? false,
      tempo: m.def.tempo ?? 'normal',
      stepCount: m.times.length,
    }
  }

  setSpeed(x: number): void {
    gsap.globalTimeline.timeScale(x)
  }

  toggleBlack(): void {
    this.black?.classList.toggle('is-on')
  }

  isBlack(): boolean {
    return this.black?.classList.contains('is-on') ?? false
  }

  destroy(): void {
    this.leaveLive()
    for (const m of this.mounted) {
      m.tl.kill()
      for (const loop of m.ambient) loop.kill()
    }
    this.mounted = []
    this.stage?.destroy()
    this.black?.remove()
    this.style?.remove()
  }
}

export function createDeck(opts: DeckOptions): Deck {
  return new Deck(opts)
}

/** Order `import.meta.glob` results by path and unwrap default exports. */
export function sortSlides(modules: Record<string, unknown>): SlideDefinition[] {
  return Object.keys(modules)
    .sort()
    .map((key) => {
      const mod = modules[key] as { default?: SlideDefinition } | SlideDefinition
      return 'default' in mod && mod.default ? mod.default : (mod as SlideDefinition)
    })
}
