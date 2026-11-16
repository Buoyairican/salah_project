// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { gsap } from 'gsap'
import { count } from './count'
import { createMotion } from './index'
import { statement } from '../components/statement'
import type { MotionContext } from './types'

const ctx: MotionContext = { brandTempo: 1, slideTempo: 'normal', reduced: false, risk: [], emphasisEase: 'back.out(1.2)' }
const make = (unit?: string) => statement(document.body, { value: 87, unit, caption: 'x' }, { language: 'fr' })

describe('count', () => {
  it('counts linearly over l with the statement unit, and restores the dash at the start', () => {
    const s = make('%')
    const tl = gsap.timeline({ paused: true })
    const child = count(ctx, tl, s, 0, 87)
    expect(child.duration()).toBeCloseTo(0.8, 5)
    expect(s.value.textContent).toBe('–')
    tl.progress(0.5)
    expect(s.value.textContent).toBe('44 %') // 43.5, linear
    tl.progress(1)
    expect(s.value.textContent).toBe('87 %')
    tl.progress(0)
    expect(s.value.textContent).toBe('–')
  })
  it('takes an explicit unit, counts down, and writes bare numbers when there is no unit', () => {
    const s = make('%')
    const tl = gsap.timeline({ paused: true })
    count(ctx, tl, s, 100, 40, { unit: 'pts' })
    tl.progress(1)
    expect(s.value.textContent).toBe('40 pts')
    const bare = make()
    const tl2 = gsap.timeline({ paused: true })
    count(ctx, tl2, bare, 0, 12)
    tl2.progress(1)
    expect(bare.value.textContent).toBe('12')
  })
  it('sits at the position parameter, honours a duration token, and collapses to xs when reduced', () => {
    const tl = gsap.timeline({ paused: true })
    tl.addLabel('step-0', 1)
    const child = count(ctx, tl, make('%'), 0, 87, { at: 'step-0', duration: 's' })
    expect(child.startTime()).toBeCloseTo(1, 5)
    expect(child.duration()).toBeCloseTo(0.3, 5)
    expect(count({ ...ctx, reduced: true }, gsap.timeline({ paused: true }), make('%'), 0, 87).duration()).toBeCloseTo(0.15, 5)
  })
  it('rejects non-finite bounds and is bound by createMotion', () => {
    expect(() => count(ctx, gsap.timeline(), make('%'), 0, NaN)).toThrow(RangeError)
    const s = make('%')
    const tl = gsap.timeline({ paused: true })
    createMotion(ctx).count(tl, s, 0, 87)
    tl.progress(1)
    expect(s.value.textContent).toBe('87 %')
  })
})
