// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { footer } from './footer'

describe('footer', () => {
  it('appends a muted caption pinned to the bottom-left of the safe area', () => {
    const parent = document.createElement('div')
    const f = footer(parent, 'Groupe 1 · ENSA Kénitra')
    expect(f.el.tagName).toBe('P')
    expect(f.el.className).toBe('footer type-caption text-muted pin pin--bottom-left')
    expect(f.el.textContent).toBe('Groupe 1 · ENSA Kénitra')
    expect(f.el.parentElement).toBe(parent)
  })
  it('can pin to the bottom-right instead, and nowhere else', () => {
    expect(footer(document.body, 'x', { corner: 'bottom-right' }).el.classList.contains('pin--bottom-right')).toBe(true)
    expect(() => footer(document.body, 'x', { corner: 'top-left' as 'bottom-left' })).toThrow(RangeError)
  })
})
