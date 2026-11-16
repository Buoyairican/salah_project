import { gsap } from 'gsap'
import { mulberry32 } from '../engine/prng'
import { eases } from '../tokens/motion'
import type { Handle } from '../components/types'
import type { AmbientOptions, AmbientTarget, AmbientVariant, MotionContext } from './types'

/** Added to every element an ambient loop moves (and to the sweep band): `will-change: translate`. */
export const AMBIENT_CLASS = 'ambient'
/** The sweep's clip layer, appended as the last child of each sweep target. It holds the band. */
export const SWEEP_CLASS = 'ambient-sweep'
export const SWEEP_BAND_CLASS = 'ambient-sweep-band'

export const AMBIENT_PERIODS: Readonly<Record<AmbientVariant, number>> = { float: 7, breathe: 6, drift: 24, pulse: 5, sweep: 9 }
export const AMBIENT_AMPLITUDES: Readonly<Record<AmbientVariant, number>> = { float: 8, breathe: 0.02, drift: 80, pulse: 0.25, sweep: 0 }
/**
 * Bounds (spec 5.4 and 12.14 on luminance changes): a loop lasts at least 4 s, a float stays within 24 px, a breath
 * within 8 %, a pulse within 0.5 of opacity. The default-deck ruling (brand-default brief, ruling 6) set 12 px, 3 %
 * and 0.3; the Corbatek rev 2 ruling R2 (2026-10-12) raised the ceilings so a deck can ask for clearly visible motion,
 * while the defaults above stay where they were. Drift has no ceiling: it is for backdrops (mesh blobs), never for
 * anything that is read.
 */
export const AMBIENT_LIMITS = { minPeriod: 4, float: 24, breathe: 0.08, pulse: 0.5 } as const

const EASE = eases.soft // sine.inOut
const VARIANTS = Object.keys(AMBIENT_PERIODS) as AmbientVariant[]
/**
 * Degrees of tilt at the top and bottom of a float, up to FLOAT_TILT_FROM px of bob. A larger float tilts in
 * proportion (24 px → 0.8°), so a big levitation still rocks as much for its size; floats of 12 px or less, every
 * float the old ceiling allowed, keep 0.4°.
 */
const FLOAT_TILT = 0.4
const FLOAT_TILT_FROM = 12
/** The sweep band's width, in % of its target. */
const SWEEP_WIDTH = 40
/** Share of the period the band takes to cross its target; it rests past the far edge for the remainder. */
const SWEEP_PASS = 0.2

type Channel = 'translate' | 'scale' | 'rotate' | 'opacity'

/** One loop's contribution to an element. `gain` scales it in from rest (float); it is 1 for the other variants. */
interface Layer {
  x: number
  y: number
  scale: number
  rotate: number
  opacity: number
  gain: number
}
interface Stack {
  layers: Layer[]
  channels: Set<Channel>
}
/** Every loop on an element, so a float and a breathe (or two drifts) on the same element add up instead of fighting. */
const stacks = new WeakMap<HTMLElement, Stack>()

/** A GSAP target whose properties are getter/setter functions: GSAP calls them on every render, seeks included. */
type Port = Record<keyof Layer, (value?: number) => number | undefined>

const round = (n: number, digits: number) => Math.round(n * 10 ** digits) / 10 ** digits

function paint(el: HTMLElement, stack: Stack): void {
  let x = 0
  let y = 0
  let scale = 1
  let rotate = 0
  let opacity = 1
  for (const l of stack.layers) {
    x += l.x * l.gain
    y += l.y * l.gain
    rotate += l.rotate * l.gain
    scale *= 1 + (l.scale - 1) * l.gain
    opacity *= 1 - (1 - l.opacity) * l.gain
  }
  // The individual transform properties compose with `transform` (translate, rotate, scale, then transform),
  // which belongs to the step timeline. Only the channels some loop on this element uses are written.
  const { style } = el
  if (stack.channels.has('translate')) style.translate = `${round(x, 2)}px ${round(y, 2)}px`
  if (stack.channels.has('rotate')) style.rotate = `${round(rotate, 3)}deg`
  if (stack.channels.has('scale')) style.scale = `${round(scale, 4)}`
  if (stack.channels.has('opacity')) style.opacity = `${round(opacity, 3)}`
}

function port(el: HTMLElement, channels: Channel[], init: Partial<Layer> = {}): Port {
  let stack = stacks.get(el)
  if (!stack) {
    stack = { layers: [], channels: new Set() }
    stacks.set(el, stack)
  }
  const s = stack
  const layer: Layer = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, gain: 1, ...init }
  s.layers.push(layer)
  for (const c of channels) s.channels.add(c)
  const accessor = (key: keyof Layer) => (value?: number) => {
    if (value === undefined) return layer[key]
    layer[key] = value
    paint(el, s)
    return undefined
  }
  return {
    x: accessor('x'),
    y: accessor('y'),
    scale: accessor('scale'),
    rotate: accessor('rotate'),
    opacity: accessor('opacity'),
    gain: accessor('gain'),
  }
}

