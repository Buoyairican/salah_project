// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { gsap } from 'gsap'
import { stepLabels, stepTimes, hasExit, seekExact, LabelError } from './labels'

function tlWith(labels: Array<[string, number]>) {
  const tl = gsap.timeline({ paused: true })
  const o = { v: 0 }
  tl.to(o, { v: 10, duration: 5 })
  for (const [name, time] of labels) tl.addLabel(name, time)
  return tl
}

describe('stepLabels', () => {
  it('returns step labels in numeric order', () => {
    const tl = tlWith([['step-2', 3], ['step-0', 1], ['step-1', 2], ['exit', 4]])
    expect(stepLabels(tl, 's')).toEqual(['step-0', 'step-1', 'step-2'])
    expect(stepTimes(tl, 's')).toEqual([1, 2, 3])
    expect(hasExit(tl)).toBe(true)
  })
  it('throws a LabelError naming the slide when step-0 is missing', () => {
    const tl = tlWith([['step-1', 2]])
    expect(() => stepLabels(tl, 'intro')).toThrow(LabelError)
    expect(() => stepLabels(tl, 'intro')).toThrow(/intro/)
  })
  it('throws on a gap', () => {
    const tl = tlWith([['step-0', 1], ['step-2', 3]])
    expect(() => stepLabels(tl, 'gap')).toThrow(/step-1/)
  })
  it('throws when labels go backwards in time', () => {
    const tl = tlWith([['step-0', 3], ['step-1', 1]])
    expect(() => stepLabels(tl, 'back')).toThrow(LabelError)
  })
})

describe('seekExact', () => {
  it('lands on the exact time and fires onUpdate', () => {
    let updates = 0
    const o = { v: 0 }
    const tl = gsap.timeline({ paused: true, onUpdate: () => updates++ })
    tl.to(o, { v: 10, duration: 2, ease: 'none' })
    seekExact(tl, 1)
    expect(tl.time()).toBeCloseTo(1, 5)
    expect(o.v).toBeCloseTo(5, 3)
    expect(updates).toBeGreaterThan(0)
  })
  it('works at the end of the timeline', () => {
    const o = { v: 0 }
    const tl = gsap.timeline({ paused: true })
    tl.to(o, { v: 10, duration: 2, ease: 'none' })
    seekExact(tl, 2)
    expect(o.v).toBe(10)
    expect(tl.time()).toBe(2)
  })
})
