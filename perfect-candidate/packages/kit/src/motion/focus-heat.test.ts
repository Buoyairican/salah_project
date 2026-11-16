// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { gsap } from 'gsap'
import { focus } from './focus'
import { heat } from './heat'
import { createMotion } from './index'
import { heatmap } from '../components/heatmap'
import { statement } from '../components/statement'
import type { MotionContext } from './types'

const risk = ['#000000', '#404040', '#808080', '#c0c0c0', '#ffffff']
const ctx: MotionContext = { brandTempo: 1, slideTempo: 'normal', reduced: false, risk, emphasisEase: 'back.out(1.2)' }

describe('focus', () => {
  it('dims sibling cells and the legend, keeps the badge, scales the target, ramps saturation down from 1', () => {
    const hm = heatmap(document.body, { rows: 1, cols: 3, labels: ['a', 'b', 'c'], illustrative: true }, { language: 'fr' })
    const tl = gsap.timeline({ paused: true })
    focus(ctx, tl, hm.cell('r0c1'), [hm]) // a raw element as the target, a handle as the other
    tl.progress(1)
    expect(Number(gsap.getProperty(hm.cell('r0c0'), 'opacity'))).toBeCloseTo(0.25)
    expect(Number(gsap.getProperty(hm.cell('r0c2'), 'opacity'))).toBeCloseTo(0.25)
    expect(Number(gsap.getProperty(hm.legend, 'opacity'))).toBeCloseTo(0.25)
    expect(Number(gsap.getProperty(hm.badge!, 'opacity'))).toBe(1)
    expect(Number(gsap.getProperty(hm.cell('r0c1'), 'opacity'))).toBe(1)
    expect(Number(gsap.getProperty(hm.cell('r0c1'), 'scale'))).toBeCloseTo(1.06)
    tl.progress(0.25)
    expect(hm.cell('r0c0').style.filter).toMatch(/saturate\(0\.[4-9]/) // on its way down from 1, not up from 0
    tl.progress(0)
    expect(Number(gsap.getProperty(hm.cell('r0c0'), 'opacity'))).toBe(1)
  })
  it('spotlights several targets together and marks dimmed elements with a class that seeks reverse', () => {
    const hm = heatmap(document.body, { rows: 2, cols: 3, labels: ['a', 'b', 'c', 'd', 'e', 'f'], illustrative: true }, { language: 'fr' })
    const hot = [hm.cell('r0c0'), hm.cell('r1c0')]
    const cold = ['r0c1', 'r0c2', 'r1c1', 'r1c2'].map((id) => hm.cell(id))
    const dimmed = (el: Element) => el.classList.contains('is-dimmed')
    const opacity = (el: Element) => Number(gsap.getProperty(el, 'opacity'))
    const tl = gsap.timeline({ paused: true })
    focus(ctx, tl, hot, [hm, hot[0]!]) // an "other" that is itself a target is skipped
    tl.progress(1)
    for (const el of hot) {
      expect(opacity(el)).toBe(1)
      expect(Number(gsap.getProperty(el, 'scale'))).toBeCloseTo(1.06)
      expect(dimmed(el)).toBe(false)
    }
    for (const el of [...cold, hm.legend]) {
      expect(opacity(el)).toBeCloseTo(0.25)
      expect(dimmed(el)).toBe(true)
    }
    expect(opacity(hm.badge!)).toBe(1)
    expect(dimmed(hm.badge!)).toBe(false)
    expect(opacity(hm.el)).toBe(1) // ancestors of the targets stay untouched
    expect(opacity(hm.cells[0]!.parentElement!)).toBe(1)
    tl.progress(0)
    for (const el of [...cold, hm.legend]) {
      expect(opacity(el)).toBe(1)
      expect(dimmed(el)).toBe(false)
    }
    expect(Number(gsap.getProperty(hot[1]!, 'scale'))).toBe(1)
  })
  it('keeps a statement badge legible while dimming the caption', () => {
    const s = statement(document.body, { value: 87, unit: '%', caption: 'des chocs', illustrative: true }, { language: 'fr' })
    const tl = gsap.timeline({ paused: true })
    focus(ctx, tl, s.value, [s])
    tl.progress(1)
    expect(Number(gsap.getProperty(s.caption.el, 'opacity'))).toBeCloseTo(0.25)
    expect(Number(gsap.getProperty(s.badge!, 'opacity'))).toBe(1)
    expect(s.badge!.classList.contains('is-dimmed')).toBe(false)
  })
  it('does not scale in reduced mode', () => {
    const el = document.createElement('div')
    const other = document.createElement('div')
    document.body.append(el, other)
    const tl = gsap.timeline({ paused: true })
    focus({ ...ctx, reduced: true }, tl, { el }, [{ el: other }])
    tl.progress(1)
    expect(Number(gsap.getProperty(el, 'scale'))).toBe(1)
    expect(Number(gsap.getProperty(other, 'opacity'))).toBeCloseTo(0.25)
  })
})

describe('heat', () => {
  it('colours cells, counts values and restores the dash when scrubbed back', () => {
    const hm = heatmap(document.body, { rows: 1, cols: 2, labels: ['a', 'b'] }, { language: 'fr' })
    const tl = gsap.timeline({ paused: true })
    const child = heat(ctx, tl, hm, [0, 1])
    expect(child.duration()).toBeCloseTo(0.8 + 0.08, 5)
    tl.progress(1)
    expect(hm.values[0]!.textContent).toBe('0 %')
    expect(hm.values[1]!.textContent).toBe('100 %')
    expect(hm.cells[1]!.style.backgroundColor).toBe('rgb(255, 255, 255)')
    expect(hm.cells[0]!.classList.contains('hm-cell--on-dark')).toBe(true)
    expect(hm.cells[1]!.classList.contains('hm-cell--on-dark')).toBe(false)
    tl.progress(0)
    expect(hm.values[1]!.textContent).toBe('–')
    expect(hm.cells[0]!.classList.contains('hm-cell--on-dark')).toBe(false)
  })
  it('with alpha, fills cells with the translucent risk colour and an opaque top edge, and never sets on-dark', () => {
    const hm = heatmap(document.body, { rows: 1, cols: 2, labels: ['a', 'b'], style: 'glass' }, { language: 'fr' })
    const tl = gsap.timeline({ paused: true })
    heat(ctx, tl, hm, [0, 1], { alpha: 0.4 })
    tl.progress(1)
    expect(hm.cells[0]!.style.backgroundColor).toBe('rgba(0, 0, 0, 0.4)')
    expect(hm.cells[1]!.style.backgroundColor).toBe('rgba(255, 255, 255, 0.4)')
    expect(hm.cells[0]!.style.borderTopColor).toBe('rgb(0, 0, 0)')
    expect(hm.cells[1]!.style.borderTopColor).toBe('rgb(255, 255, 255)')
    expect(hm.cells[0]!.classList.contains('hm-cell--on-dark')).toBe(false) // black would flip text without alpha
    expect(hm.values[1]!.textContent).toBe('100 %')
    tl.progress(0)
    expect(hm.values[1]!.textContent).toBe('–')
    expect(hm.cells[0]!.classList.contains('hm-cell--on-dark')).toBe(false)
  })
  it('rejects an alpha outside 0..1', () => {
    const hm = heatmap(document.body, { rows: 1, cols: 1, labels: ['a'] }, { language: 'fr' })
    expect(() => heat(ctx, gsap.timeline(), hm, [0.5], { alpha: 1.5 })).toThrow(RangeError)
    expect(() => heat(ctx, gsap.timeline(), hm, [0.5], { alpha: NaN })).toThrow(RangeError)
  })
  it('rejects a value count mismatch', () => {
    const hm = heatmap(document.body, { rows: 1, cols: 2, labels: ['a', 'b'] }, { language: 'fr' })
    expect(() => heat(ctx, gsap.timeline(), hm, [0.5])).toThrow(RangeError)
  })
})

describe('createMotion', () => {
  it('binds the context to all six helpers', () => {
    const m = createMotion(ctx)
    expect(typeof m.reveal).toBe('function')
    expect(typeof m.exit).toBe('function')
    expect(typeof m.focus).toBe('function')
    expect(typeof m.heat).toBe('function')
    expect(typeof m.count).toBe('function')
    expect(typeof m.draw).toBe('function')
    const tl = gsap.timeline({ paused: true })
    const el = document.createElement('div')
    document.body.appendChild(el)
    const child = m.reveal(tl, { el }, 'fade-up', { duration: 's' })
    expect(child.duration()).toBeCloseTo(0.3, 5)
  })
})