/**
 * GSAP reads an element's transform once, when its first transform tween initialises: it folds any CSS translate,
 * rotate and scale it finds into its own copy of `transform` and resets them to `none`. Were that to happen while
 * the loop holds the element away from rest (a focus or exit being the element's first transform tween), the
 * offset would stay baked into the transform while the loop keeps adding its own: a jump, then a lasting shift.
 * A no-op set initialises GSAP's copy now, before the loop has written anything.
 */
function adoptTransform(el: HTMLElement): void {
  gsap.set(el, { x: '+=0' })
}

/** Elements a playing loop rendered since the last tick. */
const rendered = new Set<HTMLElement>()
let healing = false

/**
 * GSAP also resets translate, rotate and scale to `none` (without folding them) the first time a from() tween built
 * before `ambient` renders: a reveal later in the entrance than the slide's first frame does so while the element
 * already floats. Ticker listeners run after GSAP has rendered every timeline, so repainting here, once per tick,
 * restores the loop's values before the browser paints: no frame shows the element without its offset. A paused
 * loop is at rest, where `none` is right, so only elements whose loops rendered since the last tick are repainted.
 */
function heal(): void {
  for (const el of rendered) {
    const stack = stacks.get(el)
    if (stack) paint(el, stack)
  }
  rendered.clear()
}

interface Resolved {
  period: number
  amplitude: number
  stagger: number
  rng(i: number): () => number
}

/** The tilt of a float of `amplitude` px: 0.4° up to 12 px, then in proportion. */
export function floatTilt(amplitude: number): number {
  return FLOAT_TILT * Math.max(1, amplitude / FLOAT_TILT_FROM)
}

/**
 * Bobs ± amplitude px with a ± 0.4° tilt (more above 12 px, see floatTilt). The bob fades in from rest over half a
 * period; its phase is seeded.
 */
function float(el: HTMLElement, i: number, o: Resolved): gsap.core.Timeline {
  const half = o.period / 2
  const tilt = floatTilt(o.amplitude)
  const p = port(el, ['translate', 'rotate'], { y: -o.amplitude, rotate: -tilt, gain: 0 })
  const tl = gsap.timeline()
  tl.to(p, { gain: 1, duration: half, ease: EASE }, 0)
  const bob = gsap.timeline({ repeat: -1, yoyo: true })
  bob.to(p, { y: o.amplitude, rotate: tilt, duration: half, ease: EASE })
  tl.add(bob, o.rng(i)() * half)
  return tl
}

/** Scales 1 → 1 + amplitude and back. */
function breathe(el: HTMLElement, _i: number, o: Resolved): gsap.core.Timeline {
  const p = port(el, ['scale'])
  return gsap.timeline({ repeat: -1, yoyo: true }).to(p, { scale: 1 + o.amplitude, duration: o.period / 2, ease: EASE })
}

/** Opacity 1 → 1 − amplitude and back. */
function pulse(el: HTMLElement, _i: number, o: Resolved): gsap.core.Timeline {
  const p = port(el, ['opacity'])
  return gsap.timeline({ repeat: -1, yoyo: true }).to(p, { opacity: 1 - o.amplitude, duration: o.period / 2, ease: EASE })
}

/**
 * Out from rest and home again through 3 or 4 seeded waypoints spread around the rest position, each within
 * ± amplitude px. The two axes pass through the waypoints' coordinates on their own seeded timings, so the element
 * never halts on the way; both are home together once per period.
 */
function drift(el: HTMLElement, i: number, o: Resolved): gsap.core.Timeline {
  const p = port(el, ['translate'])
  const rng = o.rng(i)
  const n = 3 + Math.floor(rng() * 2)
  const turn = rng() * Math.PI * 2
  const points = Array.from({ length: n }, (_, k) => {
    const angle = turn + (k + (rng() - 0.5) * 0.5) * ((Math.PI * 2) / n)
    const r = o.amplitude * (0.55 + 0.45 * rng())
    return { x: r * Math.cos(angle), y: r * Math.sin(angle) }
  })
  points.push({ x: 0, y: 0 })
  const tl = gsap.timeline()
  for (const axis of ['x', 'y'] as const) {
    const weights = points.map(() => 0.7 + 0.6 * rng())
    const total = weights.reduce((a, b) => a + b, 0)
    const legs = gsap.timeline({ repeat: -1 })
    points.forEach((pt, k) => legs.to(p, { [axis]: pt[axis], duration: (o.period * weights[k]!) / total, ease: EASE }))
    tl.add(legs, 0)
  }
  return tl
}

/**
 * Appends a clip layer (inset 0, the target's radius) holding a soft diagonal white band, and passes the band across
 * once per period, then rests it past the far edge. The target becomes `position: relative` if it was static.
 */
