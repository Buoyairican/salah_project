// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { heading, text, eyebrow } from './text'

describe('heading', () => {
  it('creates a heading with the type class and splits words', () => {
    const parent = document.createElement('div')
    document.body.appendChild(parent)
    const h = heading(parent, 'Trois mots ici', { level: 'h1' })
    expect(h.el.tagName).toBe('H1')
    expect(h.el.classList.contains('type-h1')).toBe(true)
    expect(h.level).toBe('h1')
    expect(h.words).toHaveLength(3)
    expect(h.lines.length).toBeGreaterThanOrEqual(1)
    expect(h.lines[0]!.parentElement).not.toBe(h.el) // each line sits inside a mask wrapper
    expect(h.el.textContent?.replace(/\s+/g, ' ').trim()).toBe('Trois mots ici')
  })
  it('display levels render as h1 tags with their own class', () => {
    const h = heading(document.body, 'Titre', { level: 'display-1' })
    expect(h.el.tagName).toBe('H1')
    expect(h.el.classList.contains('type-display-1')).toBe(true)
  })
})

describe('heading hero', () => {
  it('accepts the hero level', () => {
    const h = heading(document.body, 'Corbatek', { level: 'hero' })
    expect(h.el.classList.contains('type-hero')).toBe(true)
  })
})

describe('text', () => {
  it('creates a body paragraph by default and a muted caption on request', () => {
    const p = text(document.body, 'Un paragraphe court.')
    expect(p.el.tagName).toBe('P')
    expect(p.el.classList.contains('type-body')).toBe(true)
    const cap = text(document.body, 'Note', { size: 'caption', muted: true })
    expect(cap.el.classList.contains('type-caption')).toBe(true)
    expect(cap.el.classList.contains('text-muted')).toBe(true)
    expect(cap.words).toHaveLength(1)
  })
})

describe('eyebrow', () => {
  it('builds a split caption-level label with only the eyebrow class', () => {
    const parent = document.createElement('div')
    document.body.appendChild(parent)
    const e = eyebrow(parent, 'Corbatek · La chaîne')
    expect(e.el.tagName).toBe('P')
    expect(e.el.className).toBe('eyebrow')
    expect(e.el.parentElement).toBe(parent)
    expect(e.level).toBe('caption')
    expect(e.words).toHaveLength(4)
    expect(e.lines.length).toBeGreaterThanOrEqual(1)
  })
})

describe('no-break spaces', () => {
  it('keeps a no-break space inside one word box, so a line cannot break there', () => {
    const p = text(document.body, 'Les pertes atteignent 20 à 40\u00a0%, pourquoi\u202f? « oui\u00a0»')
    const words = p.words.map((w) => w.textContent)
    expect(words).toContain('40\u00a0%,')
    expect(words).toContain('pourquoi\u202f?')
    expect(words).toContain('oui\u00a0»')
    expect(words).not.toContain('%,')
    expect(p.el.textContent).toContain('40\u00a0%')
  })
  it('still collapses ordinary white space the way the browser does', () => {
    const h = heading(document.body, '  Deux  espaces\n et\tligne ')
    expect(h.words.map((w) => w.textContent)).toEqual(['Deux', 'espaces', 'et', 'ligne'])
    expect(h.el.textContent?.trim()).toBe('Deux espaces et ligne')
  })
})
