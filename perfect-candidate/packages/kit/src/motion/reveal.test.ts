// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { gsap } from 'gsap'
import { reveal, exit } from './reveal'
import type { MotionContext } from './types'
import type { TextHandle } from '../components/types'

const ctx: MotionContext = { brandTempo: 1, slideTempo: 'normal', reduced: false, risk: [], emphasisEase: 'back.out(1.2)' }
const reduced: MotionContext = { ...ctx, reduced: true }

function fakeText(wordCount: number): TextHandle {
  const el = document.createElement('p')
  const lines = [document.createElement('div')]
  const words = Array.from({ length: wordCount }, () => document.createElement('span'))
  lines[0]!.append(...words)
  el.appendChild(lines[0]!)
  document.body.appendChild(el)
  return { el, lines, words, level: 'body' }
}

describe('reveal', () => {
  it('adds a child timeline whose duration covers the stagger', () => {
    const tl = gsap.timeline({ paused: true })
    const h = fakeText(3)
    const child = reveal(ctx, tl, h, 'words')
    // 3 words, tight stagger 0.04, duration m 0.5 → 0.5 + 2 × 0.04
    expect(child.duration()).toBeCloseTo(0.58, 5)
    expect(tl.duration()).toBeCloseTo(0.58, 5)
  })
  it('hides the targets immediately and shows them at the end', () => {
    const tl = gsap.timeline({ paused: true })
    const h = fakeText(2)
    reveal(ctx, tl, h, 'lines')
    expect(gsap.getProperty(h.lines[0]!, 'yPercent')).toBe(105)
    tl.progress(1)
    expect(gsap.getProperty(h.lines[0]!, 'yPercent')).toBe(0)
  })
  it('respects the position parameter and duration token', () => {
    const tl = gsap.timeline({ paused: true })
    const a = fakeText(1), b = fakeText(1)
    reveal(ctx, tl, a, 'fade-up', { duration: 'l' })
    const child = reveal(ctx, tl, b, 'fade-up', { at: '<0.2', duration: 's' })
    expect(child.startTime()).toBeCloseTo(0.2, 5)
    expect(child.duration()).toBeCloseTo(0.3, 5)
  })
  it('falls back to fade-up for a plain handle', () => {
    const tl = gsap.timeline({ paused: true })
    const el = document.createElement('div')
    document.body.appendChild(el)
    reveal(ctx, tl, { el }, 'words')
    expect(gsap.getProperty(el, 'opacity')).toBe(0)
    tl.progress(1)
    expect(gsap.getProperty(el, 'opacity')).toBe(1)
  })
  it('reduced mode is an xs opacity fade with no stagger', () => {
    const tl = gsap.timeline({ paused: true })
    const h = fakeText(4)
    const child = reveal(reduced, tl, h, 'words')
    expect(child.duration()).toBeCloseTo(0.15, 5)
    expect(gsap.getProperty(h.words[0]!, 'yPercent')).toBe(0)
    expect(gsap.getProperty(h.words[0]!, 'opacity')).toBe(0)
  })
})

describe('exit', () => {
  it('runs at 0.6 of the entry duration and moves lines up', () => {
    const tl = gsap.timeline({ paused: true })
    const h = fakeText(1)
    const child = exit(ctx, tl, h, 'lines')
    expect(child.duration()).toBeCloseTo(0.3, 5) // m 0.5 × 0.6
    tl.progress(1)
    expect(gsap.getProperty(h.lines[0]!, 'yPercent')).toBe(-105)
  })
})

function box(): HTMLElement {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}
const num = (el: Element, prop: string) => Number(gsap.getProperty(el, prop))
/** Seek to the end and back so every from-state is rendered, whatever GSAP deferred. */
const atStart = (tl: gsap.core.Timeline) => {
  tl.progress(1)
  tl.progress(0)
}

