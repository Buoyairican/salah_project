// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { panel } from './panel'

describe('panel', () => {
  it('appends a solid surface card by default', () => {
    const parent = document.createElement('div')
    const p = panel(parent)
    expect(p.el.className).toBe('panel panel--solid')
    expect(p.el.parentElement).toBe(parent)
    expect(p.el.getAttribute('style')).toBeNull()
  })
  it('builds a glass panel', () => {
    expect(panel(document.body, { glass: true }).el.className).toBe('panel panel--glass')
  })
  it('turns padding and radius tokens into variables, and drops the shadow on request', () => {
    const p = panel(document.body, { padding: 8, radius: 'l', shadow: false })
    expect(p.el.style.padding).toBe('var(--space-8)')
    expect(p.el.style.borderRadius).toBe('var(--radius-l)')
    expect(p.el.className).toBe('panel panel--solid panel--flat')
  })
  it('rejects unknown tokens', () => {
    expect(() => panel(document.body, { padding: 5 as 4 })).toThrow(RangeError)
    expect(() => panel(document.body, { radius: 'xl' as 'l' })).toThrow(RangeError)
  })
})
