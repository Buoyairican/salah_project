// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { split, center, fullBleed } from './layout'
import type { Ground } from './types'

describe('layout', () => {
  it('split creates a safe-area grid with two regions and the ratio', () => {
    const parent = document.createElement('div')
    const h = split(parent, { ratio: 0.4, gap: 6 })
    expect(h.el.parentElement).toBe(parent)
    expect(h.el.classList.contains('safe')).toBe(true)
    expect(h.el.classList.contains('layout-split')).toBe(true)
    expect(h.el.style.gridTemplateColumns).toBe('0.4fr 0.6fr')
    expect(h.el.style.columnGap).toBe('var(--space-6)')
    expect(h.left.parentElement).toBe(h.el)
    expect(h.right.parentElement).toBe(h.el)
  })
  it('split defaults to an even ratio and gap 8', () => {
    const h = split(document.createElement('div'))
    expect(h.el.style.gridTemplateColumns).toBe('0.5fr 0.5fr')
    expect(h.el.style.columnGap).toBe('var(--space-8)')
  })
  it('center creates a centred safe-area region', () => {
    const h = center(document.createElement('div'))
    expect(h.el.className).toBe('safe layout-center')
  })
  it('fullBleed covers the stage with a ground and puts a safe content region inside', () => {
    const parent = document.createElement('div')
    const h = fullBleed(parent, { ground: 'bg' })
    expect(h.el.parentElement).toBe(parent)
    expect(h.el.className).toBe('layout-fullbleed ground-bg')
    expect(h.ground).toBe('bg')
    expect(h.content.parentElement).toBe(h.el)
    expect(h.content.className).toBe('safe layout-fullbleed-content')
  })
  it('fullBleed marks the accent ground on-accent and the deep and gradient grounds on-dark', () => {
    const mark = (ground: Ground) => fullBleed(document.createElement('div'), { ground }).el.classList
    expect(mark('surface').contains('on-dark')).toBe(false)
    expect(mark('surface').contains('on-accent')).toBe(false)
    expect(mark('accent').contains('on-accent')).toBe(true)
    expect(mark('accent').contains('on-dark')).toBe(false)
    for (const g of ['deep', 'gradient'] as const) {
      expect(mark(g).contains(`ground-${g}`)).toBe(true)
      expect(mark(g).contains('on-dark')).toBe(true)
    }
  })
  it('fullBleed rejects an unknown ground', () => {
    expect(() => fullBleed(document.createElement('div'), { ground: 'lime' as Ground })).toThrow(RangeError)
  })
})