describe('reveal variants', () => {
  it('wipe grows scaleX from 0, anchored on the left edge throughout', () => {
    const tl = gsap.timeline({ paused: true })
    const el = box()
    const child = reveal(ctx, tl, { el }, 'wipe')
    expect(child.duration()).toBeCloseTo(0.5, 5)
    atStart(tl)
    expect(num(el, 'scaleX')).toBe(0)
    tl.progress(0.5)
    expect(el.style.transformOrigin).toBe('0% 50%')
    tl.progress(1)
    expect(num(el, 'scaleX')).toBe(1)
    expect(el.style.transformOrigin).toBe('0% 50%')
  })
  it('scale-in grows from 0.6 and fades in on the brand emphasis ease', () => {
    const tl = gsap.timeline({ paused: true })
    const el = box()
    const child = reveal({ ...ctx, emphasisEase: 'expo.out' }, tl, { el }, 'scale-in')
    expect(child.duration()).toBeCloseTo(0.5, 5)
    expect(child.getChildren()[0]!.vars.ease).toBe('expo.out')
    atStart(tl)
    expect(num(el, 'scale')).toBeCloseTo(0.6)
    expect(num(el, 'opacity')).toBe(0)
    tl.progress(1)
    expect(num(el, 'scale')).toBe(1)
    expect(num(el, 'opacity')).toBe(1)
  })
  it('soft goes from blurred, transparent and 0.98 to sharp over l on the enter ease', () => {
    const tl = gsap.timeline({ paused: true })
    const el = box()
    const child = reveal(ctx, tl, { el }, 'soft')
    expect(child.duration()).toBeCloseTo(0.8, 5)
    for (const t of child.getChildren()) expect(t.vars.ease).toBe('expo.out')
    atStart(tl)
    expect(num(el, 'opacity')).toBe(0)
    expect(num(el, 'scale')).toBeCloseTo(0.98)
    expect(el.style.filter).toBe('blur(16px)')
    tl.progress(1)
    expect(num(el, 'opacity')).toBe(1)
    expect(num(el, 'scale')).toBe(1)
    expect(el.style.filter).toBe('blur(0px)')
  })
  it('soft in reduced mode only fades, over xs', () => {
    const tl = gsap.timeline({ paused: true })
    const el = box()
    const child = reveal(reduced, tl, { el }, 'soft')
    expect(child.duration()).toBeCloseTo(0.15, 5)
    atStart(tl)
    expect(num(el, 'opacity')).toBe(0)
    expect(num(el, 'scale')).toBe(1)
    expect(el.style.filter).toBe('')
  })
  it('wipe and scale-in fall back to a fade in reduced mode', () => {
    for (const variant of ['wipe', 'scale-in'] as const) {
      const tl = gsap.timeline({ paused: true })
      const el = box()
      reveal(reduced, tl, { el }, variant)
      atStart(tl)
      expect(num(el, 'opacity')).toBe(0)
      expect(num(el, 'scaleX')).toBe(1)
      expect(num(el, 'scale')).toBe(1)
    }
  })
  it('takes raw elements and arrays of handles and elements, staggered', () => {
    const els = [box(), box(), box()]
    const tl = gsap.timeline({ paused: true })
    const child = reveal(ctx, tl, [els[0]!, { el: els[1]! }, els[2]!], 'scale-in', { stagger: 'tight' })
    expect(child.duration()).toBeCloseTo(0.5 + 2 * 0.04, 5)
    atStart(tl)
    for (const el of els) expect(num(el, 'scale')).toBeCloseTo(0.6)
    tl.progress(1)
    for (const el of els) expect(num(el, 'scale')).toBe(1)
    const single = box()
    const tl2 = gsap.timeline({ paused: true })
    reveal(ctx, tl2, single, 'words') // a raw element has no words: fade-up
    atStart(tl2)
    expect(num(single, 'opacity')).toBe(0)
    expect(num(single, 'y')).toBe(24)
  })
})

describe('exit variants', () => {
  it('mirrors wipe, scale-in and soft at 0.6 of their entry', () => {
    const tl = gsap.timeline({ paused: true })
    const [w, s, f] = [box(), box(), box()]
    expect(exit(ctx, tl, { el: w }, 'wipe').duration()).toBeCloseTo(0.3, 5)
    expect(exit(ctx, tl, { el: s }, 'scale-in').duration()).toBeCloseTo(0.3, 5)
    expect(exit(ctx, tl, { el: f }, 'soft').duration()).toBeCloseTo(0.48, 5)
    tl.progress(1)
    expect(num(w, 'scaleX')).toBe(0)
    expect(w.style.transformOrigin).toBe('100% 50%')
    expect(num(s, 'scale')).toBeCloseTo(0.6)
    expect(num(s, 'opacity')).toBe(0)
    expect(num(f, 'opacity')).toBe(0)
    expect(f.style.filter).toBe('blur(16px)')
    tl.progress(0)
    expect(num(w, 'scaleX')).toBe(1)
    expect(num(f, 'opacity')).toBe(1)
  })
})
