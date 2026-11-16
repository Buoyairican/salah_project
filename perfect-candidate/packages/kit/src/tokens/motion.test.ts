import { describe, it, expect } from 'vitest'
import { durations, resolveDuration, resolveStagger, EXIT_RATIO, eases } from './motion'

const base = { brandTempo: 1, slideTempo: 'normal' as const, reduced: false }

describe('resolveDuration', () => {
  it('returns the token value at normal tempo', () => {
    expect(resolveDuration('m', base)).toBe(0.5)
  })
  it('scales by brand tempo and slide tempo', () => {
    expect(resolveDuration('m', { ...base, brandTempo: 1.2 })).toBeCloseTo(0.6)
    expect(resolveDuration('m', { ...base, slideTempo: 'brisk' })).toBeCloseTo(0.4)
    expect(resolveDuration('m', { ...base, brandTempo: 1.25, slideTempo: 'slow' })).toBeCloseTo(0.78125)
  })
  it('collapses to xs when reduced', () => {
    expect(resolveDuration('xl', { ...base, reduced: true })).toBe(durations.xs)
  })
  it('exit ratio is 0.6 and eases are the five named tokens', () => {
    expect(EXIT_RATIO).toBe(0.6)
    expect(Object.keys(eases).sort()).toEqual(['emphasis', 'enter', 'exit', 'move', 'soft'])
  })
})

describe('resolveStagger', () => {
  it('returns the token value, or 0 when reduced', () => {
    expect(resolveStagger('normal', base)).toBe(0.08)
    expect(resolveStagger('normal', { ...base, reduced: true })).toBe(0)
  })
})
