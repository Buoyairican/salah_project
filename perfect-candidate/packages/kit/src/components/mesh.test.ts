// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mesh } from './mesh'
import { glow } from './glow'
import { fullBleed } from './layout'

const geometry = (blobs: HTMLElement[]) => blobs.map((b) => [b.style.left, b.style.top, b.style.width, b.style.height].join(' '))

describe('mesh', () => {
  it('goes in first, so a fullBleed content region paints above it', () => {
    const stage = document.createElement('div')
    const fb = fullBleed(stage, { ground: 'deep' })
    const m = mesh(fb.el)
    expect(fb.el.firstElementChild).toBe(m.el)
    expect(m.el.nextElementSibling).toBe(fb.content)
    expect(m.el.getAttribute('aria-hidden')).toBe('true')
    expect(fb.el.className).toBe('layout-fullbleed ground-deep on-dark') // the mesh adds no context
  })
  it('given a stage that holds a fullBleed, goes inside that ground, as a glow does', () => {
    const stage = document.createElement('div')
    const fb = fullBleed(stage, { ground: 'bg' })
    const m = mesh(stage, { tone: 'kraft' })
    expect(m.el.parentElement).toBe(fb.el)
    expect(fb.el.firstElementChild).toBe(m.el)
  })
  it('keeps a glow above it whichever comes first', () => {
    const a = document.createElement('div')
    const m1 = mesh(a)
    const g1 = glow(a, { x: 0, y: 0, size: 10 })
    expect(Array.from(a.children)).toEqual([m1.el, g1.el])
    const b = document.createElement('div')
    b.appendChild(document.createElement('p'))
    const g2 = glow(b, { x: 0, y: 0, size: 10 })
    const m2 = mesh(b)
    expect(Array.from(b.children).slice(0, 2)).toEqual([m2.el, g2.el])
  })
  it('names its tone, deep by default', () => {
    const parent = document.createElement('div')
    expect(mesh(parent).el.className).toBe('mesh mesh--deep')
    expect(mesh(parent, { tone: 'kraft' }).el.className).toBe('mesh mesh--kraft')
    expect(() => mesh(parent, { tone: 'accent' as 'deep' })).toThrow(RangeError)
  })
  it('makes 5 blobs by default and 3 to 6 on request, cycling the five colour roles', () => {
    const parent = document.createElement('div')
    const five = mesh(parent)
    expect(five.blobs).toHaveLength(5)
    expect(Array.from(five.el.children)).toEqual(five.blobs)
    expect(five.blobs.map((b) => b.className)).toEqual([1, 2, 3, 4, 5].map((k) => `mesh-blob mesh-blob--${k}`))
    expect(mesh(parent, { blobs: 3 }).blobs).toHaveLength(3)
    expect(mesh(parent, { blobs: 6 }).blobs.at(-1)!.className).toBe('mesh-blob mesh-blob--1')
    for (const blobs of [2, 7, 4.5, NaN]) expect(() => mesh(parent, { blobs })).toThrow(RangeError)
    expect(() => mesh(parent, { seed: 0.5 })).toThrow(/integer/)
  })
  it('sizes blobs as 900–1400 px circles spread over the stage', () => {
    const { blobs } = mesh(document.createElement('div'), { seed: 11, blobs: 6 })
    const centres: number[] = []
    for (const b of blobs) {
      const size = parseFloat(b.style.width)
      expect(b.style.height).toBe(b.style.width)
      expect(size).toBeGreaterThanOrEqual(900)
      expect(size).toBeLessThanOrEqual(1400)
      centres.push(parseFloat(b.style.left) + size / 2)
    }
    // One blob per sixth of the stage width, in a seeded order.
    const columns = centres.map((x) => Math.floor(x / 320)).sort((a, b) => a - b)
    expect(columns).toEqual([0, 1, 2, 3, 4, 5])
  })
  it('places blobs deterministically for a seed, differently for another', () => {
    const at = (seed: number) => geometry(mesh(document.createElement('div'), { seed }).blobs)
    expect(at(4)).toEqual(at(4))
    expect(at(4)).not.toEqual(at(5))
  })
})
