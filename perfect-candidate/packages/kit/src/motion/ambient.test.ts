// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { gsap } from 'gsap'
import { ambient, AMBIENT_AMPLITUDES, AMBIENT_CLASS, AMBIENT_LIMITS, AMBIENT_PERIODS, floatTilt, SWEEP_BAND_CLASS, SWEEP_CLASS } from './ambient'
import { createMotion } from './index'
import { reveal } from './reveal'
import type { MotionContext } from './types'

const base: MotionContext = { brandTempo: 1, slideTempo: 'normal', reduced: false, risk: [], emphasisEase: 'back.out(1.2)' }

function box(): HTMLElement {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}

/** Not written by ambient: empty, or `none` where GSAP parsed the element's transform (see adoptTransform). */
const UNTOUCHED = /^(none)?$/

/** The x and y of a `translate: <x>px <y>px` value; `none` (or nothing yet) is the rest position. */
function translate(el: HTMLElement): { x: number; y: number } {
  if (UNTOUCHED.test(el.style.translate)) return { x: 0, y: 0 }
  const m = /^(-?[\d.]+)px (-?[\d.]+)px$/.exec(el.style.translate)
  if (!m) throw new Error(`not a px translate: "${el.style.translate}"`)
  return { x: Number(m[1]), y: Number(m[2]) }
}

/** Sample a loop at `steps` evenly spaced times over [from, to]. */
function sample<T>(tl: gsap.core.Timeline, from: number, to: number, steps: number, read: () => T): T[] {
  const out: T[] = []
  for (let k = 0; k <= steps; k++) {
    tl.time(from + ((to - from) * k) / steps)
    out.push(read())
  }
  return out
}

