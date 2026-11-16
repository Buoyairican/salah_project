// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { parseHash, formatHash, readHash, writeHash } from './hash-state'

describe('parseHash', () => {
  it('parses 1-based slide and 0-based step', () => {
    expect(parseHash('#/3/2')).toEqual({ slide: 2, step: 2 })
    expect(parseHash('#/1/0')).toEqual({ slide: 0, step: 0 })
  })
  it('returns null for garbage, slide 0 and partial hashes', () => {
    for (const h of ['', '#', '#/0/0', '#/abc', '#/2', '#/2/', '#/-1/0', '#/1/0/extra', '#1/0']) {
      expect(parseHash(h)).toBeNull()
    }
  })
})

describe('formatHash', () => {
  it('round-trips', () => {
    const pos = { slide: 4, step: 1 }
    expect(formatHash(pos)).toBe('#/5/1')
    expect(parseHash(formatHash(pos))).toEqual(pos)
  })
})

describe('readHash / writeHash', () => {
  it('writes with replaceState and reads back', () => {
    writeHash({ slide: 1, step: 3 })
    expect(window.location.hash).toBe('#/2/3')
    expect(readHash()).toEqual({ slide: 1, step: 3 })
  })
  it('skips the write when the hash is already current', () => {
    const spy = vi.spyOn(window.history, 'replaceState')
    writeHash({ slide: 2, step: 0 })
    writeHash({ slide: 2, step: 0 })
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })
})