function sweep(el: HTMLElement, _i: number, o: Resolved): gsap.core.Timeline {
  const doc = el.ownerDocument
  const clip = doc.createElement('div')
  clip.className = SWEEP_CLASS
  clip.setAttribute('aria-hidden', 'true')
  const band = doc.createElement('div')
  band.className = `${SWEEP_BAND_CLASS} ${AMBIENT_CLASS}`
  band.style.width = `${SWEEP_WIDTH}%`
  clip.appendChild(band)
  el.appendChild(clip)
  const position = doc.defaultView?.getComputedStyle(el).position
  if (!position || position === 'static') el.style.position = 'relative'

  const state = { x: -100 } // % of the band's own width: -100 is just off the near edge
  const p = {
    x: (value?: number) => {
      if (value === undefined) return state.x
      state.x = value
      band.style.translate = `${round(value, 2)}% 0px`
      return undefined
    },
  }
  const pass = o.period * SWEEP_PASS
  return gsap
    .timeline({ repeat: -1, repeatDelay: o.period - pass })
    .to(p, { x: (100 * 100) / SWEEP_WIDTH, duration: pass, ease: EASE })
}

const BUILD: Record<AmbientVariant, (el: HTMLElement, i: number, o: Resolved) => gsap.core.Timeline> = { float, breathe, drift, pulse, sweep }

const toEl = (h: Handle | HTMLElement): HTMLElement => (h instanceof Element ? h : h.el)

function resolve(variant: AmbientVariant, opts: AmbientOptions, count: number): Resolved {
  if (!VARIANTS.includes(variant)) throw new RangeError(`ambient: variant "${variant}" must be one of ${VARIANTS.join(', ')}`)
  const period = opts.period ?? AMBIENT_PERIODS[variant]
  if (!(Number.isFinite(period) && period >= AMBIENT_LIMITS.minPeriod)) {
    throw new RangeError(`ambient: period ${period} s must be at least ${AMBIENT_LIMITS.minPeriod} s`)
  }
  const amplitude = opts.amplitude ?? AMBIENT_AMPLITUDES[variant]
  const ceiling = variant === 'float' || variant === 'breathe' || variant === 'pulse' ? AMBIENT_LIMITS[variant] : Infinity
  if (!(Number.isFinite(amplitude) && amplitude >= 0 && amplitude <= ceiling)) {
    throw new RangeError(`ambient: ${variant} amplitude ${amplitude} must be within 0..${ceiling}`)
  }
  const seed = opts.seed ?? 1
  if (!Number.isInteger(seed)) throw new RangeError(`ambient: seed ${seed} must be an integer`)
  const stagger = opts.stagger ?? period / Math.max(1, count)
  if (!(Number.isFinite(stagger) && stagger >= 0)) throw new RangeError(`ambient: stagger ${stagger} s must be finite and not negative`)
  // Each target draws from its own stream, so blobs given one seed still wander apart.
  const rng = (i: number) => mulberry32((Math.imul(seed, 0x9e3779b1) + Math.imul(i + 1, 0x85ebca6b)) >>> 0)
  return { period, amplitude, stagger, rng }
}

/**
 * A looping timeline of its own, outside the step timeline. It is returned paused, with `repeat: -1`, and handed
 * to `ctx.registerAmbient`, through which the deck plays it while the slide is on screen and holds it at time 0
 * otherwise. At time 0 every target is at rest: no offset, scale 1, opacity 1, the sweep band off the near edge.
 * Target k starts k × stagger seconds in, and from then on loops forever with `sine.inOut` (yoyo for float, breathe
 * and pulse). Reduced mode returns an empty paused timeline, registers nothing and leaves the DOM alone.
 *
 * The loop writes the CSS `translate`, `rotate` and `scale` properties (and `opacity` for pulse) from plain state
 * objects, never GSAP's x, y, scale or rotation: those build `transform`, which belongs to the step timeline, and
 * the individual properties compose with it. See adoptTransform and heal for the two places GSAP would interfere.
 */
export function ambient(ctx: MotionContext, target: AmbientTarget, variant: AmbientVariant, opts: AmbientOptions = {}): gsap.core.Timeline {
  const els = (Array.isArray(target) ? target : [target]).map(toEl)
  const o = resolve(variant, opts, els.length)
  if (ctx.reduced) return gsap.timeline({ paused: true })
  if (!healing) {
    gsap.ticker.add(heal)
    healing = true
  }
  const moved = variant === 'sweep' ? [] : els
  const tl = gsap.timeline({
    paused: true,
    repeat: -1,
    onUpdate: () => {
      for (const el of moved) rendered.add(el)
    },
  })
  els.forEach((el, i) => {
    if (variant !== 'sweep') {
      if (variant !== 'pulse') adoptTransform(el)
      el.classList.add(AMBIENT_CLASS)
    }
    tl.add(BUILD[variant](el, i, o), i * o.stagger)
  })
  ctx.registerAmbient?.(tl)
  return tl
}