describe('ambient', () => {
  it('returns a paused, endlessly repeating timeline and registers it with the deck', () => {
    const register = vi.fn()
    const el = box()
    const tl = ambient({ ...base, registerAmbient: register }, el, 'float')
    expect(tl.paused()).toBe(true)
    expect(tl.repeat()).toBe(-1)
    expect(register).toHaveBeenCalledTimes(1)
    expect(register).toHaveBeenCalledWith(tl)
    expect(el.classList.contains(AMBIENT_CLASS)).toBe(true)
  })
  it('is bound by createMotion, with the same registration hook', () => {
    const register = vi.fn()
    const tl = createMotion({ ...base, registerAmbient: register }).ambient({ el: box() }, 'breathe')
    expect(register).toHaveBeenCalledWith(tl)
  })
  it('reduced mode returns an empty paused timeline, registers nothing and leaves the element alone', () => {
    const register = vi.fn()
    const el = box()
    const tl = ambient({ ...base, reduced: true, registerAmbient: register }, el, 'drift')
    expect(tl.paused()).toBe(true)
    expect(tl.duration()).toBe(0)
    expect(register).not.toHaveBeenCalled()
    expect(el.className).toBe('')
    expect(el.getAttribute('style')).toBeNull()
    const host = box()
    ambient({ ...base, reduced: true }, host, 'sweep')
    expect(host.children).toHaveLength(0)
  })

  it('variants write their style properties after tl.progress(0.5)', () => {
    const floated = box(), breathing = box(), drifting = box(), pulsing = box()
    const loops = [
      ambient(base, floated, 'float'),
      ambient(base, breathing, 'breathe'),
      ambient(base, drifting, 'drift'),
      ambient(base, pulsing, 'pulse'),
    ]
    for (const tl of loops) tl.progress(0.5)
    expect(floated.style.translate).toMatch(/^0px -?[\d.]+px$/)
    expect(floated.style.rotate).toMatch(/^-?[\d.]+deg$/)
    expect(floated.style.scale).toMatch(UNTOUCHED)
    expect(breathing.style.scale).toMatch(/^1(\.\d+)?$/)
    expect(breathing.style.translate).toMatch(UNTOUCHED)
    expect(drifting.style.translate).toMatch(/^-?[\d.]+px -?[\d.]+px$/)
    expect(pulsing.style.opacity).toMatch(/^(0\.\d+|1)$/)
    expect(pulsing.style.translate).toBe('') // pulse never touches transforms, so GSAP never parses them
  })

  it('float starts at rest, fades its bob in, then swings ± amplitude with a ± 0.4° tilt', () => {
    const el = box()
    const tl = ambient(base, el, 'float', { amplitude: 10, period: 8 })
    tl.time(0.0001)
    tl.time(0)
    expect(el.style.translate).toBe('0px 0px')
    expect(el.style.rotate).toBe('0deg')
    // After the fade-in (half a period) and the seeded phase (under half a period), it is a pure swing.
    const ys = sample(tl, 8, 16, 160, () => translate(el).y)
    expect(Math.max(...ys)).toBeCloseTo(10, 1)
    expect(Math.min(...ys)).toBeCloseTo(-10, 1)
    const tilts = sample(tl, 8, 16, 160, () => parseFloat(el.style.rotate))
    expect(Math.max(...tilts)).toBeCloseTo(0.4, 2)
    expect(Math.min(...tilts)).toBeCloseTo(-0.4, 2)
    // No jump anywhere, the first seconds included: 1/40 s apart, a 10 px float never moves 0.5 px.
    const path = sample(tl, 0, 16, 640, () => translate(el).y)
    for (let k = 1; k < path.length; k++) expect(Math.abs(path[k]! - path[k - 1]!)).toBeLessThan(0.5)
  })
  it('breathe scales 1 → 1 + amplitude at half a period and back at a full one', () => {
    const el = box()
    const tl = ambient(base, el, 'breathe', { amplitude: 0.015, period: 6 })
    tl.time(3)
    expect(el.style.scale).toBe('1.015')
    tl.time(6)
    expect(el.style.scale).toBe('1')
  })
  it('pulse swings opacity 1 → 1 − amplitude', () => {
    const el = box()
    const tl = ambient(base, el, 'pulse')
    tl.time(2.5) // half of the default 5 s period
    expect(el.style.opacity).toBe('0.75')
    tl.time(5)
    expect(el.style.opacity).toBe('1')
  })
  it('drift stays within ± amplitude on both axes and is home once per period', () => {
    const el = box()
    const tl = ambient(base, el, 'drift', { amplitude: 120, period: 24, seed: 7 })
    const points = sample(tl, 0, 48, 480, () => translate(el))
    for (const p of points) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(120)
      expect(Math.abs(p.y)).toBeLessThanOrEqual(120)
    }
    expect(Math.max(...points.map((p) => Math.hypot(p.x, p.y)))).toBeGreaterThan(60) // it really wanders
    tl.time(24)
    expect(el.style.translate).toBe('0px 0px')
  })
  it('sweep appends a clip layer holding the band and passes it across once per period', () => {
    const host = box()
    const tl = ambient(base, host, 'sweep', { period: 9 })
    const clip = host.lastElementChild as HTMLElement
    expect(clip.className).toBe(SWEEP_CLASS)
    expect(clip.getAttribute('aria-hidden')).toBe('true')
    const band = clip.firstElementChild as HTMLElement
    expect(band.classList.contains(SWEEP_BAND_CLASS)).toBe(true)
    expect(band.classList.contains(AMBIENT_CLASS)).toBe(true)
    expect(host.style.position).toBe('relative') // a static host becomes the band's containing block
    tl.time(0.0001)
    tl.time(0)
    expect(band.style.translate).toBe('-100% 0px')
    tl.time(0.9) // halfway through the 1.8 s pass
    expect(band.style.translate).toBe('75% 0px')
    tl.time(5) // resting past the far edge
    expect(band.style.translate).toBe('250% 0px')
    tl.time(9.0001)
    expect(parseFloat(band.style.translate)).toBeLessThan(-99)
  })
  it('keeps a positioned sweep host as it is', () => {
    const host = box()
    host.style.position = 'absolute'
    ambient(base, host, 'sweep')
    expect(host.style.position).toBe('absolute')
  })

  it('pause(0) puts every target back at rest, the start state', () => {
    const a = box(), b = box()
    const tl = ambient(base, [a, b], 'drift')
    tl.time(31)
    expect(a.style.translate).not.toBe('0px 0px')
    tl.pause(0)
    expect(a.style.translate).toBe('0px 0px')
    expect(b.style.translate).toBe('0px 0px')
  })
  it('several targets start stagger seconds apart, period / targets by default', () => {
    const els = [box(), box(), box()]
    const tl = ambient(base, els, 'breathe', { period: 6 })
    expect(tl.getChildren(false).map((c) => c.startTime())).toEqual([0, 2, 4])
    tl.time(1)
    expect(Number(els[0]!.style.scale)).toBeGreaterThan(1)
    expect(els[1]!.style.scale).toMatch(UNTOUCHED) // not started yet
    const given = ambient(base, [box(), box()], 'float', { stagger: 0.5 })
    expect(given.getChildren(false).map((c) => c.startTime())).toEqual([0, 0.5])
  })
  it('seeds are deterministic, and targets sharing a seed still move apart', () => {
    const at = (seed: number, n: number, time: number) => {
      const els = Array.from({ length: n }, box)
      const tl = ambient(base, els, 'drift', { seed, stagger: 0 })
      tl.time(time)
      return els.map((el) => el.style.translate)
    }
    expect(at(3, 2, 5)).toEqual(at(3, 2, 5))
    expect(at(3, 1, 5)).not.toEqual(at(4, 1, 5))
    const [first, second] = at(3, 2, 5)
    expect(first).not.toBe(second)
    const phase = (seed: number) => {
      const el = box()
      ambient(base, el, 'float', { seed }).time(5)
      return el.style.translate
    }
    expect(phase(2)).toBe(phase(2))
    expect(phase(2)).not.toBe(phase(5))
  })
  it('adds up loops on one element instead of letting the last write win', () => {
    const el = box()
    const one = ambient(base, el, 'drift', { seed: 1 })
    const two = ambient(base, el, 'drift', { seed: 2 })
    one.time(6)
    const a = translate(el)
    two.time(6)
    const both = translate(el)
    const solo = box()
    ambient(base, solo, 'drift', { seed: 2 }).time(6)
    const b = translate(solo)
    expect(both.x).toBeCloseTo(a.x + b.x, 1)
    expect(both.y).toBeCloseTo(a.y + b.y, 1)
    ambient(base, el, 'breathe').time(3)
    expect(el.style.scale).toBe('1.02')
  })
  it('leaves transform to the step timeline: a reveal and a float on one element both hold', () => {
    const el = box()
    const tl = gsap.timeline({ paused: true })
    reveal(base, tl, el, 'fade-up')
    const loop = ambient(base, el, 'float', { amplitude: 8 })
    tl.progress(0.5)
    loop.time(5)
    expect(Number(gsap.getProperty(el, 'y'))).toBeGreaterThan(0)
    expect(el.style.transform).toContain('translate')
    expect(el.style.translate).toMatch(/^0px -?[\d.]+px$/)
    tl.progress(1)
    expect(Number(gsap.getProperty(el, 'y'))).toBe(0)
    expect(translate(el).y).not.toBe(0)
  })
  it('keeps an ambient offset out of a transform tween created after the loop has moved', () => {
    const el = box()
    const loop = ambient(base, el, 'float', { amplitude: 8 })
    loop.time(5)
    const moved = el.style.translate
    expect(translate(el).y).not.toBe(0)
    // A reveal built (and so parsed by GSAP) only now must still end on the layout position, not on the float offset.
    const tl = gsap.timeline({ paused: true })
    reveal(base, tl, el, 'fade-up')
    tl.progress(1)
    expect(Number(gsap.getProperty(el, 'y'))).toBe(0)
    expect(el.style.translate).toBe(moved)
  })
  it('repaints after the tick in which a reveal built before the loop first renders and resets translate', () => {
    const el = box()
    const tl = gsap.timeline({ paused: true })
    reveal(base, tl, el, 'fade-up', { at: 1 }) // built first, as a slide does, and first rendered only at 1 s
    const loop = ambient(base, el, 'float')
    loop.time(5)
    const moved = el.style.translate
    tl.time(1.2)
    expect(el.style.translate).toBe('none') // GSAP's reset, which a browser would paint for one frame without heal
    gsap.ticker.tick()
    expect(el.style.translate).toBe(moved)
    expect(Number(gsap.getProperty(el, 'y'))).toBeGreaterThan(0) // the reveal is still the transform's
  })
  it('allows the raised ceilings of ruling R2 (float 24 px, breathe 0.08, pulse 0.5) and keeps the defaults', () => {
    expect(AMBIENT_LIMITS).toEqual({ minPeriod: 4, float: 24, breathe: 0.08, pulse: 0.5 })
    // The defaults every deck gets without options are those of the default-deck ruling: other decks do not change.
    expect(AMBIENT_PERIODS).toEqual({ float: 7, breathe: 6, drift: 24, pulse: 5, sweep: 9 })
    expect(AMBIENT_AMPLITUDES).toEqual({ float: 8, breathe: 0.02, drift: 80, pulse: 0.25, sweep: 0 })
    const el = box()
    expect(() => ambient(base, el, 'float', { amplitude: 24 })).not.toThrow()
    expect(() => ambient(base, el, 'breathe', { amplitude: 0.08 })).not.toThrow()
    expect(() => ambient(base, el, 'pulse', { amplitude: 0.5 })).not.toThrow()
    expect(() => ambient(base, el, 'pulse', { amplitude: 0.5, period: 3.9 })).toThrow(/at least 4/) // the period floor holds
  })
  it('tilts a float 0.4° up to 12 px, then in proportion to the bob', () => {
    expect(floatTilt(8)).toBe(0.4)
    expect(floatTilt(12)).toBe(0.4)
    expect(floatTilt(18)).toBeCloseTo(0.6, 6)
    expect(floatTilt(24)).toBeCloseTo(0.8, 6)
    const el = box()
    const tl = ambient(base, el, 'float', { amplitude: 24, period: 8 })
    const ys = sample(tl, 8, 16, 160, () => translate(el).y)
    expect(Math.max(...ys)).toBeCloseTo(24, 1)
    expect(Math.min(...ys)).toBeCloseTo(-24, 1)
    const tilts = sample(tl, 8, 16, 160, () => parseFloat(el.style.rotate))
    expect(Math.max(...tilts)).toBeCloseTo(0.8, 2)
    expect(Math.min(...tilts)).toBeCloseTo(-0.8, 2)
    // Still no jump: 1/40 s apart, a 24 px float on an 8 s period never moves 1.2 px.
    const path = sample(tl, 0, 16, 640, () => translate(el).y)
    for (let k = 1; k < path.length; k++) expect(Math.abs(path[k]! - path[k - 1]!)).toBeLessThan(1.2)
  })
  it('rejects unknown variants and values outside the ruling', () => {
    const el = box()
    expect(() => ambient(base, el, 'spin' as 'float')).toThrow(RangeError)
    expect(() => ambient(base, el, 'float', { period: 3 })).toThrow(/at least 4/)
    expect(() => ambient(base, el, 'float', { amplitude: AMBIENT_LIMITS.float + 1 })).toThrow(RangeError)
    expect(() => ambient(base, el, 'breathe', { amplitude: 0.09 })).toThrow(RangeError)
    expect(() => ambient(base, el, 'pulse', { amplitude: 0.51 })).toThrow(RangeError)
    expect(() => ambient(base, el, 'drift', { amplitude: -1 })).toThrow(RangeError)
    expect(() => ambient(base, el, 'drift', { seed: 1.5 })).toThrow(/integer/)
    expect(() => ambient(base, el, 'drift', { stagger: -1 })).toThrow(RangeError)
    expect(() => ambient(base, el, 'drift', { amplitude: 120 })).not.toThrow() // backdrops have no ceiling
    expect(() => ambient({ ...base, reduced: true }, el, 'float', { period: 1 })).toThrow(RangeError) // validated in every mode
  })
})
