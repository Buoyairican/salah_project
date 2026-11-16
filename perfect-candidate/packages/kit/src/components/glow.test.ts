// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { glow } from './glow'
import { fullBleed } from './layout'

describe('glow', () => {
  it('places a highlight glow centred on x, y with the size as diameter, behind its siblings', () => {
    const parent = document.createElement('div')
    const content = document.createElement('div')
    parent.appendChild(content)
    const g = glow(parent, { x: 1200, y: 400, size: 800 })
    expect(g.el.className).toBe('glow glow--highlight')
    expect(g.el.getAttribute('aria-hidden')).toBe('true')
    expect(parent.firstElementChild).toBe(g.el)
    expect(g.el.style.left).toBe('800px')
    expect(g.el.style.top).toBe('0px')
    expect(g.el.style.width).toBe('800px')
    expect(g.el.style.height).toBe('800px')
  })
  it('takes the accent colour and rejects a non-positive or non-finite geometry', () => {
    expect(glow(document.body, { x: 0, y: 0, size: 10, color: 'accent' }).el.className).toBe('glow glow--accent')
    expect(() => glow(document.body, { x: 0, y: 0, size: 0 })).toThrow(RangeError)
    expect(() => glow(document.body, { x: NaN, y: 0, size: 10 })).toThrow(RangeError)
    expect(() => glow(document.body, { x: 0, y: 0, size: 10, color: 'ink' as 'accent' })).toThrow(RangeError)
  })
  it('places a glow given a stage that holds a fullBleed ground inside that ground, so it is not covered', () => {
    const stage = document.createElement('div')
    const fb = fullBleed(stage, { ground: 'gradient' })
    const g = glow(stage, { x: 100, y: 100, size: 50 })
    expect(g.el.parentElement).toBe(fb.el)
    expect(fb.el.firstElementChild).toBe(g.el)
    expect(stage.querySelectorAll('.glow').length).toBe(1)
  })
  it('goes right after a mesh backdrop, which stays first and would otherwise cover it', () => {
    const fb = fullBleed(document.createElement('div'), { ground: 'deep' })
    const backdrop = document.createElement('div')
    backdrop.className = 'mesh mesh--deep'
    fb.el.insertBefore(backdrop, fb.el.firstChild)
    const g = glow(fb.el, { x: 0, y: 0, size: 10 })
    expect(Array.from(fb.el.children)).toEqual([backdrop, g.el, fb.content])
  })
})
