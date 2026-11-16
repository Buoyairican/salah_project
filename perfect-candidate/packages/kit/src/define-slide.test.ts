import { describe, it, expect } from 'vitest'
import { defineSlide } from './define-slide'

describe('defineSlide', () => {
  it('returns the definition when valid', () => {
    const def = defineSlide({ id: 'intro-1', claim: 'Une idée.', build() {} })
    expect(def.id).toBe('intro-1')
  })
  it('rejects non-kebab ids and empty claims', () => {
    expect(() => defineSlide({ id: 'Intro', claim: 'x', build() {} })).toThrow(TypeError)
    expect(() => defineSlide({ id: 'intro', claim: '', build() {} })).toThrow(TypeError)
  })
})
