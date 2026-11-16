import { describe, it, expect } from 'vitest'
import { nextPosition, prevPosition, clampPosition } from './position'

const counts = [2, 3, 1] // slide 0 has steps 0..1, slide 1 has 0..2, slide 2 has 0

describe('nextPosition', () => {
  it('advances a step inside a slide', () => {
    expect(nextPosition({ slide: 1, step: 0 }, counts)).toEqual({ slide: 1, step: 1 })
  })
  it('moves to step 0 of the next slide after the last step', () => {
    expect(nextPosition({ slide: 0, step: 1 }, counts)).toEqual({ slide: 1, step: 0 })
  })
  it('returns null at the end of the deck', () => {
    expect(nextPosition({ slide: 2, step: 0 }, counts)).toBeNull()
  })
})

describe('prevPosition', () => {
  it('goes back a step inside a slide', () => {
    expect(prevPosition({ slide: 1, step: 2 }, counts)).toEqual({ slide: 1, step: 1 })
  })
  it('enters the previous slide on its last step', () => {
    expect(prevPosition({ slide: 2, step: 0 }, counts)).toEqual({ slide: 1, step: 2 })
  })
  it('returns null at the start', () => {
    expect(prevPosition({ slide: 0, step: 0 }, counts)).toBeNull()
  })
})

describe('clampPosition', () => {
  it('clamps overflow, negatives and NaN', () => {
    expect(clampPosition({ slide: 98, step: 4 }, counts)).toEqual({ slide: 2, step: 0 })
    expect(clampPosition({ slide: 1, step: 7 }, counts)).toEqual({ slide: 1, step: 2 })
    expect(clampPosition({ slide: -1, step: -3 }, counts)).toEqual({ slide: 0, step: 0 })
    expect(clampPosition({ slide: NaN, step: NaN }, counts)).toEqual({ slide: 0, step: 0 })
  })
  it('returns 0/0 for an empty deck', () => {
    expect(clampPosition({ slide: 3, step: 3 }, [])).toEqual({ slide: 0, step: 0 })
  })
})
